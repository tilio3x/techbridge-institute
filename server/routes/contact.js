import { Router } from "express";
import pool from "../db.js";
import { sendEmail, tplContactInquiry, tplContactConfirmation } from "../services/email.js";

const router = Router();

router.post("/", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Name, email, subject and message are required." });
  }
  const { rows } = await pool.query(
    `INSERT INTO contact_inquiries (name, email, phone, subject, message)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, email, phone || null, subject, message]
  );
  sendEmail({
    to: "info@techbridge.edu",
    subject: `New Contact Inquiry: ${subject}`,
    html: tplContactInquiry({ name, email, phone, subject, message }),
  }).catch(() => {});
  sendEmail({
    to: email,
    subject: "We received your inquiry — TechBridge Institute",
    html: tplContactConfirmation({ name, subject }),
  }).catch(() => {});
  res.json(rows[0]);
});

export default router;
