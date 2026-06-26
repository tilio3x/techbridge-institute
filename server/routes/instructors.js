import { Router } from "express";
import pool from "../db.js";
import { createEntraStaffUser } from "../services/entra.js";
import { sendEmail, tplInstructorWelcome } from "../services/email.js";

const router = Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM instructors ORDER BY last_name, first_name"
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { first_name, last_name, email, phone, title, bio, specializations, certifications, employment_type, status, hire_date, photo_url, linkedin_url, available_days, available_hours, availability_note } = req.body;

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

  if (upn && tempPassword && email) {
    sendEmail({
      to: email,
      subject: "Welcome to TechBridge Institute — Your Educator Account is Ready",
      html: tplInstructorWelcome({ firstName: first_name, lastName: last_name, upn, tempPassword }),
    }).catch(() => {});
  }

  res.json({ ...rows[0], upn, tempPassword, entraWarning });
});

router.put("/:id", async (req, res) => {
  const { first_name, last_name, email, phone, title, bio, specializations, certifications, employment_type, status, hire_date, photo_url, linkedin_url, available_days, available_hours, availability_note } = req.body;

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

router.delete("/:id", async (req, res) => {
  await pool.query("UPDATE instructors SET status = 'Inactive' WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

export default router;
