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

// ─── Staff Entra ID (tidisoft.com corporate tenant) ──────────────────────────

async function getStaffGraphToken() {
  const tenantId = process.env.ENTRA_STAFF_TENANT_ID;
  const clientId = process.env.ENTRA_STAFF_CLIENT_ID;
  const clientSecret = process.env.ENTRA_STAFF_CLIENT_SECRET;
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

function buildUpn(firstName, lastName) {
  const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  return `${normalize(firstName)}.${normalize(lastName)}@techbridge.academy`;
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const rand = (n) => chars[Math.floor(Math.random() * n)];
  return `TB-${Array.from({ length: 6 }, () => rand(chars.length)).join("")}#1`;
}

async function createEntraStaffUser(firstName, lastName) {
  const token = await getStaffGraphToken();
  if (!token) return null;
  const upn = buildUpn(firstName, lastName);
  const tempPassword = generateTempPassword();
  const res = await fetch("https://graph.microsoft.com/v1.0/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      accountEnabled: true,
      displayName: `${firstName} ${lastName}`,
      givenName: firstName,
      surname: lastName,
      userPrincipalName: upn,
      mailNickname: upn.split("@")[0],
      passwordProfile: { forceChangePasswordNextSignIn: true, password: tempPassword },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Graph API error ${res.status}`);
  }
  const user = await res.json();
  return { oid: user.id, upn, tempPassword };
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

// Courses (with vendor + instructor + location joined)
app.get("/api/courses", async (req, res) => {
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

// Instructors
app.get("/api/instructors", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM instructors ORDER BY last_name, first_name"
  );
  res.json(rows);
});

app.post("/api/instructors", async (req, res) => {
  const { first_name, last_name, email, phone, title, bio, specializations, certifications, employment_type, status, hire_date, photo_url, linkedin_url, available_days, available_hours, availability_note } = req.body;

  // Create Entra ID account in tidisoft.com tenant
  let entra_oid = null;
  let upn = null;
  let tempPassword = null;
  let entraWarning = null;
  try {
    const entraUser = await createEntraStaffUser(first_name, last_name);
    if (entraUser) {
      entra_oid = entraUser.oid;
      upn = entraUser.upn;
      tempPassword = entraUser.tempPassword;
    } else {
      entraWarning = "Staff Entra ID credentials are not configured. Set ENTRA_STAFF_TENANT_ID, ENTRA_STAFF_CLIENT_ID, and ENTRA_STAFF_CLIENT_SECRET in App Service settings.";
    }
  } catch (err) {
    entraWarning = err.message;
  }

  const { rows } = await pool.query(`
    INSERT INTO instructors (first_name, last_name, email, phone, title, bio, specializations, certifications, employment_type, status, hire_date, photo_url, linkedin_url, available_days, available_hours, availability_note, entra_oid)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *
  `, [first_name, last_name, email, phone||null, title||null, bio||null, specializations||[], certifications||[], employment_type||'Full-time', status||'Active', hire_date||null, photo_url||null, linkedin_url||null, available_days||[], available_hours||null, availability_note||null, entra_oid||null]);

  res.json({ ...rows[0], upn, tempPassword, entraWarning });
});

app.put("/api/instructors/:id", async (req, res) => {
  const { first_name, last_name, email, phone, title, bio, specializations, certifications, employment_type, status, hire_date, photo_url, linkedin_url, available_days, available_hours, availability_note } = req.body;

  // Check if this instructor already has an Entra account
  const { rows: existing } = await pool.query("SELECT entra_oid FROM instructors WHERE id = $1", [req.params.id]);
  const alreadyLinked = existing[0]?.entra_oid;

  let upn = null;
  let tempPassword = null;
  let entraWarning = null;
  let entra_oid = alreadyLinked || null;

  if (!alreadyLinked) {
    try {
      const entraUser = await createEntraStaffUser(first_name, last_name);
      if (entraUser) {
        entra_oid = entraUser.oid;
        upn = entraUser.upn;
        tempPassword = entraUser.tempPassword;
      } else {
        entraWarning = "Staff Entra ID credentials are not configured. Set ENTRA_STAFF_TENANT_ID, ENTRA_STAFF_CLIENT_ID, and ENTRA_STAFF_CLIENT_SECRET in App Service settings.";
      }
    } catch (err) {
      entraWarning = err.message;
    }
  }

  const { rows } = await pool.query(`
    UPDATE instructors SET
      first_name=$1, last_name=$2, email=$3, phone=$4, title=$5, bio=$6,
      specializations=$7, certifications=$8, employment_type=$9, status=$10,
      hire_date=$11, photo_url=$12, linkedin_url=$13, available_days=$14,
      available_hours=$15, availability_note=$16, entra_oid=$17
    WHERE id=$18 RETURNING *
  `, [first_name, last_name, email, phone||null, title||null, bio||null, specializations||[], certifications||[], employment_type||'Full-time', status||'Active', hire_date||null, photo_url||null, linkedin_url||null, available_days||[], available_hours||null, availability_note||null, entra_oid, req.params.id]);

  res.json({ ...rows[0], upn, tempPassword, entraWarning });
});

app.delete("/api/instructors/:id", async (req, res) => {
  await pool.query("UPDATE instructors SET status = 'Inactive' WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

// Delivery locations
app.get("/api/delivery-locations", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM delivery_locations WHERE is_active = TRUE ORDER BY country_name, city, name"
  );
  res.json(rows);
});

app.post("/api/delivery-locations", async (req, res) => {
  const { name, type, address_line1, address_line2, city, state_province, country_code, country_name, postal_code, room_number, floor, building, capacity, platform, meeting_url, facilities, timezone, contact_name, contact_email, contact_phone, notes } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO delivery_locations (name, type, address_line1, address_line2, city, state_province, country_code, country_name, postal_code, room_number, floor, building, capacity, platform, meeting_url, facilities, timezone, contact_name, contact_email, contact_phone, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    RETURNING *
  `, [name, type || 'Physical', address_line1||null, address_line2||null, city||null, state_province||null, country_code||null, country_name||null, postal_code||null, room_number||null, floor||null, building||null, capacity||null, platform||null, meeting_url||null, facilities||null, timezone||'UTC', contact_name||null, contact_email||null, contact_phone||null, notes||null]);
  res.json(rows[0]);
});

app.put("/api/delivery-locations/:id", async (req, res) => {
  const { name, type, address_line1, address_line2, city, state_province, country_code, country_name, postal_code, room_number, floor, building, capacity, platform, meeting_url, facilities, timezone, contact_name, contact_email, contact_phone, notes, is_active } = req.body;
  const { rows } = await pool.query(`
    UPDATE delivery_locations SET
      name=$1, type=$2, address_line1=$3, address_line2=$4, city=$5, state_province=$6,
      country_code=$7, country_name=$8, postal_code=$9, room_number=$10, floor=$11, building=$12,
      capacity=$13, platform=$14, meeting_url=$15, facilities=$16, timezone=$17,
      contact_name=$18, contact_email=$19, contact_phone=$20, notes=$21, is_active=$22
    WHERE id=$23 RETURNING *
  `, [name, type, address_line1||null, address_line2||null, city||null, state_province||null, country_code||null, country_name||null, postal_code||null, room_number||null, floor||null, building||null, capacity||null, platform||null, meeting_url||null, facilities||null, timezone||'UTC', contact_name||null, contact_email||null, contact_phone||null, notes||null, is_active !== false, req.params.id]);
  res.json(rows[0]);
});

app.delete("/api/delivery-locations/:id", async (req, res) => {
  await pool.query("UPDATE delivery_locations SET is_active = FALSE WHERE id = $1", [req.params.id]);
  res.json({ success: true });
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

// Create course
app.post("/api/courses", async (req, res) => {
  const { vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge, instructor_id, delivery_location_id } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO courses (vendor_id, code, title, level, duration, price, seats, enrolled, delivery, next_start, description, badge, instructor_id, delivery_location_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,$11,$12,$13)
    RETURNING *
  `, [vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge || '', instructor_id || null, delivery_location_id || null]);
  res.json(await courseWithDetails(rows[0].id));
});

// Update course
app.put("/api/courses/:id", async (req, res) => {
  const { vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge, instructor_id, delivery_location_id } = req.body;
  await pool.query(`
    UPDATE courses SET
      vendor_id=$1, code=$2, title=$3, level=$4, duration=$5,
      price=$6, seats=$7, delivery=$8, next_start=$9, description=$10, badge=$11,
      instructor_id=$12, delivery_location_id=$13
    WHERE id=$14
  `, [vendor_id, code, title, level, duration, price, seats, delivery, next_start, description, badge || '', instructor_id || null, delivery_location_id || null, req.params.id]);
  res.json(await courseWithDetails(req.params.id));
});

// Delete course (cascades schedule and enrollments)
app.delete("/api/courses/:id", async (req, res) => {
  await pool.query("DELETE FROM schedule WHERE course_id=$1", [req.params.id]);
  await pool.query("DELETE FROM enrollments WHERE course_id=$1", [req.params.id]);
  await pool.query("DELETE FROM courses WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

// All enrollments (admin view)
app.get("/api/enrollments", async (req, res) => {
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

// Enroll a student in a course
app.post("/api/enrollments", async (req, res) => {
  const { student_id, course_id } = req.body;
  const result = await pool.query(
    "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
    [student_id, course_id]
  );
  if (result.rowCount > 0) {
    await pool.query("UPDATE courses SET enrolled = enrolled + 1 WHERE id = $1", [course_id]);
  }
  res.json({ success: true, inserted: result.rowCount > 0 });
});

// Unenroll a student from a course
app.delete("/api/enrollments", async (req, res) => {
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

// In production, serve the React build and handle client-side routing
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
