import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";
import cron from "node-cron";
import { EmailClient } from "@azure/communication-email";
import pool from "./db.js";

// ─── Email (Azure Communication Services) ────────────────────────────────────

const acsClient = process.env.ACS_CONNECTION_STRING
  ? new EmailClient(process.env.ACS_CONNECTION_STRING)
  : null;

const SENDER = process.env.ACS_SENDER_EMAIL || "noreply@techbridge.academy";

async function sendEmail({ to, subject, html }) {
  if (!to) { console.warn("[Email] Skipped — no recipient"); return; }
  if (!acsClient) { console.warn("[Email] Skipped — ACS_CONNECTION_STRING not configured"); return; }
  try {
    console.log(`[Email] Sending "${subject}" to ${to}`);
    const poller = await acsClient.beginSend({
      senderAddress: SENDER,
      recipients: { to: [{ address: to }] },
      content: { subject, html },
    });
    const result = await poller.pollUntilDone();
    console.log(`[Email] Sent OK — messageId: ${result?.id}`);
  } catch (err) {
    console.error("[Email] Send error:", err.message, err.details ?? "");
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function emailWrapper(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center">
    <div style="font-size:28px;margin-bottom:8px">🖥️</div>
    <div style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px">TechBridge Institute</div>
    <div style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:4px">Empowering IT Careers</div>
  </td></tr>
  <!-- Body -->
  <tr><td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px">
    ${body}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
      © ${new Date().getFullYear()} TechBridge Institute &nbsp;·&nbsp; This is an automated message, please do not reply.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function tplStudentWelcome({ firstName, lastName }) {
  return emailWrapper(`
    <h1 style="color:#1e293b;font-size:24px;font-weight:900;margin:0 0 8px">Welcome, ${firstName}! 🎉</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px">Your TechBridge Institute account is ready.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px">
      <p style="color:#1e293b;font-size:14px;margin:0 0 12px">Hello <strong>${firstName} ${lastName}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0">
        Thank you for joining TechBridge Institute. Your profile has been set up and you can now browse our course catalog,
        register for IT certification programs, and track your learning progress — all from your personal dashboard.
      </p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr>
        <td style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px 20px">
          <div style="color:#0369a1;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">What's next?</div>
          <ul style="color:#0c4a6e;font-size:13px;margin:0;padding-left:20px;line-height:2">
            <li>Explore the course catalog</li>
            <li>Register for a certification program</li>
            <li>Complete your learning profile</li>
          </ul>
        </td>
      </tr>
    </table>
    <p style="color:#475569;font-size:14px;margin:0">We're excited to support your journey in IT. If you have questions, reach out to us at <a href="mailto:info@techbridge.edu" style="color:#0ea5e9">info@techbridge.edu</a>.</p>
    <p style="color:#475569;font-size:14px;margin:16px 0 0">— The TechBridge Team</p>
  `);
}

function tplEnrollmentConfirmation({ studentName, courseTitle, courseCode, vendorName, startDate, instructorName, locationName, deliveryType }) {
  const start = startDate ? new Date(startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD";
  return emailWrapper(`
    <h1 style="color:#1e293b;font-size:24px;font-weight:900;margin:0 0 8px">Enrollment Confirmed ✅</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px">You are registered for the following course.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="color:#166534;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Course Details</div>
      <div style="color:#15803d;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">${vendorName}</div>
      <div style="color:#14532d;font-size:18px;font-weight:900;margin-bottom:4px">${courseTitle}</div>
      <div style="color:#166534;font-size:12px;font-family:monospace;margin-bottom:16px">${courseCode}</div>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap">📅 Start Date</td><td style="color:#1e293b;font-size:13px;font-weight:600">${start}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap">🎓 Format</td><td style="color:#1e293b;font-size:13px;font-weight:600">${deliveryType || "TBD"}</td></tr>
        ${instructorName ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap">👨‍🏫 Instructor</td><td style="color:#1e293b;font-size:13px;font-weight:600">${instructorName}</td></tr>` : ""}
        ${locationName ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap">📍 Location</td><td style="color:#1e293b;font-size:13px;font-weight:600">${locationName}</td></tr>` : ""}
      </table>
    </div>
    <p style="color:#475569;font-size:14px;margin:0">Hello <strong>${studentName}</strong>, your enrollment has been confirmed. Please ensure you are prepared before the start date. Reach out to us at <a href="mailto:info@techbridge.edu" style="color:#0ea5e9">info@techbridge.edu</a> if you have any questions.</p>
    <p style="color:#475569;font-size:14px;margin:16px 0 0">— The TechBridge Team</p>
  `);
}

function tplInstructorWelcome({ firstName, lastName, upn, tempPassword }) {
  return emailWrapper(`
    <h1 style="color:#1e293b;font-size:24px;font-weight:900;margin:0 0 8px">Welcome to TechBridge, ${firstName}! 👨‍🏫</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px">Your instructor account has been created.</p>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px">
      Hello <strong>${firstName} ${lastName}</strong>, your TechBridge Institute instructor account is ready.
      Use the credentials below to sign in to the educator portal for the first time. You will be required to change your password on first login.
    </p>
    <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="color:#6b21a8;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">🔐 Your Login Credentials</div>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="color:#64748b;font-size:13px;padding:8px 16px 8px 0;white-space:nowrap;vertical-align:top">Username (UPN)</td>
          <td style="font-family:monospace;font-size:14px;font-weight:700;color:#581c87;background:#f3e8ff;border-radius:6px;padding:6px 12px">${upn}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:13px;padding:8px 16px 8px 0;white-space:nowrap;vertical-align:top">Temp Password</td>
          <td style="font-family:monospace;font-size:18px;font-weight:900;color:#581c87;background:#f3e8ff;border-radius:6px;padding:6px 12px;letter-spacing:2px">${tempPassword}</td>
        </tr>
      </table>
    </div>
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:14px 18px;margin-bottom:24px">
      <p style="color:#713f12;font-size:13px;margin:0">⚠️ This password is temporary. You must change it on your first login. Keep your credentials secure and do not share them.</p>
    </div>
    <p style="color:#475569;font-size:14px;margin:0">Sign in at the TechBridge portal using the <strong>Educator Sign In</strong> option. For support, contact IT at <a href="mailto:it@techbridge.edu" style="color:#0ea5e9">it@techbridge.edu</a>.</p>
    <p style="color:#475569;font-size:14px;margin:16px 0 0">— The TechBridge Team</p>
  `);
}

function tplCourseReminder({ studentName, courseTitle, courseCode, vendorName, startDate, daysUntil, instructorName, locationName, deliveryType }) {
  const start = startDate ? new Date(startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD";
  const urgency = daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;
  return emailWrapper(`
    <h1 style="color:#1e293b;font-size:24px;font-weight:900;margin:0 0 8px">Course Starting ${daysUntil === 1 ? "Tomorrow" : `in ${daysUntil} Days`} ⏰</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px">Your course begins ${urgency} — make sure you're ready!</p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="color:#9a3412;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Course Details</div>
      <div style="color:#c2410c;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">${vendorName}</div>
      <div style="color:#7c2d12;font-size:18px;font-weight:900;margin-bottom:4px">${courseTitle}</div>
      <div style="color:#9a3412;font-size:12px;font-family:monospace;margin-bottom:16px">${courseCode}</div>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap">📅 Start Date</td><td style="color:#1e293b;font-size:13px;font-weight:600">${start}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap">🎓 Format</td><td style="color:#1e293b;font-size:13px;font-weight:600">${deliveryType || "TBD"}</td></tr>
        ${instructorName ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap">👨‍🏫 Instructor</td><td style="color:#1e293b;font-size:13px;font-weight:600">${instructorName}</td></tr>` : ""}
        ${locationName ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap">📍 Location</td><td style="color:#1e293b;font-size:13px;font-weight:600">${locationName}</td></tr>` : ""}
      </table>
    </div>
    <p style="color:#475569;font-size:14px;margin:0">Hello <strong>${studentName}</strong>, this is a reminder that your course starts ${urgency}. If you have any questions or need to make changes to your enrollment, contact us at <a href="mailto:info@techbridge.edu" style="color:#0ea5e9">info@techbridge.edu</a>.</p>
    <p style="color:#475569;font-size:14px;margin:16px 0 0">— The TechBridge Team</p>
  `);
}

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

  if (upn && tempPassword && email) {
    sendEmail({
      to: email,
      subject: "Welcome to TechBridge Institute — Your Educator Account is Ready",
      html: tplInstructorWelcome({ firstName: first_name, lastName: last_name, upn, tempPassword }),
    }).catch(() => {});
  }

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

app.post("/api/schedule", async (req, res) => {
  const { course_id, day, time, instructor, room, type } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO schedule (course_id, day, time, instructor, room, type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [course_id, day, time, instructor || "", room || "", type]
  );
  res.json(rows[0]);
});

app.put("/api/schedule/:id", async (req, res) => {
  const { course_id, day, time, instructor, room, type } = req.body;
  const { rows } = await pool.query(
    "UPDATE schedule SET course_id=$1, day=$2, time=$3, instructor=$4, room=$5, type=$6 WHERE id=$7 RETURNING *",
    [course_id, day, time, instructor || "", room || "", type, req.params.id]
  );
  res.json(rows[0]);
});

app.delete("/api/schedule/:id", async (req, res) => {
  await pool.query("DELETE FROM schedule WHERE id=$1", [req.params.id]);
  res.json({ success: true });
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
    // Send enrollment confirmation — fire-and-forget
    pool.query(`
      SELECT s.name AS student_name, s.email AS student_email,
             c.title, c.code, c.delivery, c.next_start,
             v.name AS vendor_name,
             CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
             dl.name AS location_name
      FROM students s, courses c
      LEFT JOIN vendors v ON v.id = c.vendor_id
      LEFT JOIN instructors i ON i.id = c.instructor_id
      LEFT JOIN delivery_locations dl ON dl.id = c.delivery_location_id
      WHERE s.id = $1 AND c.id = $2
    `, [student_id, course_id]).then(({ rows }) => {
      const d = rows[0];
      if (d?.student_email) {
        sendEmail({
          to: d.student_email,
          subject: `Enrollment Confirmed: ${d.title}`,
          html: tplEnrollmentConfirmation({
            studentName: d.student_name,
            courseTitle: d.title,
            courseCode: d.code,
            vendorName: d.vendor_name,
            startDate: d.next_start,
            instructorName: d.instructor_name,
            locationName: d.location_name,
            deliveryType: d.delivery,
          }),
        }).catch(() => {});
      }
    }).catch(() => {});
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

// ─── Course reminder cron job (daily at 8:00 AM UTC) ─────────────────────────
cron.schedule("0 8 * * *", async () => {
  console.log("[Cron] Running course reminder job");
  try {
    const { rows } = await pool.query(`
      SELECT s.name AS student_name, s.email AS student_email,
             c.title, c.code, c.delivery, c.next_start,
             v.name AS vendor_name,
             CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
             dl.name AS location_name,
             (c.next_start - CURRENT_DATE) AS days_until
      FROM courses c
      JOIN enrollments e ON e.course_id = c.id
      JOIN students s ON s.id = e.student_id
      LEFT JOIN vendors v ON v.id = c.vendor_id
      LEFT JOIN instructors i ON i.id = c.instructor_id
      LEFT JOIN delivery_locations dl ON dl.id = c.delivery_location_id
      WHERE (c.next_start = CURRENT_DATE + INTERVAL '7 days'
         OR c.next_start = CURRENT_DATE + INTERVAL '1 day')
    `);
    console.log(`[Cron] Sending ${rows.length} reminder(s)`);
    for (const r of rows) {
      if (!r.student_email) continue;
      sendEmail({
        to: r.student_email,
        subject: `Reminder: ${r.title} starts ${r.days_until === 1 ? "tomorrow" : "in 7 days"}`,
        html: tplCourseReminder({
          studentName: r.student_name,
          courseTitle: r.title,
          courseCode: r.code,
          vendorName: r.vendor_name,
          startDate: r.next_start,
          daysUntil: Number(r.days_until),
          instructorName: r.instructor_name,
          locationName: r.location_name,
          deliveryType: r.delivery,
        }),
      }).catch(() => {});
    }
  } catch (err) {
    console.error("[Cron] Reminder job error:", err.message);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
