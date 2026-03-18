import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";
import pool from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Vendors
app.get("/api/vendors", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM vendors ORDER BY name");
  res.json(rows);
});

// Courses (with vendor info joined)
app.get("/api/courses", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*, v.name AS vendor_name, v.color AS vendor_color, v.logo AS vendor_logo
    FROM courses c
    JOIN vendors v ON v.id = c.vendor_id
    ORDER BY c.id
  `);
  res.json(rows);
});

// Schedule (with course info joined)
app.get("/api/schedule", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.*, c.code, c.title
    FROM schedule s
    JOIN courses c ON c.id = s.course_id
    ORDER BY s.id
  `);
  res.json(rows);
});

// Students (with enrollment count)
app.get("/api/students", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.*, COUNT(e.course_id)::int AS course_count
    FROM students s
    LEFT JOIN enrollments e ON e.student_id = s.id
    GROUP BY s.id
    ORDER BY s.name
  `);
  res.json(rows);
});

// Student enrollments
app.get("/api/students/:id/enrollments", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT e.*, c.code, c.title, c.vendor_id
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.student_id = $1
  `, [req.params.id]);
  res.json(rows);
});

// Enroll a student in a course
app.post("/api/enrollments", async (req, res) => {
  const { student_id, course_id } = req.body;
  await pool.query(
    "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [student_id, course_id]
  );
  await pool.query(
    "UPDATE courses SET enrolled = enrolled + 1 WHERE id = $1",
    [course_id]
  );
  res.json({ success: true });
});

// In production, serve the React build and handle client-side routing
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
