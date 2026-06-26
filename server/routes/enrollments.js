import { Router } from "express";
import pool from "../db.js";
import { sendEmail, tplEnrollmentConfirmation } from "../services/email.js";

const router = Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT e.student_id, e.course_id,
           s.name AS student_name, s.email AS student_email,
           c.code, c.title, c.delivery,
           v.name AS vendor_name, v.color AS vendor_color
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN courses c ON c.id = e.course_id
    JOIN vendors v ON v.id = c.vendor_id
    ORDER BY c.title, s.name
  `);
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { student_id, course_id } = req.body;
  const result = await pool.query(
    "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
    [student_id, course_id]
  );
  if (result.rowCount > 0) {
    await pool.query("UPDATE courses SET enrolled = enrolled + 1 WHERE id = $1", [course_id]);
    pool.query(`
      SELECT s.name AS student_name, s.email AS student_email,
             c.title, c.code, c.delivery, c.next_start,
             v.name AS vendor_name,
             CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
             dl.name AS location_name
      FROM students s, courses c
      LEFT JOIN vendors v ON v.id = c.vendor_id
      LEFT JOIN instructors i ON i.id = c.instructor_id
      LEFT JOIN delivery_locations dl ON dl.id = c.delivery_location_id
      WHERE s.id = $1 AND c.id = $2
    `, [student_id, course_id]).then(({ rows }) => {
      const d = rows[0];
      if (d?.student_email) {
        sendEmail({
          to: d.student_email,
          subject: `Enrollment Confirmed: ${d.title}`,
          html: tplEnrollmentConfirmation({
            studentName: d.student_name,
            courseTitle: d.title,
            courseCode: d.code,
            vendorName: d.vendor_name,
            startDate: d.next_start,
            instructorName: d.instructor_name,
            locationName: d.location_name,
            deliveryType: d.delivery,
          }),
        }).catch(() => {});
      }
    }).catch(() => {});
  }
  res.json({ success: true, inserted: result.rowCount > 0 });
});

router.delete("/", async (req, res) => {
  const { student_id, course_id } = req.body;
  const result = await pool.query(
    "DELETE FROM enrollments WHERE student_id=$1 AND course_id=$2 RETURNING *",
    [student_id, course_id]
  );
  if (result.rowCount > 0) {
    await pool.query("UPDATE courses SET enrolled = GREATEST(enrolled - 1, 0) WHERE id = $1", [course_id]);
  }
  res.json({ success: true });
});

export default router;
