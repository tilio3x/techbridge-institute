import { Router } from "express";
import pool from "../db.js";
import { deleteEntraUser, updateEntraDisplayName } from "../services/entra.js";
import { sendEmail, tplStudentWelcome } from "../services/email.js";

const router = Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM student_profiles ORDER BY created_at DESC"
  );
  res.json(rows);
});

router.get("/:oid", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM student_profiles WHERE entra_oid = $1",
    [req.params.oid]
  );
  res.json(rows[0] || null);
});

router.post("/", async (req, res) => {
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
    RETURNING *, (xmax = 0) AS is_new
  `, [entra_oid, first_name, last_name, email, country_code, country_name, city,
      phone || null, date_of_birth || null, education || null, goals || null]);
  const saved = rows[0];
  updateEntraDisplayName(entra_oid, first_name, last_name).catch(() => {});
  if (saved.is_new && email) {
    sendEmail({
      to: email,
      subject: `Welcome to TechBridge Institute, ${first_name}!`,
      html: tplStudentWelcome({ firstName: first_name, lastName: last_name }),
    }).catch(() => {});
  }
  res.json(saved);
});

router.delete("/:oid", async (req, res) => {
  const { oid } = req.params;
  await pool.query("DELETE FROM student_profiles WHERE entra_oid = $1", [oid]);
  await deleteEntraUser(oid).catch(() => {});
  res.json({ success: true });
});

export default router;
