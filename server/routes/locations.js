import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM delivery_locations WHERE is_active = TRUE ORDER BY country_name, city, name"
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { name, type, address_line1, address_line2, city, state_province, country_code, country_name, postal_code, room_number, floor, building, capacity, platform, meeting_url, facilities, timezone, contact_name, contact_email, contact_phone, notes } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO delivery_locations (name, type, address_line1, address_line2, city, state_province, country_code, country_name, postal_code, room_number, floor, building, capacity, platform, meeting_url, facilities, timezone, contact_name, contact_email, contact_phone, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    RETURNING *
  `, [name, type || 'Physical', address_line1||null, address_line2||null, city||null, state_province||null, country_code||null, country_name||null, postal_code||null, room_number||null, floor||null, building||null, capacity||null, platform||null, meeting_url||null, facilities||null, timezone||'UTC', contact_name||null, contact_email||null, contact_phone||null, notes||null]);
  res.json(rows[0]);
});

router.put("/:id", async (req, res) => {
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

router.delete("/:id", async (req, res) => {
  await pool.query("UPDATE delivery_locations SET is_active = FALSE WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

router.get("/physical", async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, address_line1, address_line2, city, state_province, country_name, postal_code, room_number, building, floor, capacity, timezone, contact_name, contact_email, contact_phone
     FROM delivery_locations WHERE is_active = TRUE AND type = 'Physical' ORDER BY name`
  );
  res.json(rows);
});

export default router;
