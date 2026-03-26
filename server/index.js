import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";
import pool from "./db.js";

// ─── Graph API helper ─────────────────────────────────────────────────────────

async function getGraphToken() {
  const tenantId = process.env.ENTRA_TENANT_ID;
  const clientId = process.env.ENTRA_CLIENT_ID;
  const clientSecret = process.env.ENTRA_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;
  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );
  const { access_token } = await res.json();
  return access_token;
}

async function deleteEntraUser(oid) {
  const token = await getGraphToken();
  if (!token) return;
  await fetch(`https://graph.microsoft.com/v1.0/users/${oid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function updateEntraDisplayName(oid, firstName, lastName) {
  const token = await getGraphToken();
  if (!token) return;
  await fetch(`https://graph.microsoft.com/v1.0/users/${oid}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: `${firstName} ${lastName}`,
      givenName: firstName,
      surname: lastName,
    }),
  });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Vendors
app.get("/api/vendors", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM vendors ORDER BY name");
  res.json(rows);
});

// Courses (with vendor + instructor info joined)
app.get("/api/courses", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*, v.name AS vendor_name, v.color AS vendor_color, v.logo AS vendor_logo,
           i.id AS instructor_id, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name
    FROM courses c
    JOIN vendors v ON v.id = c.vendor_id
    LEFT JOIN instructors i ON i.id = c.instructor_id
    ORDER BY c.id
  `);
  res.json(rows);
});

// Instructors
app.get("/api/instructors", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, first_name, last_name, title, status FROM instructors WHERE status = 'Active' ORDER BY last_name, first_name"
  );
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

// List all student profiles (admin)
app.get("/api/profiles", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM student_profiles ORDER BY created_at DESC"
  );
  res.json(rows);
});

// Delete student profile + Entra account
app.delete("/api/profile/:oid", async (req, res) => {
  const { oid } = req.params;
  await pool.query("DELETE FROM student_profiles WHERE entra_oid = $1", [oid]);
  await deleteEntraUser(oid).catch(() => {});
  res.json({ success: true });
});

// Get student profile
app.get("/api/profile/:oid", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM student_profiles WHERE entra_oid = $1",
    [req.params.oid]
  );
  res.json(rows[0] || null);
});

// Create or update student profile
app.post("/api/profile", async (req, res) => {
  const { entra_oid, first_name, last_name, email, country_code, country_name, city, phone, date_of_birth, education, goals } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO student_profiles
      (entra_oid, first_name, last_name, email, country_code, country_name, city, phone, date_of_birth, education, goals)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (entra_oid) DO UPDATE SET
      first_name   = EXCLUDED.first_name,
      last_name    = EXCLUDED.last_name,
      email        = EXCLUDED.email,
      country_code = EXCLUDED.country_code,
      country_name = EXCLUDED.country_name,
      city         = EXCLUDED.city,
      phone        = COALESCE(EXCLUDED.phone, student_profiles.phone),
      date_of_birth = COALESCE(EXCLUDED.date_of_birth, student_profiles.date_of_birth),
      education    = COALESCE(EXCLUDED.education, student_profiles.education),
      goals        = COALESCE(EXCLUDED.goals, student_profiles.goals),
      updated_at   = NOW()
    RETURNING *
  `, [entra_oid, first_name, last_name, email, country_code, country_name, city,
      phone || null, date_of_birth || null, education || null, goals || null]);
  const saved = rows[0];
  // Fire-and-forget — don't block the response if Graph API is slow/unavailable
  updateEntraDisplayName(entra_oid, first_name, last_name).catch(() => {});
  res.json(saved);
});

const courseWithDetails = async (id) => {
  const { rows } = await pool.query(`
    SELECT c.*, v.name AS vendor_name, v.color AS vendor_color, v.logo AS vendor_logo,
           i.id AS instructor_id, i.first_name AS instructor_first_name, i.last_name AS instructor_last_name
    FROM courses c
    JOIN vendors v ON v.id = c.vendor_id
    LEFT JOIN instructors i ON i.id = c.instructor_id
    WHERE c.id = $1
  `, [id]);
  return rows[0];
};

// Create course
app.post("/api/courses", async (req, res) => {
  const { vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge, instructor_id } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO courses (vendor_id, code, title, level, duration, price, seats, enrolled, delivery, next_start, description, badge, instructor_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,$11,$12)
    RETURNING *
  `, [vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge || '', instructor_id || null]);
  res.json(await courseWithDetails(rows[0].id));
});

// Update course
app.put("/api/courses/:id", async (req, res) => {
  const { vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge, instructor_id } = req.body;
  await pool.query(`
    UPDATE courses SET
      vendor_id=$1, code=$2, title=$3, level=$4, duration=$5,
      price=$6, seats=$7, delivery=$8, next_start=$9, description=$10, badge=$11, instructor_id=$12
    WHERE id=$13
  `, [vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge || '', instructor_id || null, req.params.id]);
  res.json(await courseWithDetails(req.params.id));
});

// Delete course (cascades schedule and enrollments)
app.delete("/api/courses/:id", async (req, res) => {
  await pool.query("DELETE FROM schedule WHERE course_id=$1", [req.params.id]);
  await pool.query("DELETE FROM enrollments WHERE course_id=$1", [req.params.id]);
  await pool.query("DELETE FROM courses WHERE id=$1", [req.params.id]);
  res.json({ success: true });
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
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
