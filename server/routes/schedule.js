import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.*, c.code, c.title
    FROM schedule s
    JOIN courses c ON c.id = s.course_id
    ORDER BY s.id
  `);
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { course_id, day, time, instructor, room, type } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO schedule (course_id, day, time, instructor, room, type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [course_id, day, time, instructor || "", room || "", type]
  );
  res.json(rows[0]);
});

router.put("/:id", async (req, res) => {
  const { course_id, day, time, instructor, room, type } = req.body;
  const { rows } = await pool.query(
    "UPDATE schedule SET course_id=$1, day=$2, time=$3, instructor=$4, room=$5, type=$6 WHERE id=$7 RETURNING *",
    [course_id, day, time, instructor || "", room || "", type, req.params.id]
  );
  res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM schedule WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

export default router;
