import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";
import cron from "node-cron";
import pool from "./db.js";
import { sendEmail, tplCourseReminder } from "./services/email.js";
import vendorRoutes from "./routes/vendors.js";
import courseRoutes from "./routes/courses.js";
import instructorRoutes from "./routes/instructors.js";
import locationRoutes from "./routes/locations.js";
import scheduleRoutes from "./routes/schedule.js";
import studentRoutes from "./routes/students.js";
import enrollmentRoutes from "./routes/enrollments.js";
import profileRoutes from "./routes/profiles.js";
import contactRoutes from "./routes/contact.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/vendors", vendorRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/delivery-locations", locationRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/contact", contactRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
}

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
