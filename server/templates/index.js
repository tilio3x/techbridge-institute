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

export function tplStudentWelcome({ firstName, lastName }) {
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

export function tplEnrollmentConfirmation({ studentName, courseTitle, courseCode, vendorName, startDate, instructorName, locationName, deliveryType }) {
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

export function tplInstructorWelcome({ firstName, lastName, upn, tempPassword }) {
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

export function tplCourseReminder({ studentName, courseTitle, courseCode, vendorName, startDate, daysUntil, instructorName, locationName, deliveryType }) {
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

export function tplContactInquiry({ name, email, phone, subject, message }) {
  return emailWrapper(`
    <h1 style="color:#1e293b;font-size:24px;font-weight:900;margin:0 0 8px">New Contact Inquiry 📩</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px">A visitor has submitted an inquiry through the contact form.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="color:#334155;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">Inquiry Details</div>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap;vertical-align:top">Name</td><td style="color:#1e293b;font-size:13px;font-weight:600">${name}</td></tr>
        <tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap;vertical-align:top">Email</td><td style="color:#1e293b;font-size:13px;font-weight:600"><a href="mailto:${email}" style="color:#0ea5e9">${email}</a></td></tr>
        ${phone ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap;vertical-align:top">Phone</td><td style="color:#1e293b;font-size:13px;font-weight:600">${phone}</td></tr>` : ""}
        <tr><td style="color:#64748b;font-size:13px;padding:4px 16px 4px 0;white-space:nowrap;vertical-align:top">Subject</td><td style="color:#1e293b;font-size:13px;font-weight:600">${subject}</td></tr>
      </table>
    </div>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="color:#0369a1;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Message</div>
      <p style="color:#0c4a6e;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap">${message}</p>
    </div>
    <p style="color:#475569;font-size:14px;margin:0">Please respond to this inquiry at your earliest convenience.</p>
  `);
}

export function tplContactConfirmation({ name, subject }) {
  return emailWrapper(`
    <h1 style="color:#1e293b;font-size:24px;font-weight:900;margin:0 0 8px">Thank You, ${name}! 📬</h1>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px">We've received your inquiry and will get back to you soon.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px">
      <p style="color:#166534;font-size:14px;margin:0 0 8px"><strong>Subject:</strong> ${subject}</p>
      <p style="color:#15803d;font-size:14px;line-height:1.7;margin:0">
        Our team typically responds within 1–2 business days. If your matter is urgent, please call us at <strong>+1 (555) 234-5678</strong> during business hours (Mon–Fri 8am–6pm EST).
      </p>
    </div>
    <p style="color:#475569;font-size:14px;margin:0">— The TechBridge Team</p>
  `);
}
