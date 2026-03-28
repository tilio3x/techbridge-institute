import { useState, useEffect, useRef } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest, staffMsalInstance, staffLoginRequest } from "./auth/msalConfig.js";
import { Country, City } from "country-state-city";

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const INTEGRATIONS = [
  { name: "MS Teams", icon: "💬", desc: "Live sessions & collaboration" },
  { name: "OneNote", icon: "📓", desc: "Shared course notebooks" },
  { name: "Moodle LMS", icon: "🎓", desc: "Course content & assignments" },
  { name: "SkillJa", icon: "⚡", desc: "Skills assessment & labs" },
  { name: "NotebookLM", icon: "🤖", desc: "AI-powered study guides" },
  { name: "M365", icon: "☁️", desc: "Student accounts & email" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const levelColor = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" };

const TIMEZONES = (() => {
  const now = new Date();
  return Intl.supportedValuesOf("timeZone")
    .map(tz => {
      try {
        const parts = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(now);
        const offset = parts.find(p => p.type === "timeZoneName")?.value?.replace("GMT", "UTC") ?? "UTC";
        return { tz, label: `${offset} · ${tz.replace(/_/g, " ")}` };
      } catch {
        return { tz, label: `UTC · ${tz.replace(/_/g, " ")}` };
      }
    })
    .sort((a, b) => {
      const toMin = s => { const m = s.label.match(/UTC([+-])(\d+)(?::(\d+))?/); return m ? (m[1] === "+" ? 1 : -1) * (parseInt(m[2]) * 60 + parseInt(m[3] ?? 0)) : 0; };
      return toMin(a) - toMin(b);
    });
})();

function normalizeCourse(c) {
  return {
    id: c.id,
    vendor: c.vendor_id,
    code: c.code,
    title: c.title,
    level: c.level,
    duration: c.duration,
    price: Number(c.price),
    seats: c.seats,
    enrolled: c.enrolled,
    delivery: c.delivery,
    nextStart: c.next_start,
    description: c.description,
    badge: c.badge || "",
    vendorName: c.vendor_name,
    vendorColor: c.vendor_color,
    vendorLogo: c.vendor_logo,
    instructorId: c.instructor_id || null,
    instructorName: c.instructor_first_name
      ? `${c.instructor_first_name} ${c.instructor_last_name}`
      : null,
    locationId: c.loc_id || null,
    locationName: c.loc_name || null,
    locationType: c.loc_type || null,
    locationCity: c.loc_city || null,
    locationCountry: c.loc_country || null,
    locationRoom: c.loc_room || null,
    locationBuilding: c.loc_building || null,
    locationFloor: c.loc_floor || null,
    locationCapacity: c.loc_capacity || null,
    locationPlatform: c.loc_platform || null,
    locationTimezone: c.loc_timezone || null,
  };
}

function normalizeSchedule(s) {
  return {
    id: s.id,
    courseId: s.course_id,
    day: s.day,
    time: s.time,
    instructor: s.instructor,
    room: s.room,
    type: s.type,
  };
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Badge({ text, color = "#0ea5e9" }) {
  if (!text) return null;
  const colors = { Hot: "#ef4444", New: "#22c55e", Core: "#8b5cf6" };
  const bg = colors[text] || color;
  return (
    <span style={{ background: bg, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>
      {text}
    </span>
  );
}

function CourseCard({ course, onEnroll, isEnrolled }) {
  const vendor = { name: course.vendorName, color: course.vendorColor, logo: course.vendorLogo };
  const seatsLeft = course.seats - course.enrolled;
  return (
    <div className="course-card" style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      transition: "transform 0.2s, border-color 0.2s",
      cursor: "default",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: vendor.color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{vendor.logo}</span>
          <span style={{ color: vendor.color, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace" }}>{vendor.name}</span>
        </div>
        <Badge text={course.badge} />
      </div>
      <div>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: "#64748b", marginBottom: 4 }}>{course.code}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 }}>{course.title}</div>
      </div>
      <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{course.description}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Chip text={course.level} color={levelColor[course.level]} />
        <Chip text={course.delivery} color="#0ea5e9" />
        <Chip text={course.duration} color="#8b5cf6" />
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>${course.price.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Starts {new Date(course.nextStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {seatsLeft} seats left</div>
        </div>
        <button
          onClick={() => onEnroll(course)}
          style={{
            background: isEnrolled ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
            color: isEnrolled ? "#22c55e" : "#fff",
            border: isEnrolled ? "1px solid #22c55e" : "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: 13,
            cursor: isEnrolled ? "default" : "pointer",
          }}>
          {isEnrolled ? "✓ Enrolled" : "Enroll Now"}
        </button>
      </div>
    </div>
  );
}

function Chip({ text, color }) {
  return (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{text}</span>
  );
}

function SignInSelector({ onStudentLogin, onStaffLogin, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
      <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 40, width: "100%", maxWidth: 780 }}>
        <div style={{ position: "relative", textAlign: "center", marginBottom: 32 }}>
          <div style={{ color: "#0ea5e9", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>TechBridge Institute</div>
          <h2 style={{ color: "#f1f5f9", fontWeight: 900, fontSize: 22, margin: 0, fontFamily: "Georgia, serif" }}>Welcome — how would you like to sign in?</h2>
          <button onClick={onClose} style={{ position: "absolute", top: 0, right: 0, background: "rgba(255,255,255,0.05)", border: "none", color: "#64748b", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* Student card */}
          <div style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 34 }}>🎓</div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Student</div>
              <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>Sign in to access your courses, dashboard, and certifications. New students can register here.</div>
            </div>
            <button onClick={() => { onClose(); onStudentLogin(); }} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: "auto" }}>
              Student Sign In / Register
            </button>
          </div>

          {/* Educator card */}
          <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 34 }}>👨‍🏫</div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Educator</div>
              <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>Sign in with your institution Microsoft 365 account. Educator accounts are provisioned by HR.</div>
            </div>
            <button onClick={onStaffLogin} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: "auto" }}>
              Educator Sign In
            </button>
          </div>

          {/* Site Admin card */}
          <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 34 }}>🛡️</div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Site Admin</div>
              <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>Sign in with your institution Microsoft 365 account. Admin access is granted by IT.</div>
            </div>
            <button onClick={onStaffLogin} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: "auto" }}>
              Admin Sign In
            </button>
          </div>
        </div>

        <p style={{ color: "#475569", fontSize: 12, textAlign: "center", marginTop: 24, marginBottom: 0 }}>
          Educators & admins — don't have an account? Contact HR or IT to start the onboarding process.
        </p>
      </div>
    </div>
  );
}

function AuthWall({ onLogin, message }) {
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 56 }}>🔒</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Authentication Required</h2>
      <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 400, margin: 0 }}>{message}</p>
      <button onClick={onLogin} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 36px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        Sign In / Register
      </button>
    </div>
  );
}

// ─── VIEWS ───────────────────────────────────────────────────────────────────

function HomeView({ onNav, vendors, courses }) {
  return (
    <div>
      {/* Hero */}
      <div style={{
        minHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "80px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(14,165,233,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.02) 40px)", pointerEvents: "none" }} />

        <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)", borderRadius: 30, padding: "6px 18px", marginBottom: 32, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>Now enrolling — Spring 2026 cohorts open</span>
        </div>

        <h1 style={{
          fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
          fontWeight: 900,
          fontFamily: "'Georgia', serif",
          lineHeight: 1.05,
          margin: "0 0 24px",
          maxWidth: 900,
          letterSpacing: -2,
        }}>
          <span style={{ color: "#f1f5f9" }}>Launch Your </span>
          <span style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>IT Career</span>
          <span style={{ color: "#f1f5f9" }}> with Confidence</span>
        </h1>

        <p style={{ fontSize: 20, color: "#94a3b8", maxWidth: 680, lineHeight: 1.7, marginBottom: 48 }}>
          Industry-recognized certifications from CompTIA, Microsoft, Cisco, Fortinet & Ubiquiti.
          Hybrid delivery, real-world labs, and job-ready skills from day one.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => onNav("courses")} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 14, padding: "16px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 32px rgba(14,165,233,0.3)" }}>
            Browse Courses →
          </button>
          <button onClick={() => onNav("register")} style={{ background: "rgba(255,255,255,0.05)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "16px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            Register Today
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 48, marginTop: 80, flexWrap: "wrap", justifyContent: "center" }}>
          {[[`${courses.length}+`, "Courses Available"], [`${vendors.length}`, "Vendor Partners"], ["Hybrid", "Delivery Model"], ["M365", "Student Accounts"]].map(([val, lbl]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "Georgia, serif", color: "#0ea5e9" }}>{val}</div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendors */}
      <div style={{ padding: "60px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", margin: "0 0 8px" }}>Certification Tracks</h2>
          <p style={{ color: "#64748b", fontSize: 16 }}>World-class vendor partnerships for recognized credentials</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {vendors.map((v) => {
            const count = courses.filter(c => c.vendor === v.id).length;
            return (
              <div key={v.id} onClick={() => onNav("courses")} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${v.color}33`, borderRadius: 16, padding: 28, textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{v.logo}</div>
                <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{v.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{count} course{count !== 1 ? "s" : ""}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integrations */}
      <div style={{ padding: "60px 24px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: "0 0 8px" }}>Powered by Best-in-Class Tools</h2>
            <p style={{ color: "#64748b" }}>Seamlessly integrated learning ecosystem</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {INTEGRATIONS.map((int) => (
              <div key={int.name} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{int.icon}</div>
                <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14, marginBottom: 4 }}>{int.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{int.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoursesView({ enrolledCourses, onEnroll, vendors, courses }) {
  const [filter, setFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");

  const filtered = courses.filter(c => {
    if (filter !== "all" && c.vendor !== filter) return false;
    if (levelFilter !== "all" && c.level !== levelFilter) return false;
    if (deliveryFilter !== "all" && c.delivery !== deliveryFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", marginBottom: 8, fontFamily: "Georgia, serif" }}>Course Catalog</h2>
      <p style={{ color: "#64748b", marginBottom: 32 }}>{courses.length} courses across {vendors.length} certification tracks</p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ id: "all", name: "All Vendors" }, ...vendors].map(v => (
            <button key={v.id} onClick={() => setFilter(v.id)} style={{
              background: filter === v.id ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.03)",
              color: filter === v.id ? "#0ea5e9" : "#94a3b8",
              border: filter === v.id ? "1px solid #0ea5e9" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>{v.name || "All Vendors"}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "Beginner", "Intermediate", "Advanced"].map(l => (
            <button key={l} onClick={() => setLevelFilter(l)} style={{
              background: levelFilter === l ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
              color: levelFilter === l ? "#818cf8" : "#64748b",
              border: levelFilter === l ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>{l === "all" ? "All Levels" : l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "Online", "Hybrid", "In-Person"].map(d => (
            <button key={d} onClick={() => setDeliveryFilter(d)} style={{
              background: deliveryFilter === d ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.03)",
              color: deliveryFilter === d ? "#22c55e" : "#64748b",
              border: deliveryFilter === d ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>{d === "all" ? "All Delivery" : d}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {filtered.map(course => (
          <CourseCard key={course.id} course={course} onEnroll={onEnroll} isEnrolled={enrolledCourses.includes(course.id)} />
        ))}
      </div>
    </div>
  );
}

function ScheduleView({ schedule, courses }) {
  const courseById = (id) => courses.find(c => c.id === id);

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", marginBottom: 8, fontFamily: "Georgia, serif" }}>Class Schedule</h2>
      <p style={{ color: "#64748b", marginBottom: 36 }}>Spring 2026 · All times local</p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {["Course", "Vendor", "Days", "Time", "Instructor", "Room / Platform", "Format", "Seats", "Start Date"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map((s, i) => {
              const course = courseById(s.courseId);
              if (!course) return null;
              return (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td style={{ padding: "16px", color: "#f1f5f9", fontWeight: 600 }}>
                    <div>{course.title}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{course.code}</div>
                  </td>
                  <td style={{ padding: "16px" }}><span style={{ color: course.vendorColor, fontWeight: 700, fontSize: 12 }}>{course.vendorName}</span></td>
                  <td style={{ padding: "16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 13 }}>{s.day}</td>
                  <td style={{ padding: "16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 13 }}>{s.time}</td>
                  <td style={{ padding: "16px", color: "#e2e8f0" }}>{s.instructor}</td>
                  <td style={{ padding: "16px", color: "#94a3b8", fontSize: 13 }}>{s.room}</td>
                  <td style={{ padding: "16px" }}><Chip text={s.type} color={s.type === "Online" ? "#0ea5e9" : s.type === "Hybrid" ? "#8b5cf6" : "#f59e0b"} /></td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>{course.seats - course.enrolled}</span>
                      <span style={{ color: "#64748b" }}> / {course.seats}</span>
                    </div>
                  </td>
                  <td style={{ padding: "16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 13 }}>
                    {new Date(course.nextStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 40, background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 24, border: "1px solid rgba(255,255,255,0.07)" }}>
        <h3 style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Delivery Format Legend</h3>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[
            { type: "Hybrid", desc: "In-person lab sessions + MS Teams for remote students", icon: "🏫" },
            { type: "Online", desc: "Fully virtual via MS Teams, Moodle & SkillJa", icon: "💻" },
            { type: "In-Person", desc: "On-site lab-intensive sessions with hands-on equipment", icon: "🔧" },
          ].map(d => (
            <div key={d.type} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>{d.icon}</span>
              <div>
                <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>{d.type}</div>
                <div style={{ color: "#64748b", fontSize: 13, maxWidth: 260 }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegisterView({ enrolledCourses, onEnroll, courses }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", dob: "", education: "", goals: "", selectedCourses: [] });
  const [submitted, setSubmitted] = useState(false);

  const courseById = (id) => courses.find(c => c.id === id);

  const toggle = (id) => {
    setForm(f => ({
      ...f,
      selectedCourses: f.selectedCourses.includes(id)
        ? f.selectedCourses.filter(x => x !== id)
        : [...f.selectedCourses, id]
    }));
  };

  const submit = () => {
    form.selectedCourses.forEach(id => onEnroll(courseById(id)));
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ padding: "80px 24px", textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
      <h2 style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", marginBottom: 16 }}>Registration Complete!</h2>
      <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
        Welcome, <strong style={{ color: "#f1f5f9" }}>{form.firstName}</strong>! Your application has been submitted.
        You'll receive a confirmation email shortly with your <strong style={{ color: "#0ea5e9" }}>Microsoft 365 account credentials</strong> ({form.firstName.toLowerCase()}.{form.lastName.toLowerCase()}@trainee.edu).
      </p>
      <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 16, padding: 24, textAlign: "left" }}>
        <h3 style={{ color: "#0ea5e9", fontWeight: 700, marginBottom: 16 }}>📋 Next Steps</h3>
        {["Check email for M365 account setup instructions", "Access Moodle LMS with your student credentials", "Join your course Teams channels", "Review your course schedule and first assignment", "Set up your OneNote class notebook"].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, color: "#94a3b8", fontSize: 14 }}>
            <span style={{ color: "#22c55e", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span> {s}
          </div>
        ))}
      </div>
    </div>
  );

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#f1f5f9",
    fontSize: 15,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = { color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" };

  return (
    <div style={{ padding: "40px 24px", maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", marginBottom: 8, fontFamily: "Georgia, serif" }}>Student Registration</h2>
      <p style={{ color: "#64748b", marginBottom: 36 }}>Complete all steps to enroll. A Microsoft 365 account will be created for you.</p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: 40 }}>
        {["Personal Info", "Select Courses", "Review & Submit"].map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: step > i + 1 ? "#22c55e" : step === i + 1 ? "#0ea5e9" : "rgba(255,255,255,0.1)",
                color: step >= i + 1 ? "#fff" : "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: step === i + 1 ? "#f1f5f9" : "#64748b" }}>{s}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? "#22c55e" : "rgba(255,255,255,0.1)", margin: "0 12px" }} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[["firstName", "First Name", "text"], ["lastName", "Last Name", "text"], ["email", "Email Address", "email"], ["phone", "Phone Number", "tel"], ["dob", "Date of Birth", "date"]].map(([key, label, type]) => (
            <div key={key} style={{ gridColumn: key === "email" || key === "dob" ? "span 1" : undefined }}>
              <label style={labelStyle}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} placeholder={label} />
            </div>
          ))}
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Highest Education Level</label>
            <select value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} style={{ ...inputStyle }}>
              <option value="">Select...</option>
              {["High School Diploma / GED", "Some College", "Associate Degree", "Bachelor's Degree", "Master's or Higher", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Career Goals</label>
            <textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} style={{ ...inputStyle, height: 100, resize: "vertical" }} placeholder="Tell us about your career goals in IT..." />
          </div>
          <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setStep(2)} disabled={!form.firstName || !form.email} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: (!form.firstName || !form.email) ? 0.5 : 1 }}>
              Next: Select Courses →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <p style={{ color: "#94a3b8", marginBottom: 24 }}>Select one or more courses to enroll in this cohort.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12, marginBottom: 32 }}>
            {courses.map(course => {
              const sel = form.selectedCourses.includes(course.id);
              return (
                <div key={course.id} onClick={() => toggle(course.id)} style={{
                  border: sel ? "2px solid #0ea5e9" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: 16, cursor: "pointer",
                  background: sel ? "rgba(14,165,233,0.08)" : "rgba(255,255,255,0.02)",
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: sel ? "none" : "2px solid #475569", background: sel ? "#0ea5e9" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    {sel && <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: course.vendorColor, fontWeight: 700, marginBottom: 2 }}>{course.vendorName} · {course.code}</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{course.title}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{course.duration} · {course.delivery} · ${course.price.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(1)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 24px", fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <button onClick={() => setStep(3)} disabled={form.selectedCourses.length === 0} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: form.selectedCourses.length === 0 ? 0.5 : 1 }}>
              Review ({form.selectedCourses.length} selected) →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28, marginBottom: 24 }}>
            <h3 style={{ color: "#f1f5f9", fontWeight: 700, marginBottom: 20 }}>Registration Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[["Full Name", `${form.firstName} ${form.lastName}`], ["Email", form.email], ["Phone", form.phone || "—"], ["Education", form.education || "—"]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                  <div style={{ color: "#e2e8f0", fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Enrolled Courses</div>
              {form.selectedCourses.map(id => {
                const c = courseById(id);
                if (!c) return null;
                return (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, color: "#e2e8f0", fontSize: 14 }}>
                    <span><span style={{ color: c.vendorColor, fontWeight: 700 }}>{c.vendorName}</span> · {c.title}</span>
                    <span style={{ color: "#f1f5f9", fontWeight: 700 }}>${c.price.toLocaleString()}</span>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}>
                <span style={{ color: "#f1f5f9" }}>Total</span>
                <span style={{ color: "#0ea5e9" }}>${form.selectedCourses.reduce((s, id) => s + (courseById(id)?.price || 0), 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div style={{ background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14, color: "#94a3b8" }}>
            💡 A <strong style={{ color: "#0ea5e9" }}>Microsoft 365 account</strong> will be automatically provisioned for you as <code style={{ color: "#818cf8" }}>{form.firstName.toLowerCase() || "firstname"}.{form.lastName.toLowerCase() || "lastname"}@trainee.edu</code> — you'll receive setup instructions via email.
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 24px", fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <button onClick={submit} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 36px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              ✓ Complete Registration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({ enrolledCourses, courses, user }) {
  const courseById = (id) => courses.find(c => c.id === id);
  const [activeCourse, setActiveCourse] = useState(null);
  const [showCert, setShowCert] = useState(null);

  const DEMO_COURSE_IDS = [3, 4];
  const coursesToShow = enrolledCourses.length > 0 ? enrolledCourses : DEMO_COURSE_IDS;

  const mockProgress = enrolledCourses.reduce((acc, id) => {
    acc[id] = Math.floor(Math.random() * 80) + 10;
    return acc;
  }, { 3: 100, 4: 88 });

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", marginBottom: 4 }}>Student Dashboard</h2>
          <p style={{ color: "#64748b" }}>Welcome back, <span style={{ color: "#0ea5e9" }}>{user?.name ?? user?.username ?? "Student"}</span></p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px", fontSize: 13, color: "#94a3b8" }}>
          <span style={{ color: "#64748b" }}>M365: </span>
          <span style={{ color: "#0ea5e9", fontFamily: "monospace" }}>m.santos@trainee.edu</span>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 36 }}>
        {INTEGRATIONS.map(int => (
          <div key={int.name} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{int.icon}</div>
            <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>Open {int.name}</div>
          </div>
        ))}
      </div>

      {/* Courses */}
      <h3 style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 20, fontSize: 20 }}>My Courses</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 40 }}>
        {coursesToShow.map(id => {
          const course = courseById(id);
          if (!course) return null;
          const progress = mockProgress[id] || 55;
          const completed = progress === 100;
          return (
            <div key={id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: course.vendorColor }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: course.vendorColor, fontWeight: 700, marginBottom: 4 }}>{course.vendorName} · {course.code}</div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>{course.title}</div>
                </div>
                {completed && <span style={{ fontSize: 24 }}>🏆</span>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>Progress</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: completed ? "#22c55e" : "#f1f5f9" }}>{progress}%</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: completed ? "#22c55e" : "linear-gradient(90deg, #0ea5e9, #6366f1)", borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button onClick={() => setActiveCourse(course)} style={{ flex: 1, background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Continue Learning
                </button>
                {completed && (
                  <button onClick={() => setShowCert(course)} style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    🎓 Certificate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Course detail modal */}
      {activeCourse && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, maxWidth: 600, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ color: "#0ea5e9", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{activeCourse.code}</div>
                <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 22, margin: 0 }}>{activeCourse.title}</h3>
              </div>
              <button onClick={() => setActiveCourse(null)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[["Next Session", "Tuesday, March 3 · 9:00 AM"], ["Instructor", "Sandra Lee"], ["Platform", "MS Teams + Moodle"], ["Assignment Due", "March 7, 2026"]].map(([k, v]) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                  <div style={{ color: "#e2e8f0", fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["💬 Join Teams", "#0ea5e9"], ["📓 OneNote", "#8b5cf6"], ["🎓 Moodle", "#f59e0b"], ["⚡ SkillJa", "#22c55e"]].map(([label, color]) => (
                <button key={label} style={{ flex: 1, background: `${color}15`, color, border: `1px solid ${color}33`, borderRadius: 10, padding: "10px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Certificate modal */}
      {showCert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
          <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "2px solid rgba(251,191,36,0.4)", borderRadius: 20, padding: 48, maxWidth: 680, width: "100%", textAlign: "center", position: "relative" }}>
            <button onClick={() => setShowCert(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.05)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>✕</button>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <div style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Certificate of Completion</div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>This certifies that</div>
            <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "Georgia, serif", color: "#f1f5f9", marginBottom: 8 }}>Maria Santos</div>
            <div style={{ color: "#94a3b8", fontSize: 15, marginBottom: 24 }}>has successfully completed</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0ea5e9", marginBottom: 8 }}>{showCert.title}</div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>{showCert.code} · {showCert.duration}</div>
            <div style={{ borderTop: "1px solid rgba(251,191,36,0.2)", paddingTop: 24, display: "flex", justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 14 }}>Date Issued</div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>March 1, 2026</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 14 }}>Credential ID</div>
                <div style={{ color: "#94a3b8", fontSize: 13, fontFamily: "monospace" }}>TID-2026-{showCert.id.toString().padStart(4, "0")}</div>
              </div>
            </div>
            <button style={{ marginTop: 24, background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#000", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 700, cursor: "pointer" }}>
              📥 Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY_COURSE = { vendor_id: "", code: "", title: "", level: "Beginner", duration: "", price: "", seats: "", delivery: "Online", next_start: "", description: "", badge: "", instructor_id: "", delivery_location_id: "" };
const EMPTY_INSTRUCTOR = { first_name: "", last_name: "", email: "", phone: "", title: "", bio: "", specializations: "", certifications: "", employment_type: "Full-time", status: "Active", hire_date: "", linkedin_url: "", available_days: [], available_hours: "", availability_note: "" };
const EMPTY_LOCATION = { name: "", type: "Physical", address_line1: "", address_line2: "", city: "", state_province: "", postal_code: "", country_code: "", country_name: "", room_number: "", building: "", floor: "", capacity: "", platform: "", timezone: "UTC", contact_name: "", contact_email: "", contact_phone: "", notes: "" };

// ─── EDUCATOR PORTAL ─────────────────────────────────────────────────────────

function EducatorPortalView({ staffAccount, instructors, courses, enrollments, schedule }) {
  const [tab, setTab] = useState("courses");

  const instructor = instructors.find(i => i.entra_oid === staffAccount?.localAccountId) ?? null;

  const myCourses = instructor
    ? courses.filter(c => c.instructorId === instructor.id)
    : [];

  const myCourseIds = new Set(myCourses.map(c => c.id));

  const myEnrollments = enrollments.filter(e => myCourseIds.has(e.course_id));

  const uniqueStudentIds = [...new Set(myEnrollments.map(e => e.student_id))];

  const mySchedule = schedule.filter(s => myCourseIds.has(s.courseId));

  const portalTabs = ["courses", "students", "schedule"];

  const cell = (content, opts = {}) => (
    <td style={{ padding: "12px 16px", color: "#cbd5e1", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)", ...opts }}>{content}</td>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      {/* Header card */}
      <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: 28, marginBottom: 32, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>👨‍🏫</div>
        <div style={{ flex: 1 }}>
          {instructor ? (
            <>
              <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 22 }}>{instructor.first_name} {instructor.last_name}</div>
              <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>{instructor.title || "Instructor"}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ color: "#6366f1", fontSize: 12 }}>📚 {myCourses.length} course{myCourses.length !== 1 ? "s" : ""}</span>
                <span style={{ color: "#0ea5e9", fontSize: 12 }}>👥 {uniqueStudentIds.length} student{uniqueStudentIds.length !== 1 ? "s" : ""}</span>
                {instructor.email && <span style={{ color: "#64748b", fontSize: 12 }}>✉️ {instructor.email}</span>}
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20 }}>{staffAccount?.name ?? "Educator"}</div>
              <div style={{ color: "#f59e0b", fontSize: 13, marginTop: 6 }}>
                Your instructor record has not been linked yet. Contact an administrator to link your account.
              </div>
            </>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
            {instructor?.status ?? "Active"}
          </div>
          {instructor?.employment_type && (
            <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{instructor.employment_type}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
        {portalTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "10px 20px", fontWeight: 700, fontSize: 13, textTransform: "capitalize",
            color: tab === t ? "#6366f1" : "#64748b",
            borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent",
            marginBottom: -1,
          }}>
            {t === "courses" && `Courses (${myCourses.length})`}
            {t === "students" && `Students (${uniqueStudentIds.length})`}
            {t === "schedule" && `Schedule (${mySchedule.length})`}
          </button>
        ))}
      </div>

      {/* Courses tab */}
      {tab === "courses" && (
        myCourses.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>No courses assigned yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {myCourses.map(c => {
              const enrolled = myEnrollments.filter(e => e.course_id === c.id).length;
              return (
                <div key={c.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.vendorColor }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ color: c.vendorColor, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{c.vendorName}</span>
                    <Chip text={c.level} color={levelColor[c.level]} />
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", marginBottom: 2 }}>{c.code}</div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{c.title}</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#94a3b8" }}>
                    <span>📅 {c.nextStart ? new Date(c.nextStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}</span>
                    <span>👥 {enrolled} / {c.seats}</span>
                  </div>
                  {c.locationName && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>📍 {c.locationName}</div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Students tab */}
      {tab === "students" && (
        myEnrollments.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>No students enrolled in your courses yet.</div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  {["Student", "Email", "Course", "Progress"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myEnrollments.map((e, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    {cell(e.student_name || "—")}
                    {cell(e.student_email || "—")}
                    {cell(myCourses.find(c => c.id === e.course_id)?.title ?? "—")}
                    {cell(e.progress != null ? `${e.progress}%` : "—")}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Schedule tab */}
      {tab === "schedule" && (
        mySchedule.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>No schedule entries for your courses yet.</div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  {["Course", "Day", "Time", "Room", "Type"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mySchedule.map((s, i) => {
                  const course = courses.find(c => c.id === s.courseId);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      {cell(course?.title ?? "—")}
                      {cell(s.day)}
                      {cell(s.time)}
                      {cell(s.room || "—")}
                      {cell(s.type)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

const EMPTY_SCHEDULE = { course_id: "", day: "", time: "", instructor: "", room: "", type: "Online" };

function AdminView({ courses, vendors, schedule, students, profiles, instructors, deliveryLocations, enrollments, onDeleteProfile, onCourseAdd, onCourseUpdate, onCourseDelete, onLocationAdd, onLocationUpdate, onLocationDelete, onInstructorAdd, onInstructorUpdate, onInstructorDeactivate, onEnrollmentAdd, onEnrollmentRemove, onScheduleAdd, onScheduleUpdate, onScheduleDelete }) {
  const [tab, setTab] = useState("overview");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(null);
  const [courseModal, setCourseModal] = useState(null); // null | { mode: "new"|"edit", data: {} }
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [courseSaving, setCourseSaving] = useState(false);
  const [locationModal, setLocationModal] = useState(null); // null | { mode: "new"|"edit", id? }
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION);
  const [locationSaving, setLocationSaving] = useState(false);
  const [confirmDeleteLocation, setConfirmDeleteLocation] = useState(null);
  const [instructorModal, setInstructorModal] = useState(null);
  const [instructorForm, setInstructorForm] = useState(EMPTY_INSTRUCTOR);
  const [instructorSaving, setInstructorSaving] = useState(false);
  const [confirmDeactivateInstructor, setConfirmDeactivateInstructor] = useState(null);
  const [instructorCreated, setInstructorCreated] = useState(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ student_id: "", course_id: "" });
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [confirmUnenroll, setConfirmUnenroll] = useState(null);
  const [enrollFilter, setEnrollFilter] = useState("");
  const [studentDetail, setStudentDetail] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null); // null | { mode: "new"|"edit", data: {} }
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState(null);
  const courseById = (id) => courses.find(c => c.id === id);

  const openNew = () => { setCourseForm(EMPTY_COURSE); setCourseModal({ mode: "new" }); };
  const openEdit = (c) => {
    setCourseForm({
      vendor_id: c.vendor, code: c.code, title: c.title, level: c.level,
      duration: c.duration, price: c.price, seats: c.seats, delivery: c.delivery,
      next_start: c.nextStart ? c.nextStart.split("T")[0] : "", description: c.description, badge: c.badge || "",
      instructor_id: c.instructorId || "",
      delivery_location_id: c.locationId || "",
    });
    setCourseModal({ mode: "edit", id: c.id });
  };

  const saveCourse = async () => {
    setCourseSaving(true);
    const isEdit = courseModal.mode === "edit";
    const url = isEdit ? `/api/courses/${courseModal.id}` : "/api/courses";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...courseForm, price: Number(courseForm.price), seats: Number(courseForm.seats) }) });
    const saved = await res.json();
    isEdit ? onCourseUpdate(saved) : onCourseAdd(saved);
    setCourseModal(null);
    setCourseSaving(false);
  };

  const deleteCourse = async (course) => {
    await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    onCourseDelete(course.id);
    setConfirmDeleteCourse(null);
  };

  const handleDelete = async (profile) => {
    await fetch(`/api/profile/${profile.entra_oid}`, { method: "DELETE" });
    onDeleteProfile(profile.entra_oid);
    setConfirmDelete(null);
  };

  const openNewLocation = () => { setLocationForm(EMPTY_LOCATION); setLocationModal({ mode: "new" }); };
  const openEditLocation = (loc) => {
    setLocationForm({
      name: loc.name || "", type: loc.type || "Physical",
      address_line1: loc.address_line1 || "", address_line2: loc.address_line2 || "",
      city: loc.city || "", state_province: loc.state_province || "", postal_code: loc.postal_code || "",
      country_code: loc.country_code || "", country_name: loc.country_name || "",
      room_number: loc.room_number || "", building: loc.building || "",
      floor: loc.floor || "", capacity: loc.capacity || "",
      platform: loc.platform || "", timezone: loc.timezone || "UTC",
      contact_name: loc.contact_name || "", contact_email: loc.contact_email || "",
      contact_phone: loc.contact_phone || "", notes: loc.notes || "",
    });
    setLocationModal({ mode: "edit", id: loc.id });
  };

  const saveLocation = async () => {
    setLocationSaving(true);
    const isEdit = locationModal.mode === "edit";
    const url = isEdit ? `/api/delivery-locations/${locationModal.id}` : "/api/delivery-locations";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...locationForm, capacity: locationForm.capacity ? Number(locationForm.capacity) : null, is_active: true }) });
    const saved = await res.json();
    isEdit ? onLocationUpdate(saved) : onLocationAdd(saved);
    setLocationModal(null);
    setLocationSaving(false);
  };

  const deleteLocation = async (loc) => {
    await fetch(`/api/delivery-locations/${loc.id}`, { method: "DELETE" });
    onLocationDelete(loc.id);
    setConfirmDeleteLocation(null);
  };

  const openNewInstructor = () => { setInstructorForm(EMPTY_INSTRUCTOR); setInstructorModal({ mode: "new" }); };
  const openEditInstructor = (i) => {
    setInstructorForm({
      first_name: i.first_name || "", last_name: i.last_name || "", email: i.email || "",
      phone: i.phone || "", title: i.title || "", bio: i.bio || "",
      specializations: (i.specializations || []).join(", "),
      certifications: (i.certifications || []).join(", "),
      employment_type: i.employment_type || "Full-time", status: i.status || "Active",
      hire_date: i.hire_date ? i.hire_date.split("T")[0] : "",
      linkedin_url: i.linkedin_url || "",
      available_days: i.available_days || [],
      available_hours: i.available_hours || "", availability_note: i.availability_note || "",
    });
    setInstructorModal({ mode: "edit", id: i.id });
  };

  const saveInstructor = async () => {
    setInstructorSaving(true);
    const isEdit = instructorModal.mode === "edit";
    const url = isEdit ? `/api/instructors/${instructorModal.id}` : "/api/instructors";
    const method = isEdit ? "PUT" : "POST";
    const payload = {
      ...instructorForm,
      specializations: instructorForm.specializations.split(",").map(s => s.trim()).filter(Boolean),
      certifications: instructorForm.certifications.split(",").map(s => s.trim()).filter(Boolean),
      hire_date: instructorForm.hire_date || null,
    };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const saved = await res.json();
    isEdit ? onInstructorUpdate(saved) : onInstructorAdd(saved);
    setInstructorModal(null);
    setInstructorSaving(false);
    if (!isEdit || saved.upn || saved.entraWarning) {
      setInstructorCreated({
        name: `${saved.first_name} ${saved.last_name}`,
        upn: saved.upn,
        tempPassword: saved.tempPassword,
        warning: saved.entraWarning,
      });
    }
  };

  const deactivateInstructor = async (instructor) => {
    await fetch(`/api/instructors/${instructor.id}`, { method: "DELETE" });
    onInstructorDeactivate(instructor.id);
    setConfirmDeactivateInstructor(null);
  };

  const saveEnrollment = async () => {
    setEnrollSaving(true);
    const res = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: Number(enrollForm.student_id), course_id: Number(enrollForm.course_id) }) });
    const data = await res.json();
    if (data.inserted) {
      const course = courses.find(c => c.id === Number(enrollForm.course_id));
      const student = students.find(s => s.id === Number(enrollForm.student_id));
      onEnrollmentAdd({ student_id: Number(enrollForm.student_id), course_id: Number(enrollForm.course_id), student_name: student?.name, student_email: student?.email, code: course?.code, title: course?.title, delivery: course?.delivery, vendor_name: course?.vendorName, vendor_color: course?.vendorColor });
    }
    setEnrollModal(false);
    setEnrollForm({ student_id: "", course_id: "" });
    setEnrollSaving(false);
  };

  const unenroll = async (row) => {
    await fetch("/api/enrollments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: row.student_id, course_id: row.course_id }) });
    onEnrollmentRemove(row.student_id, row.course_id);
    setConfirmUnenroll(null);
  };

  const adminTabs = ["overview", "students", "courses", "enrollments", "instructors", "locations", "schedule", "integrations"];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "rgba(0,0,0,0.3)", borderRight: "1px solid rgba(255,255,255,0.07)", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 12 }}>
          <div style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Admin Console</div>
        </div>
        {adminTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            width: "100%", textAlign: "left", padding: "12px 20px",
            background: tab === t ? "rgba(14,165,233,0.1)" : "transparent",
            color: tab === t ? "#0ea5e9" : "#64748b",
            border: "none", borderLeft: tab === t ? "3px solid #0ea5e9" : "3px solid transparent",
            fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "40px 32px", overflowY: "auto" }}>
        {tab === "overview" && (() => {
          const activeInstructors = instructors.filter(i => i.status === "Active").length;
          const totalEnrollments = enrollments.length;
          const studentsEnrolled = new Set(enrollments.map(e => e.student_id)).size;
          const avgFill = courses.length
            ? Math.round(courses.reduce((sum, c) => sum + (c.seats > 0 ? (c.enrolled / c.seats) * 100 : 0), 0) / courses.length)
            : 0;
          const now = new Date();
          const soon = courses.filter(c => {
            if (!c.nextStart) return false;
            const d = new Date(c.nextStart);
            return d >= now && d <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          });
          const recentProfiles = [...profiles].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

          const stats = [
            { label: "Registered Students", value: profiles.length, change: `${studentsEnrolled} enrolled in at least 1 course`, color: "#0ea5e9" },
            { label: "Active Courses", value: courses.length, change: soon.length > 0 ? `${soon.length} starting within 30 days` : "No upcoming start dates", color: "#6366f1" },
            { label: "Total Enrollments", value: totalEnrollments, change: `Across ${courses.length} course${courses.length !== 1 ? "s" : ""}`, color: "#22c55e" },
            { label: "Active Instructors", value: activeInstructors, change: `${instructors.length - activeInstructors} inactive / on leave`, color: "#f59e0b" },
            { label: "Entra Accounts", value: profiles.length, change: "All synced ✓", color: "#0ea5e9" },
            { label: "Avg Seats Filled", value: `${avgFill}%`, change: courses.length ? `across ${courses.length} courses` : "No courses yet", color: avgFill >= 75 ? "#22c55e" : avgFill >= 40 ? "#f59e0b" : "#ef4444" },
          ];

          return (
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", marginBottom: 32 }}>Platform Overview</h2>

              {/* Stat tiles */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 40 }}>
                {stats.map(stat => (
                  <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: stat.color, fontFamily: "Georgia, serif" }}>{stat.value}</div>
                    <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13, margin: "4px 0" }}>{stat.label}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{stat.change}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                {/* Enrollment breakdown by course */}
                <div>
                  <h3 style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Enrollment by Course</h3>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
                    {courses.length === 0 && <div style={{ color: "#64748b", fontSize: 13, padding: 20, textAlign: "center" }}>No courses yet.</div>}
                    {courses.map((c, i) => {
                      const pct = c.seats > 0 ? Math.round((c.enrolled / c.seats) * 100) : 0;
                      return (
                        <div key={c.id} style={{ padding: "12px 16px", borderBottom: i < courses.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <div>
                              <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>{c.title}</span>
                              <span style={{ color: c.vendorColor, fontSize: 11, fontWeight: 700, marginLeft: 8 }}>{c.vendorName}</span>
                            </div>
                            <span style={{ color: "#94a3b8", fontSize: 12 }}>{c.enrolled}/{c.seats}</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 75 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#0ea5e9", borderRadius: 2, transition: "width 0.4s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Courses starting soon */}
                <div>
                  <h3 style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Starting Within 30 Days</h3>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
                    {soon.length === 0 && <div style={{ color: "#64748b", fontSize: 13, padding: 20, textAlign: "center" }}>No courses starting soon.</div>}
                    {soon.sort((a, b) => new Date(a.nextStart) - new Date(b.nextStart)).map((c, i) => (
                      <div key={c.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", borderBottom: i < soon.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                          <div style={{ color: c.vendorColor, fontWeight: 900, fontSize: 16 }}>{new Date(c.nextStart).getDate()}</div>
                          <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>{new Date(c.nextStart).toLocaleString("en-US", { month: "short" })}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                          <div style={{ color: "#64748b", fontSize: 11 }}>{c.enrolled}/{c.seats} enrolled · {c.delivery}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent registrations */}
              <h3 style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Recent Registrations</h3>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
                {recentProfiles.length === 0 && <div style={{ color: "#64748b", fontSize: 13, padding: 20, textAlign: "center" }}>No students registered yet.</div>}
                {recentProfiles.map((p, i) => (
                  <div key={p.entra_oid} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: i < recentProfiles.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{p.first_name} {p.last_name}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{p.city}, {p.country_name}</div>
                    </div>
                    <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>
                      {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {tab === "students" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Registered Students</h2>
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{profiles.length} account{profiles.length !== 1 ? "s" : ""} registered via Entra External ID</p>
              </div>
            </div>
            {profiles.length === 0 && (
              <div style={{ color: "#64748b", fontSize: 14, padding: 24, textAlign: "center" }}>No registered students yet.</div>
            )}
            {profiles.map(p => (
              <div key={p.entra_oid} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>{p.first_name} {p.last_name}</div>
                        <div style={{ color: "#0ea5e9", fontSize: 13, fontFamily: "monospace" }}>{p.email}</div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                          {p.city}, {p.country_name}
                          {p.education && ` · ${p.education}`}
                          {" · "}Joined {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(p)}
                        style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Confirm delete modal */}
            {confirmDelete && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                <div style={{ background: "#0f172a", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                  <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Delete Student Account?</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                    This will permanently delete <strong style={{ color: "#f1f5f9" }}>{confirmDelete.first_name} {confirmDelete.last_name}</strong>'s profile from the database and their account from Entra External ID. This cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button onClick={() => handleDelete(confirmDelete)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "courses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", margin: 0 }}>Course Management</h2>
              <button onClick={openNew} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ New Course</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    {["Course", "Vendor", "Instructor", "Level", "Delivery", "Enrollment", "Start Date", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px" }}>
                        <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.title}</div>
                        <div style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>{c.code}</div>
                      </td>
                      <td style={{ padding: "14px" }}><span style={{ color: c.vendorColor, fontWeight: 700 }}>{c.vendorName}</span></td>
                      <td style={{ padding: "14px", color: c.instructorName ? "#e2e8f0" : "#475569", fontSize: 12 }}>{c.instructorName || "—"}</td>
                      <td style={{ padding: "14px" }}><Chip text={c.level} color={levelColor[c.level]} /></td>
                      <td style={{ padding: "14px" }}><Chip text={c.delivery} color="#0ea5e9" /></td>
                      <td style={{ padding: "14px" }}>
                        <div>
                          <span style={{ color: "#22c55e", fontWeight: 700 }}>{c.enrolled}</span>
                          <span style={{ color: "#64748b" }}> / {c.seats}</span>
                        </div>
                        <div style={{ width: 60, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(c.enrolled / c.seats) * 100}%`, background: "#0ea5e9" }} />
                        </div>
                      </td>
                      <td style={{ padding: "14px", color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>
                        {c.nextStart ? new Date(c.nextStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openEdit(c)} style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => setConfirmDeleteCourse(c)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Course form modal */}
            {courseModal && (() => {
              const inp = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, width: "100%", boxSizing: "border-box" };
              const lbl = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" };
              const set = (k) => (e) => setCourseForm(f => ({ ...f, [k]: e.target.value }));
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, overflowY: "auto" }}>
                  <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 680 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                      <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, margin: 0 }}>{courseModal.mode === "new" ? "New Course" : "Edit Course"}</h3>
                      <button onClick={() => setCourseModal(null)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={lbl}>Vendor</label>
                        <select value={courseForm.vendor_id} onChange={set("vendor_id")} style={inp}>
                          <option value="">Select vendor...</option>
                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Instructor</label>
                        <select value={courseForm.instructor_id} onChange={set("instructor_id")} style={inp}>
                          <option value="">Unassigned</option>
                          {instructors.filter(i => i.status === "Active").map(i => <option key={i.id} value={i.id}>{i.first_name} {i.last_name}{i.title ? ` — ${i.title}` : ""}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Course Code</label><input value={courseForm.code} onChange={set("code")} style={inp} placeholder="e.g. AZ-900" /></div>
                      <div><label style={lbl}>Badge</label>
                        <select value={courseForm.badge} onChange={set("badge")} style={inp}>
                          {["", "Hot", "New", "Core"].map(b => <option key={b} value={b}>{b || "None"}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Title</label><input value={courseForm.title} onChange={set("title")} style={inp} placeholder="Full course title" /></div>
                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Description</label><textarea value={courseForm.description} onChange={set("description")} style={{ ...inp, height: 80, resize: "vertical" }} placeholder="Short course description" /></div>
                      <div><label style={lbl}>Level</label>
                        <select value={courseForm.level} onChange={set("level")} style={inp}>
                          {["Beginner", "Intermediate", "Advanced"].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Delivery</label>
                        <select value={courseForm.delivery} onChange={set("delivery")} style={inp}>
                          {["Online", "Hybrid", "In-Person"].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Duration</label><input value={courseForm.duration} onChange={set("duration")} style={inp} placeholder="e.g. 8 weeks" /></div>
                      <div><label style={lbl}>Start Date</label><input type="date" value={courseForm.next_start} onChange={set("next_start")} style={inp} /></div>
                      <div><label style={lbl}>Price (USD)</label><input type="number" value={courseForm.price} onChange={set("price")} style={inp} placeholder="0" /></div>
                      <div><label style={lbl}>Seats</label><input type="number" value={courseForm.seats} onChange={set("seats")} style={inp} placeholder="0" /></div>

                      {/* Delivery Location */}
                      <div style={{ gridColumn: "span 2", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, marginTop: 4 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Delivery Location</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div style={{ gridColumn: "span 2" }}>
                            <label style={lbl}>Location</label>
                            <select value={courseForm.delivery_location_id} onChange={set("delivery_location_id")} style={inp}>
                              <option value="">No location assigned</option>
                              {deliveryLocations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                  {loc.name}{loc.city ? ` — ${loc.city}` : ""}{loc.country_name ? `, ${loc.country_name}` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          {courseForm.delivery_location_id && (() => {
                            const loc = deliveryLocations.find(l => String(l.id) === String(courseForm.delivery_location_id));
                            if (!loc) return null;
                            return (
                              <div style={{ gridColumn: "span 2", background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.12)", borderRadius: 10, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px" }}>
                                {loc.type && <div><span style={{ color: "#475569", fontSize: 11 }}>Type</span><div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{loc.type}</div></div>}
                                {loc.room_number && <div><span style={{ color: "#475569", fontSize: 11 }}>Room</span><div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{loc.room_number}{loc.floor ? `, ${loc.floor} floor` : ""}</div></div>}
                                {loc.building && <div><span style={{ color: "#475569", fontSize: 11 }}>Building</span><div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{loc.building}</div></div>}
                                {loc.city && <div><span style={{ color: "#475569", fontSize: 11 }}>City</span><div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{loc.city}</div></div>}
                                {loc.country_name && <div><span style={{ color: "#475569", fontSize: 11 }}>Country</span><div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{loc.country_name}</div></div>}
                                {loc.capacity && <div><span style={{ color: "#475569", fontSize: 11 }}>Capacity</span><div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{loc.capacity} seats</div></div>}
                                {loc.platform && <div><span style={{ color: "#475569", fontSize: 11 }}>Platform</span><div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{loc.platform}</div></div>}
                                {loc.timezone && <div><span style={{ color: "#475569", fontSize: 11 }}>Timezone</span><div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{loc.timezone}</div></div>}
                                {loc.contact_name && <div><span style={{ color: "#475569", fontSize: 11 }}>Contact</span><div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{loc.contact_name}</div></div>}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
                      <button onClick={() => setCourseModal(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveCourse} disabled={courseSaving || !courseForm.vendor_id || !courseForm.title} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: courseSaving ? 0.7 : 1 }}>
                        {courseSaving ? "Saving..." : courseModal.mode === "new" ? "Create Course" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Confirm delete course modal */}
            {confirmDeleteCourse && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                <div style={{ background: "#0f172a", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                  <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Delete Course?</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                    This will permanently delete <strong style={{ color: "#f1f5f9" }}>{confirmDeleteCourse.title}</strong> along with its schedule and all enrollment records. This cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => setConfirmDeleteCourse(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => deleteCourse(confirmDeleteCourse)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "enrollments" && (() => {
          const filtered = enrollFilter
            ? enrollments.filter(e => String(e.course_id) === enrollFilter)
            : enrollments;
          const inp = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, boxSizing: "border-box" };
          const lbl = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" };
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Enrollment Management</h2>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{enrollments.length} enrollment{enrollments.length !== 1 ? "s" : ""} across {courses.length} course{courses.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => { setEnrollForm({ student_id: "", course_id: "" }); setEnrollModal(true); }} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ Enroll Student</button>
              </div>

              {/* Course filter + per-course enrollment counts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 24 }}>
                <div onClick={() => setEnrollFilter("")} style={{ background: enrollFilter === "" ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.02)", border: `1px solid ${enrollFilter === "" ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#0ea5e9" }}>{enrollments.length}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>All Enrollments</div>
                </div>
                {courses.map(c => {
                  const count = enrollments.filter(e => e.course_id === c.id).length;
                  return (
                    <div key={c.id} onClick={() => setEnrollFilter(String(c.id))} style={{ background: enrollFilter === String(c.id) ? `${c.vendorColor}18` : "rgba(255,255,255,0.02)", border: `1px solid ${enrollFilter === String(c.id) ? c.vendorColor + "44" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: c.vendorColor }}>{count}</div>
                      <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                      <div style={{ color: "#475569", fontSize: 11, fontFamily: "monospace" }}>{c.code}</div>
                    </div>
                  );
                })}
              </div>

              {/* Enrollment table */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
                {filtered.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 14, padding: 32, textAlign: "center" }}>No enrollments found.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        {["Student", "Email", "Course", "Vendor", "Delivery", ""].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <div onClick={() => setStudentDetail(e.student_id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                                {e.student_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <span style={{ color: "#0ea5e9", fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>{e.student_name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>{e.student_email}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{e.title}</div>
                            <div style={{ color: "#475569", fontFamily: "monospace", fontSize: 11 }}>{e.code}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}><span style={{ color: e.vendor_color, fontWeight: 700 }}>{e.vendor_name}</span></td>
                          <td style={{ padding: "14px 16px" }}><Chip text={e.delivery} color="#0ea5e9" /></td>
                          <td style={{ padding: "14px 16px" }}>
                            <button onClick={() => setConfirmUnenroll(e)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Unenroll</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Enroll modal */}
              {enrollModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 480 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                      <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, margin: 0 }}>Enroll Student</h3>
                      <button onClick={() => setEnrollModal(false)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                    </div>
                    <div style={{ display: "grid", gap: 16 }}>
                      <div>
                        <label style={lbl}>Student</label>
                        <select value={enrollForm.student_id} onChange={e => setEnrollForm(f => ({ ...f, student_id: e.target.value }))} style={{ ...inp, width: "100%" }}>
                          <option value="">Select student...</option>
                          {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Course</label>
                        <select value={enrollForm.course_id} onChange={e => setEnrollForm(f => ({ ...f, course_id: e.target.value }))} style={{ ...inp, width: "100%" }}>
                          <option value="">Select course...</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
                      <button onClick={() => setEnrollModal(false)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveEnrollment} disabled={enrollSaving || !enrollForm.student_id || !enrollForm.course_id} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: enrollSaving || !enrollForm.student_id || !enrollForm.course_id ? 0.6 : 1 }}>
                        {enrollSaving ? "Enrolling..." : "Confirm Enrollment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm unenroll modal */}
              {confirmUnenroll && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#0f172a", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Remove Enrollment?</h3>
                    <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                      Remove <strong style={{ color: "#f1f5f9" }}>{confirmUnenroll.student_name}</strong> from <strong style={{ color: "#f1f5f9" }}>{confirmUnenroll.title}</strong>? This cannot be undone.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                      <button onClick={() => setConfirmUnenroll(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => unenroll(confirmUnenroll)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Remove</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Student detail modal */}
              {studentDetail && (() => {
                const student = students.find(s => s.id === studentDetail);
                const profile = profiles.find(p => p.email === student?.email);
                const studentEnrollments = enrollments.filter(e => e.student_id === studentDetail);
                return (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                    <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 580, maxHeight: "85vh", overflowY: "auto" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                            {student?.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 18 }}>{student?.name}</div>
                            <div style={{ color: "#0ea5e9", fontSize: 13, fontFamily: "monospace" }}>{student?.email}</div>
                          </div>
                        </div>
                        <button onClick={() => setStudentDetail(null)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                      </div>

                      {profile && (
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Profile</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", fontSize: 13 }}>
                            {profile.city && <div><span style={{ color: "#475569" }}>Location </span><span style={{ color: "#e2e8f0" }}>{profile.city}, {profile.country_name}</span></div>}
                            {profile.phone && <div><span style={{ color: "#475569" }}>Phone </span><span style={{ color: "#e2e8f0" }}>{profile.phone}</span></div>}
                            {profile.date_of_birth && <div><span style={{ color: "#475569" }}>Date of Birth </span><span style={{ color: "#e2e8f0" }}>{new Date(profile.date_of_birth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>}
                            {profile.education && <div><span style={{ color: "#475569" }}>Education </span><span style={{ color: "#e2e8f0" }}>{profile.education}</span></div>}
                            <div><span style={{ color: "#475569" }}>Joined </span><span style={{ color: "#e2e8f0" }}>{new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
                          </div>
                          {profile.goals && <div style={{ marginTop: 12, color: "#64748b", fontSize: 12 }}>Goals: <span style={{ color: "#94a3b8" }}>{profile.goals}</span></div>}
                        </div>
                      )}

                      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                        Enrolled Courses ({studentEnrollments.length})
                      </div>
                      {studentEnrollments.length === 0 ? (
                        <div style={{ color: "#475569", fontSize: 13, padding: "12px 0" }}>No enrollments.</div>
                      ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                          {studentEnrollments.map((e, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                  <span style={{ color: e.vendor_color, fontSize: 11, fontWeight: 700 }}>{e.vendor_name}</span>
                                  <span style={{ color: "#475569", fontFamily: "monospace", fontSize: 11 }}>{e.code}</span>
                                </div>
                              </div>
                              <Chip text={e.delivery} color="#0ea5e9" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {tab === "instructors" && (() => {
          const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          const statusColor = { Active: "#22c55e", Inactive: "#ef4444", "On Leave": "#f59e0b" };
          const inp = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, width: "100%", boxSizing: "border-box" };
          const lbl = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" };
          const set = (k) => (e) => setInstructorForm(f => ({ ...f, [k]: e.target.value }));
          const toggleDay = (day) => setInstructorForm(f => ({ ...f, available_days: f.available_days.includes(day) ? f.available_days.filter(d => d !== day) : [...f.available_days, day] }));
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Instructors</h2>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{instructors.length} instructor{instructors.length !== 1 ? "s" : ""} on record</p>
                </div>
                <button onClick={openNewInstructor} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ New Instructor</button>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {instructors.length === 0 && <div style={{ color: "#64748b", fontSize: 14, padding: 24, textAlign: "center" }}>No instructors on record.</div>}
                {instructors.map(ins => (
                  <div key={ins.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                      {ins.first_name?.[0]}{ins.last_name?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{ins.first_name} {ins.last_name}</div>
                          <div style={{ color: "#0ea5e9", fontSize: 12, fontFamily: "monospace" }}>{ins.email}</div>
                          {ins.title && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{ins.title} · {ins.employment_type}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                          <span style={{ background: `rgba(${ins.status === "Active" ? "34,197,94" : ins.status === "On Leave" ? "251,191,36" : "239,68,68"},0.12)`, color: statusColor[ins.status] || "#94a3b8", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{ins.status}</span>
                          <button onClick={() => openEditInstructor(ins)} style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                          {ins.status === "Active" && <button onClick={() => setConfirmDeactivateInstructor(ins)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Deactivate</button>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 10 }}>
                        {(ins.specializations || []).map(s => <span key={s} style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{s}</span>)}
                        {(ins.certifications || []).map(c => <span key={c} style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{c}</span>)}
                        {ins.available_days?.length > 0 && <span style={{ color: "#64748b", fontSize: 12 }}>Available: {ins.available_days.map(d => d.slice(0,3)).join(", ")}{ins.available_hours ? ` · ${ins.available_hours}` : ""}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructor form modal */}
              {instructorModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, overflowY: "auto" }}>
                  <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 720, margin: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                      <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, margin: 0 }}>{instructorModal.mode === "new" ? "New Instructor" : "Edit Instructor"}</h3>
                      <button onClick={() => setInstructorModal(null)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                    </div>

                    {/* Basic Info */}
                    <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Basic Information</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                      <div><label style={lbl}>First Name</label><input value={instructorForm.first_name} onChange={set("first_name")} style={inp} placeholder="First name" /></div>
                      <div><label style={lbl}>Last Name</label><input value={instructorForm.last_name} onChange={set("last_name")} style={inp} placeholder="Last name" /></div>
                      <div><label style={lbl}>Email</label><input value={instructorForm.email} onChange={set("email")} style={inp} placeholder="email@example.com" /></div>
                      <div><label style={lbl}>Phone</label><input value={instructorForm.phone} onChange={set("phone")} style={inp} placeholder="+223 ..." /></div>
                      <div><label style={lbl}>Title / Role</label><input value={instructorForm.title} onChange={set("title")} style={inp} placeholder="e.g. Senior Instructor" /></div>
                      <div><label style={lbl}>LinkedIn URL</label><input value={instructorForm.linkedin_url} onChange={set("linkedin_url")} style={inp} placeholder="https://linkedin.com/in/..." /></div>
                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Bio</label><textarea value={instructorForm.bio} onChange={set("bio")} style={{ ...inp, height: 72, resize: "vertical" }} placeholder="Short public-facing biography" /></div>
                    </div>

                    {/* Employment */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, marginBottom: 16 }}>
                      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Employment</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        <div>
                          <label style={lbl}>Employment Type</label>
                          <select value={instructorForm.employment_type} onChange={set("employment_type")} style={inp}>
                            {["Full-time", "Part-time", "Contractor"].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Status</label>
                          <select value={instructorForm.status} onChange={set("status")} style={inp}>
                            {["Active", "Inactive", "On Leave"].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div><label style={lbl}>Hire Date</label><input type="date" value={instructorForm.hire_date} onChange={set("hire_date")} style={inp} /></div>
                      </div>
                    </div>

                    {/* Expertise */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, marginBottom: 16 }}>
                      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Expertise</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div><label style={lbl}>Specializations <span style={{ color: "#475569", fontWeight: 400 }}>(comma-separated)</span></label><input value={instructorForm.specializations} onChange={set("specializations")} style={inp} placeholder="e.g. Azure, Security, CompTIA" /></div>
                        <div><label style={lbl}>Certifications <span style={{ color: "#475569", fontWeight: 400 }}>(comma-separated)</span></label><input value={instructorForm.certifications} onChange={set("certifications")} style={inp} placeholder="e.g. AZ-104, Security+, CCNA" /></div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, marginBottom: 24 }}>
                      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Availability</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                        {DAYS.map(day => (
                          <button key={day} type="button" onClick={() => toggleDay(day)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: instructorForm.available_days.includes(day) ? "#0ea5e9" : "rgba(255,255,255,0.1)", background: instructorForm.available_days.includes(day) ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.03)", color: instructorForm.available_days.includes(day) ? "#0ea5e9" : "#64748b" }}>
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div><label style={lbl}>Available Hours</label><input value={instructorForm.available_hours} onChange={set("available_hours")} style={inp} placeholder="e.g. 09:00–17:00" /></div>
                        <div><label style={lbl}>Availability Note</label><input value={instructorForm.availability_note} onChange={set("availability_note")} style={inp} placeholder="e.g. Evenings only in July" /></div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                      <button onClick={() => setInstructorModal(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveInstructor} disabled={instructorSaving || !instructorForm.first_name || !instructorForm.last_name || !instructorForm.email} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: instructorSaving ? 0.7 : 1 }}>
                        {instructorSaving ? "Saving..." : instructorModal.mode === "new" ? "Add Instructor" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm deactivate modal */}
              {confirmDeactivateInstructor && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#0f172a", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Deactivate Instructor?</h3>
                    <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                      <strong style={{ color: "#f1f5f9" }}>{confirmDeactivateInstructor.first_name} {confirmDeactivateInstructor.last_name}</strong> will be set to Inactive and removed from course assignment dropdowns.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                      <button onClick={() => setConfirmDeactivateInstructor(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => deactivateInstructor(confirmDeactivateInstructor)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Deactivate</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Entra account created modal */}
              {instructorCreated && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
                  <div style={{ background: "#0f172a", border: `1px solid ${instructorCreated.warning ? "rgba(251,191,36,0.3)" : "rgba(34,197,94,0.3)"}`, borderRadius: 20, padding: 36, maxWidth: 480, width: "100%" }}>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>{instructorCreated.warning ? "⚠️" : "✅"}</div>
                      <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, margin: "0 0 8px" }}>
                        {instructorCreated.warning ? "Instructor Saved" : "Instructor Created"}
                      </h3>
                      <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{instructorCreated.name} has been added to the system.</p>
                    </div>

                    {instructorCreated.warning ? (
                      <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                        <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Entra ID account could not be created</div>
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>{instructorCreated.warning}</div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>The instructor record has been saved. Set up the Entra ID credentials in Azure App Service settings and try again via Edit.</div>
                      </div>
                    ) : (
                      <div style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Entra ID Account Details</div>
                        <div style={{ display: "grid", gap: 10 }}>
                          <div>
                            <div style={{ color: "#475569", fontSize: 11 }}>Username (UPN)</div>
                            <div style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{instructorCreated.upn}</div>
                          </div>
                          <div>
                            <div style={{ color: "#475569", fontSize: 11 }}>Temporary Password <span style={{ color: "#64748b", fontWeight: 400 }}>(instructor must change on first login)</span></div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                              <code style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px", color: "#f1f5f9", fontFamily: "monospace", fontSize: 15, fontWeight: 700, flex: 1, textAlign: "center", letterSpacing: 2 }}>{instructorCreated.tempPassword}</code>
                              <button onClick={() => instructorCreated.tempPassword && navigator.clipboard.writeText(instructorCreated.tempPassword)} disabled={!instructorCreated.tempPassword} style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: instructorCreated.tempPassword ? "pointer" : "not-allowed", whiteSpace: "nowrap", opacity: instructorCreated.tempPassword ? 1 : 0.4 }}>Copy</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <button onClick={() => setInstructorCreated(null)} style={{ width: "100%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, cursor: "pointer" }}>Done</button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "locations" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Delivery Locations</h2>
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{deliveryLocations.length} location{deliveryLocations.length !== 1 ? "s" : ""} configured</p>
              </div>
              <button onClick={openNewLocation} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ New Location</button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {deliveryLocations.length === 0 && (
                <div style={{ color: "#64748b", fontSize: 14, padding: 24, textAlign: "center" }}>No locations configured yet.</div>
              )}
              {deliveryLocations.map(loc => (
                <div key={loc.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: loc.type === "Online" ? "rgba(99,102,241,0.15)" : loc.type === "Hybrid" ? "rgba(251,191,36,0.15)" : "rgba(14,165,233,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {loc.type === "Online" ? "🌐" : loc.type === "Hybrid" ? "🔀" : "🏢"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{loc.name}</div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                          {[loc.room_number && `Room ${loc.room_number}`, loc.building, loc.city, loc.country_name].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => openEditLocation(loc)} style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => setConfirmDeleteLocation(loc)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Deactivate</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
                      <span style={{ background: loc.type === "Online" ? "rgba(99,102,241,0.12)" : loc.type === "Hybrid" ? "rgba(251,191,36,0.12)" : "rgba(14,165,233,0.12)", color: loc.type === "Online" ? "#818cf8" : loc.type === "Hybrid" ? "#fbbf24" : "#38bdf8", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{loc.type}</span>
                      {loc.capacity && <span style={{ color: "#64748b", fontSize: 12 }}>Capacity: <span style={{ color: "#94a3b8" }}>{loc.capacity}</span></span>}
                      {loc.platform && <span style={{ color: "#64748b", fontSize: 12 }}>Platform: <span style={{ color: "#94a3b8" }}>{loc.platform}</span></span>}
                      {loc.timezone && loc.timezone !== "UTC" && <span style={{ color: "#64748b", fontSize: 12 }}>TZ: <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{loc.timezone}</span></span>}
                      {loc.contact_name && <span style={{ color: "#64748b", fontSize: 12 }}>Contact: <span style={{ color: "#94a3b8" }}>{loc.contact_name}</span></span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Location form modal */}
            {locationModal && (() => {
              const inp = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, width: "100%", boxSizing: "border-box" };
              const lbl = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" };
              const set = (k) => (e) => setLocationForm(f => ({ ...f, [k]: e.target.value }));
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, overflowY: "auto" }}>
                  <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 680, margin: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                      <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, margin: 0 }}>{locationModal.mode === "new" ? "New Location" : "Edit Location"}</h3>
                      <button onClick={() => setLocationModal(null)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Location Name</label><input value={locationForm.name} onChange={set("name")} style={inp} placeholder='e.g. "Bamako Training Centre – Lab A"' /></div>
                      <div>
                        <label style={lbl}>Type</label>
                        <select value={locationForm.type} onChange={set("type")} style={inp}>
                          {["Physical", "Online", "Hybrid"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Timezone</label>
                        <select value={locationForm.timezone} onChange={set("timezone")} style={inp}>
                          {TIMEZONES.map(({ tz, label }) => (
                            <option key={tz} value={tz}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ gridColumn: "span 2", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginTop: 4 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Address</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div style={{ gridColumn: "span 2" }}><label style={lbl}>Address Line 1</label><input value={locationForm.address_line1} onChange={set("address_line1")} style={inp} placeholder="Street address, P.O. box" /></div>
                          <div style={{ gridColumn: "span 2" }}><label style={lbl}>Address Line 2</label><input value={locationForm.address_line2} onChange={set("address_line2")} style={inp} placeholder="Apartment, suite, building, floor…" /></div>
                          <div>
                            <label style={lbl}>Country</label>
                            <select value={locationForm.country_code} onChange={e => {
                              const code = e.target.value;
                              const name = Country.getAllCountries().find(c => c.isoCode === code)?.name || "";
                              setLocationForm(f => ({ ...f, country_code: code, country_name: name, city: "", state_province: "" }));
                            }} style={inp}>
                              <option value="">Select country...</option>
                              {Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>City</label>
                            {(() => {
                              const cities = locationForm.country_code ? City.getCitiesOfCountry(locationForm.country_code) : [];
                              return cities.length > 0 ? (
                                <select value={locationForm.city} onChange={set("city")} style={inp}>
                                  <option value="">Select city...</option>
                                  {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                              ) : (
                                <input value={locationForm.city} onChange={set("city")} style={inp} placeholder={locationForm.country_code ? "Enter city" : "Select a country first"} disabled={!locationForm.country_code} />
                              );
                            })()}
                          </div>
                          <div><label style={lbl}>State / Province</label><input value={locationForm.state_province} onChange={set("state_province")} style={inp} placeholder="State or province" /></div>
                          <div><label style={lbl}>Postal Code</label><input value={locationForm.postal_code} onChange={set("postal_code")} style={inp} placeholder="ZIP / postal code" /></div>
                        </div>
                      </div>

                      <div style={{ gridColumn: "span 2", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginTop: 4 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Room Details</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <div><label style={lbl}>Room Number</label><input value={locationForm.room_number} onChange={set("room_number")} style={inp} placeholder="e.g. Lab A" /></div>
                          <div><label style={lbl}>Floor</label><input value={locationForm.floor} onChange={set("floor")} style={inp} placeholder="e.g. 2nd" /></div>
                          <div><label style={lbl}>Building</label><input value={locationForm.building} onChange={set("building")} style={inp} placeholder="e.g. ICT Block" /></div>
                          <div><label style={lbl}>Capacity (seats)</label><input type="number" value={locationForm.capacity} onChange={set("capacity")} style={inp} placeholder="0" /></div>
                          <div><label style={lbl}>Platform</label><input value={locationForm.platform} onChange={set("platform")} style={inp} placeholder="e.g. Microsoft Teams" /></div>
                        </div>
                      </div>

                      <div style={{ gridColumn: "span 2", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginTop: 4 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Venue Contact</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <div><label style={lbl}>Contact Name</label><input value={locationForm.contact_name} onChange={set("contact_name")} style={inp} placeholder="Full name" /></div>
                          <div><label style={lbl}>Email</label><input value={locationForm.contact_email} onChange={set("contact_email")} style={inp} placeholder="email@example.com" /></div>
                          <div><label style={lbl}>Phone</label><input value={locationForm.contact_phone} onChange={set("contact_phone")} style={inp} placeholder="+223 ..." /></div>
                        </div>
                      </div>

                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Notes</label><textarea value={locationForm.notes} onChange={set("notes")} style={{ ...inp, height: 72, resize: "vertical" }} placeholder="Additional notes..." /></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
                      <button onClick={() => setLocationModal(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveLocation} disabled={locationSaving || !locationForm.name} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: locationSaving ? 0.7 : 1 }}>
                        {locationSaving ? "Saving..." : locationModal.mode === "new" ? "Create Location" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Confirm deactivate modal */}
            {confirmDeleteLocation && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                <div style={{ background: "#0f172a", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                  <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Deactivate Location?</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                    <strong style={{ color: "#f1f5f9" }}>{confirmDeleteLocation.name}</strong> will be hidden from location selectors. Existing course assignments are preserved.
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => setConfirmDeleteLocation(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => deleteLocation(confirmDeleteLocation)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Deactivate</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "integrations" && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", marginBottom: 32 }}>Integrations & Provisioning</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {[
                { name: "Microsoft 365 Tenant", icon: "☁️", status: "Connected", desc: "Auto-provisioning student accounts on registration. Tenant: trainee.edu", color: "#0ea5e9" },
                { name: "MS Teams", icon: "💬", status: "Connected", desc: "Course channels auto-created. 47 active student members.", color: "#6366f1" },
                { name: "OneNote Class Notebooks", icon: "📓", status: "Connected", desc: "Shared notebooks synced per course cohort.", color: "#8b5cf6" },
                { name: "Moodle LMS", icon: "🎓", status: "Connected", desc: "Course content, quizzes, and assignments managed via Moodle.", color: "#f59e0b" },
                { name: "SkillJa", icon: "⚡", status: "Connected", desc: "Hands-on labs and skills assessments integrated.", color: "#22c55e" },
                { name: "Google NotebookLM", icon: "🤖", status: "Pending Setup", desc: "AI-powered study companion. Configure API keys to activate.", color: "#64748b" },
              ].map(int => (
                <div key={int.name} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24, display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>{int.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>{int.name}</div>
                      <span style={{ background: int.status === "Connected" ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)", color: int.status === "Connected" ? "#22c55e" : "#fbbf24", border: `1px solid ${int.status === "Connected" ? "rgba(34,197,94,0.2)" : "rgba(251,191,36,0.2)"}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                        {int.status}
                      </span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: 14 }}>{int.desc}</div>
                  </div>
                  <button style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                    {int.status === "Connected" ? "Configure" : "Setup"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "schedule" && (() => {
          const openNewSchedule = () => {
            setScheduleForm(EMPTY_SCHEDULE);
            setScheduleModal({ mode: "new" });
          };
          const openEditSchedule = (s) => {
            setScheduleForm({ course_id: s.courseId, day: s.day, time: s.time, instructor: s.instructor, room: s.room, type: s.type });
            setScheduleModal({ mode: "edit", id: s.id });
          };
          const saveSchedule = async () => {
            if (!scheduleForm.course_id || !scheduleForm.day || !scheduleForm.time || !scheduleForm.type) return;
            setScheduleSaving(true);
            try {
              if (scheduleModal.mode === "new") {
                const r = await fetch("/api/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scheduleForm) });
                const saved = await r.json();
                onScheduleAdd(normalizeSchedule(saved));
              } else {
                const r = await fetch(`/api/schedule/${scheduleModal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scheduleForm) });
                const saved = await r.json();
                onScheduleUpdate(normalizeSchedule(saved));
              }
              setScheduleModal(null);
            } finally {
              setScheduleSaving(false);
            }
          };
          const deleteSchedule = async (entry) => {
            await fetch(`/api/schedule/${entry.id}`, { method: "DELETE" });
            onScheduleDelete(entry.id);
            setConfirmDeleteSchedule(null);
          };

          const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" };
          const labelStyle = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };

          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", margin: 0 }}>Schedule Management</h2>
                <button onClick={openNewSchedule} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  + Add Entry
                </button>
              </div>

              {schedule.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>No schedule entries yet. Add one to get started.</div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                        {["Course", "Day", "Time", "Instructor", "Room", "Format", ""].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((s, i) => {
                        const c = courseById(s.courseId);
                        if (!c) return null;
                        return (
                          <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.title}</div>
                              <div style={{ color: c.vendorColor, fontSize: 11, fontWeight: 700 }}>{c.code}</div>
                            </td>
                            <td style={{ padding: "14px 16px", color: "#94a3b8", fontFamily: "monospace" }}>{s.day}</td>
                            <td style={{ padding: "14px 16px", color: "#94a3b8", fontFamily: "monospace" }}>{s.time}</td>
                            <td style={{ padding: "14px 16px", color: "#e2e8f0" }}>{s.instructor || "—"}</td>
                            <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: 12 }}>{s.room || "—"}</td>
                            <td style={{ padding: "14px 16px" }}><Chip text={s.type} color={s.type === "Online" ? "#0ea5e9" : s.type === "Hybrid" ? "#f59e0b" : "#8b5cf6"} /></td>
                            <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                              <button onClick={() => openEditSchedule(s)} style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginRight: 6 }}>Edit</button>
                              <button onClick={() => setConfirmDeleteSchedule(s)} style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Schedule modal */}
              {scheduleModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
                    <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, marginBottom: 28 }}>
                      {scheduleModal.mode === "new" ? "Add Schedule Entry" : "Edit Schedule Entry"}
                    </h3>
                    <div style={{ display: "grid", gap: 18 }}>
                      <div>
                        <label style={labelStyle}>Course *</label>
                        <select value={scheduleForm.course_id} onChange={e => {
                          const c = courses.find(x => x.id === Number(e.target.value));
                          setScheduleForm(f => ({ ...f, course_id: Number(e.target.value), instructor: c?.instructorName || f.instructor }));
                        }} style={inputStyle}>
                          <option value="">Select a course...</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Day *</label>
                          <select value={scheduleForm.day} onChange={e => setScheduleForm(f => ({ ...f, day: e.target.value }))} style={inputStyle}>
                            <option value="">Select...</option>
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
                              "Mon & Wed", "Tue & Thu", "Mon–Fri", "Weekends"].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Time *</label>
                          <input value={scheduleForm.time} onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} placeholder="e.g. 9:00 AM – 12:00 PM" />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Format *</label>
                        <select value={scheduleForm.type} onChange={e => setScheduleForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                          {["Online", "In-Person", "Hybrid"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Instructor</label>
                        <select value={scheduleForm.instructor} onChange={e => setScheduleForm(f => ({ ...f, instructor: e.target.value }))} style={inputStyle}>
                          <option value="">— None / TBD —</option>
                          {instructors.filter(i => i.status === "Active").map(i => (
                            <option key={i.id} value={`${i.first_name} ${i.last_name}`}>{i.first_name} {i.last_name}{i.title ? ` — ${i.title}` : ""}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Room / Location</label>
                        <input value={scheduleForm.room} onChange={e => setScheduleForm(f => ({ ...f, room: e.target.value }))} style={inputStyle} placeholder="e.g. Room 204 or Teams link" />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
                      <button onClick={() => setScheduleModal(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveSchedule} disabled={scheduleSaving || !scheduleForm.course_id || !scheduleForm.day || !scheduleForm.time} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: scheduleSaving || !scheduleForm.course_id || !scheduleForm.day || !scheduleForm.time ? 0.6 : 1 }}>
                        {scheduleSaving ? "Saving..." : scheduleModal.mode === "new" ? "Add Entry" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm delete modal */}
              {confirmDeleteSchedule && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#0f172a", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🗑️</div>
                    <h3 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Delete Schedule Entry?</h3>
                    <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                      This will permanently remove the <strong style={{ color: "#f1f5f9" }}>{confirmDeleteSchedule.day} {confirmDeleteSchedule.time}</strong> entry for <strong style={{ color: "#f1f5f9" }}>{courseById(confirmDeleteSchedule.courseId)?.title}</strong>.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                      <button onClick={() => setConfirmDeleteSchedule(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => deleteSchedule(confirmDeleteSchedule)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function ProfileSetupView({ user, onSaved }) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", country_code: "", country_name: "", city: "", phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const countries = Country.getAllCountries();
  const cities = form.country_code ? City.getCitiesOfCountry(form.country_code) : [];

  const inputStyle = {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 16px", color: "#f1f5f9", fontSize: 15,
    width: "100%", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" };

  const handleCountry = (e) => {
    const code = e.target.value;
    const name = countries.find(c => c.isoCode === code)?.name || "";
    setForm(f => ({ ...f, country_code: code, country_name: name, city: "" }));
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.country_code || !form.city) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entra_oid: user.localAccountId,
          first_name: form.first_name,
          last_name: form.last_name,
          email: user.username,
          country_code: form.country_code,
          country_name: form.country_name,
          city: form.city,
          phone: form.phone || null,
        }),
      });
      const saved = await res.json();
      onSaved(saved);
    } catch {
      setError("Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 40, maxWidth: 560, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", margin: "0 0 8px" }}>Complete Your Profile</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Before you continue, please tell us a little about yourself.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={labelStyle}>First Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} placeholder="First name" />
          </div>
          <div>
            <label style={labelStyle}>Last Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} style={inputStyle} placeholder="Last name" />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Country <span style={{ color: "#ef4444" }}>*</span></label>
            <select value={form.country_code} onChange={handleCountry} style={inputStyle}>
              <option value="">Select country...</option>
              {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>City <span style={{ color: "#ef4444" }}>*</span></label>
            {cities.length > 0 ? (
              <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle}>
                <option value="">Select city...</option>
                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            ) : (
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} placeholder={form.country_code ? "Enter your city" : "Select a country first"} disabled={!form.country_code} />
            )}
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Phone Number</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} placeholder="+1 234 567 8900" type="tel" />
          </div>
        </div>

        {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 16, textAlign: "center" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={saving} style={{ marginTop: 28, width: "100%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function ProfileEditView({ user, profile, onSaved }) {
  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    country_code: profile?.country_code || "",
    country_name: profile?.country_name || "",
    city: profile?.city || "",
    phone: profile?.phone || "",
    date_of_birth: profile?.date_of_birth ? profile.date_of_birth.split("T")[0] : "",
    education: profile?.education || "",
    goals: profile?.goals || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const countries = Country.getAllCountries();
  const cities = form.country_code ? City.getCitiesOfCountry(form.country_code) : [];

  const inputStyle = {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 16px", color: "#f1f5f9", fontSize: 15,
    width: "100%", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" };

  const handleCountry = (e) => {
    const code = e.target.value;
    const name = countries.find(c => c.isoCode === code)?.name || "";
    setForm(f => ({ ...f, country_code: code, country_name: name, city: "" }));
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.country_code || !form.city) {
      setError("First name, last name, country and city are required.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entra_oid: user.localAccountId,
          first_name: form.first_name,
          last_name: form.last_name,
          email: user.username,
          country_code: form.country_code,
          country_name: form.country_name,
          city: form.city,
          phone: form.phone || null,
          date_of_birth: form.date_of_birth || null,
          education: form.education || null,
          goals: form.goals || null,
        }),
      });
      const updated = await res.json();
      onSaved(updated);
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", marginBottom: 8 }}>My Profile</h2>
      <p style={{ color: "#64748b", marginBottom: 36 }}>Update your contact details and learning goals.</p>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
        <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Personal Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>First Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Country <span style={{ color: "#ef4444" }}>*</span></label>
            <select value={form.country_code} onChange={handleCountry} style={inputStyle}>
              <option value="">Select country...</option>
              {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>City <span style={{ color: "#ef4444" }}>*</span></label>
            {cities.length > 0 ? (
              <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle}>
                <option value="">Select city...</option>
                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            ) : (
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} placeholder="Enter your city" />
            )}
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} placeholder="+1 234 567 8900" type="tel" />
          </div>
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} style={inputStyle} type="date" />
          </div>
        </div>

        <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Academic Background</h3>
        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={labelStyle}>Highest Education Level</label>
            <select value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} style={inputStyle}>
              <option value="">Select...</option>
              {["High School Diploma / GED", "Some College", "Associate Degree", "Bachelor's Degree", "Master's or Higher", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Career Goals</label>
            <textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} style={{ ...inputStyle, height: 120, resize: "vertical" }} placeholder="Tell us about your career goals in IT..." />
          </div>
        </div>

        {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 16 }}>{error}</p>}
        {saved && <p style={{ color: "#22c55e", fontSize: 13, marginTop: 16 }}>Profile saved successfully.</p>}

        <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleSubmit} disabled={saving} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 32px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const user = accounts[0] ?? null;
  const [staffAccount, setStaffAccount] = useState(() => staffMsalInstance.getAllAccounts()[0] ?? null);
  const isAdmin = staffAccount?.idTokenClaims?.roles?.includes("Admin") ?? user?.idTokenClaims?.roles?.includes("Admin") ?? false;
  const isInstructor = !isAdmin && (staffAccount?.idTokenClaims?.roles?.includes("Instructor") ?? false);
  const isStaff = !!staffAccount;

  const [view, setView] = useState("home");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [students, setStudents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [deliveryLocations, setDeliveryLocations] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [showSignInSelector, setShowSignInSelector] = useState(false);

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (e) {
      if (e?.errorCode === "interaction_in_progress") {
        await instance.clearCache();
        await instance.loginPopup(loginRequest).catch(() => {});
      }
    }
  };

  const openSignIn = () => setShowSignInSelector(true);

  const handleStaffLogin = async () => {
    const finalize = (account) => {
      setStaffAccount(account);
      setShowSignInSelector(false);
      const roles = account?.idTokenClaims?.roles ?? [];
      if (roles.includes("Admin")) setView("admin");
      else if (roles.includes("Instructor")) setView("educator");
    };
    try {
      const result = await staffMsalInstance.loginPopup(staffLoginRequest);
      finalize(result.account);
    } catch (e) {
      if (e?.errorCode === "interaction_in_progress") {
        await staffMsalInstance.clearCache();
        const result = await staffMsalInstance.loginPopup(staffLoginRequest).catch(() => null);
        if (result) finalize(result.account);
      }
    }
  };

  const handleLogout = () => {
    setProfile(null);
    setProfileLoaded(false);
    if (staffAccount) {
      setStaffAccount(null);
      staffMsalInstance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
    } else {
      instance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetch(`/api/profile/${user.localAccountId}`)
        .then(r => r.json())
        .then(data => { setProfile(data); setProfileLoaded(true); })
        .catch(() => setProfileLoaded(true));
    } else {
      setProfileLoaded(false);
      setProfile(null);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    Promise.all([
      fetch("/api/vendors").then(r => r.json()),
      fetch("/api/courses").then(r => r.json()),
      fetch("/api/schedule").then(r => r.json()),
      fetch("/api/students").then(r => r.json()),
      fetch("/api/profiles").then(r => r.json()),
      fetch("/api/instructors").then(r => r.json()),
      fetch("/api/delivery-locations").then(r => r.json()),
      fetch("/api/enrollments").then(r => r.json()),
    ]).then(([v, c, s, st, p, ins, locs, enr]) => {
      setVendors(v);
      setCourses(c.map(normalizeCourse));
      setSchedule(s.map(normalizeSchedule));
      setStudents(st);
      setProfiles(p);
      setInstructors(ins);
      setDeliveryLocations(locs);
      setEnrollments(enr);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleEnroll = (course) => {
    if (!enrolledCourses.includes(course.id)) {
      setEnrolledCourses(prev => [...prev, course.id]);
    }
  };

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "courses", label: "Courses" },
    { id: "schedule", label: "Schedule" },
    { id: "register", label: "Register" },
    { id: "dashboard", label: "My Learning" },
    ...(isInstructor ? [{ id: "educator", label: "My Portal" }] : []),
    ...(isAdmin ? [{ id: "admin", label: "Admin ⚙️" }] : []),
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 16 }}>
      Loading...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .course-card:hover { transform: translateY(-4px); border-color: rgba(14,165,233,0.3) !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
        select option { background: #1e293b; color: #f1f5f9; }
        input::placeholder, textarea::placeholder { color: #475569; }
        input, textarea, select { color: #f1f5f9 !important; }
      `}</style>

      {showSignInSelector && (
        <SignInSelector
          onStudentLogin={handleLogin}
          onStaffLogin={handleStaffLogin}
          onClose={() => setShowSignInSelector(false)}
        />
      )}

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,30,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 64, gap: 32 }}>
          <div onClick={() => setView("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🖥️</div>
            <div>
              <div style={{ fontWeight: 900, color: "#f1f5f9", fontSize: 15, lineHeight: 1.1 }}>TechBridge</div>
              <div style={{ fontWeight: 600, color: "#64748b", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Institute</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
            {navLinks.map(link => (
              <button key={link.id} onClick={() => setView(link.id)} style={{
                background: view === link.id ? "rgba(14,165,233,0.12)" : "transparent",
                color: view === link.id ? "#0ea5e9" : "#94a3b8",
                border: "none", borderRadius: 10,
                padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                borderBottom: view === link.id ? "2px solid #0ea5e9" : "2px solid transparent",
              }}>{link.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {enrolledCourses.length > 0 && (
              <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#0ea5e9", fontWeight: 700 }}>
                {enrolledCourses.length} enrolled
              </div>
            )}
            {isStaff ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "7px 14px", fontSize: 13, color: "#fca5a5", fontWeight: 600 }}>
                  🛡️ {staffAccount?.name ?? staffAccount?.username ?? "Staff"}
                </div>
                <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Sign Out
                </button>
              </div>
            ) : isAuthenticated ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div onClick={() => setView("profile")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "7px 14px", fontSize: 13, color: "#e2e8f0", fontWeight: 600, cursor: "pointer" }}>
                  👤 {profile ? `${profile.first_name} ${profile.last_name}` : (user?.name ?? "Student")}
                </div>
                <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={openSignIn} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Views */}
      <main>
        {/* Profile setup gate: shown after login if no profile exists yet */}
        {isAuthenticated && profileLoaded && !profile && view !== "profile" && (
          <ProfileSetupView user={user} onSaved={(p) => { setProfile(p); setView("home"); }} />
        )}

        {(!isAuthenticated || !profileLoaded || profile || view === "profile") && (<>
          {view === "home" && <HomeView onNav={setView} vendors={vendors} courses={courses} />}
          {view === "courses" && <CoursesView enrolledCourses={enrolledCourses} onEnroll={handleEnroll} vendors={vendors} courses={courses} />}
          {view === "schedule" && <ScheduleView schedule={schedule} courses={courses} />}
          {view === "register" && (isAuthenticated
            ? <RegisterView enrolledCourses={enrolledCourses} onEnroll={handleEnroll} courses={courses} />
            : <AuthWall onLogin={openSignIn} message="Sign in to register for courses." />
          )}
          {view === "dashboard" && (isAuthenticated
            ? <DashboardView enrolledCourses={enrolledCourses} courses={courses} user={user} profile={profile} />
            : <AuthWall onLogin={openSignIn} message="Sign in to access your dashboard." />
          )}
          {view === "admin" && (
            isAdmin
              ? <AdminView
                  courses={courses} vendors={vendors} schedule={schedule} students={students} profiles={profiles} instructors={instructors} deliveryLocations={deliveryLocations} enrollments={enrollments}
                  onDeleteProfile={(oid) => setProfiles(p => p.filter(x => x.entra_oid !== oid))}
                  onCourseAdd={(c) => setCourses(prev => [...prev, normalizeCourse(c)])}
                  onCourseUpdate={(c) => setCourses(prev => prev.map(x => x.id === c.id ? normalizeCourse(c) : x))}
                  onCourseDelete={(id) => setCourses(prev => prev.filter(x => x.id !== id))}
                  onLocationAdd={(loc) => setDeliveryLocations(prev => [...prev, loc])}
                  onLocationUpdate={(loc) => setDeliveryLocations(prev => prev.map(x => x.id === loc.id ? loc : x))}
                  onLocationDelete={(id) => setDeliveryLocations(prev => prev.filter(x => x.id !== id))}
                  onInstructorAdd={(i) => setInstructors(prev => [...prev, i])}
                  onInstructorUpdate={(i) => setInstructors(prev => prev.map(x => x.id === i.id ? i : x))}
                  onInstructorDeactivate={(id) => setInstructors(prev => prev.map(x => x.id === id ? { ...x, status: "Inactive" } : x))}
                  onEnrollmentAdd={(e) => setEnrollments(prev => [...prev, e])}
                  onEnrollmentRemove={(sid, cid) => setEnrollments(prev => prev.filter(e => !(e.student_id === sid && e.course_id === cid)))}
                  onScheduleAdd={(s) => setSchedule(prev => [...prev, s])}
                  onScheduleUpdate={(s) => setSchedule(prev => prev.map(x => x.id === s.id ? s : x))}
                  onScheduleDelete={(id) => setSchedule(prev => prev.filter(x => x.id !== id))}
                />
              : <AuthWall onLogin={handleLogin} message="Admin access only. Sign in with an administrator account." />
          )}
          {view === "educator" && (
            isInstructor
              ? <EducatorPortalView staffAccount={staffAccount} instructors={instructors} courses={courses} enrollments={enrollments} schedule={schedule} />
              : <AuthWall onLogin={openSignIn} message="Educator access only. Sign in with your institution account." />
          )}
          {view === "profile" && (isAuthenticated
            ? <ProfileEditView user={user} profile={profile} onSaved={setProfile} />
            : <AuthWall onLogin={openSignIn} message="Sign in to view your profile." />
          )}
        </>)}
      </main>

      {/* Footer */}
      {view !== "admin" && view !== "educator" && (
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px", marginTop: 60 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>🖥️</div>
                <span style={{ fontWeight: 900, color: "#f1f5f9" }}>TechBridge Institute</span>
              </div>
              <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7 }}>Empowering careers in IT through industry-recognized certifications and hybrid learning.</p>
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Certifications</div>
              {vendors.map(v => <div key={v.id} style={{ color: "#64748b", fontSize: 13, marginBottom: 6 }}>{v.name}</div>)}
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Platform</div>
              {["Course Catalog", "Class Schedule", "Student Portal", "Certifications", "Admin Console"].map(l => (
                <div key={l} style={{ color: "#64748b", fontSize: 13, marginBottom: 6, cursor: "pointer" }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Contact</div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.8 }}>
                info@techbridge.edu<br />
                +1 (555) 234-5678<br />
                Mon–Fri 8am–6pm EST
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 1100, margin: "32px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: "#475569", fontSize: 12 }}>© 2026 TechBridge Institute. All rights reserved.</span>
            <span style={{ color: "#475569", fontSize: 12 }}>Powered by Microsoft 365 · Moodle · SkillJa · MS Teams</span>
          </div>
        </footer>
      )}
    </div>
  );
}
