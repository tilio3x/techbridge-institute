import { Router } from "express";
import pool from "../db.js";

const router = Router();

const courseWithDetails = async (id) => {
  const { rows } = await pool.query(`
    SELECT c.*, v.name AS vendor_name, v.color AS vendor_color, v.logo AS vendor_logo,
           i.id AS instructor_id, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name,
           dl.id AS loc_id, dl.name AS loc_name, dl.type AS loc_type,
           dl.city AS loc_city, dl.country_name AS loc_country, dl.room_number AS loc_room,
           dl.building AS loc_building, dl.floor AS loc_floor, dl.capacity AS loc_capacity,
           dl.platform AS loc_platform, dl.timezone AS loc_timezone
    FROM courses c
    JOIN vendors v ON v.id = c.vendor_id
    LEFT JOIN instructors i ON i.id = c.instructor_id
    LEFT JOIN delivery_locations dl ON dl.id = c.delivery_location_id
    WHERE c.id = $1
  `, [id]);
  return rows[0];
};

router.get("/", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*, v.name AS vendor_name, v.color AS vendor_color, v.logo AS vendor_logo,
           i.id AS instructor_id, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name,
           dl.id AS loc_id, dl.name AS loc_name, dl.type AS loc_type,
           dl.city AS loc_city, dl.country_name AS loc_country, dl.room_number AS loc_room,
           dl.building AS loc_building, dl.floor AS loc_floor, dl.capacity AS loc_capacity,
           dl.platform AS loc_platform, dl.timezone AS loc_timezone
    FROM courses c
    JOIN vendors v ON v.id = c.vendor_id
    LEFT JOIN instructors i ON i.id = c.instructor_id
    LEFT JOIN delivery_locations dl ON dl.id = c.delivery_location_id
    ORDER BY c.id
  `);
  res.json(rows);
});

router.post("/", async (req, res) => {
  try {
    const { vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge, instructor_id, delivery_location_id } = req.body;
    if (!vendor_id || !code || !title || !level || !duration || !next_start) {
      return res.status(400).json({ error: "Missing required fields: vendor, code, title, level, duration, start date" });
    }
    const { rows } = await pool.query(`
      INSERT INTO courses (vendor_id, code, title, level, duration, price, seats, enrolled, delivery, next_start, description, badge, instructor_id, delivery_location_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge || '', instructor_id || null, delivery_location_id || null]);
    res.json(await courseWithDetails(rows[0].id));
  } catch (err) {
    console.error("POST /api/courses error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge, instructor_id, delivery_location_id } = req.body;
    await pool.query(`
      UPDATE courses SET
        vendor_id=$1, code=$2, title=$3, level=$4, duration=$5,
        price=$6, seats=$7, delivery=$8, next_start=$9, description=$10, badge=$11,
        instructor_id=$12, delivery_location_id=$13
      WHERE id=$14
    `, [vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge || '', instructor_id || null, delivery_location_id || null, req.params.id]);
    res.json(await courseWithDetails(req.params.id));
  } catch (err) {
    console.error("PUT /api/courses error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM schedule WHERE course_id=$1", [req.params.id]);
  await pool.query("DELETE FROM enrollments WHERE course_id=$1", [req.params.id]);
  await pool.query("DELETE FROM courses WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

export default router;
