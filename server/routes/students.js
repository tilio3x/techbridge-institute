import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.*, COUNT(e.course_id)::int AS course_count
    FROM students s
    LEFT JOIN enrollments e ON e.student_id = s.id
    GROUP BY s.id
    ORDER BY s.name
  `);
  res.json(rows);
});

router.get("/:id/enrollments", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT e.*, c.code, c.title, c.vendor_id
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.student_id = $1
  `, [req.params.id]);
  res.json(rows);
});

export default router;
