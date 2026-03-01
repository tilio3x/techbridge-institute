import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const VENDORS = [
  { id: "comptia", name: "CompTIA", color: "#e8320a", logo: "🔴" },
  { id: "microsoft", name: "Microsoft", color: "#00a4ef", logo: "🔷" },
  { id: "fortinet", name: "Fortinet", color: "#ee3124", logo: "🛡️" },
  { id: "ubiquiti", name: "Ubiquiti", color: "#0559c9", logo: "📡" },
  { id: "cisco", name: "Cisco", color: "#1ba0d7", logo: "🌐" },
];

const COURSES = [
  { id: 1, vendor: "comptia", code: "CompTIA A+", title: "IT Fundamentals & Hardware", level: "Beginner", duration: "10 weeks", price: 1200, seats: 20, enrolled: 14, delivery: "Hybrid", nextStart: "2026-04-07", description: "Master PC hardware, software, networking and troubleshooting. The industry-standard entry-level IT certification.", badge: "Core" },
  { id: 2, vendor: "comptia", code: "CompTIA Network+", title: "Networking Fundamentals", level: "Intermediate", duration: "8 weeks", price: 1100, seats: 18, enrolled: 11, delivery: "Online", nextStart: "2026-04-14", description: "Network architecture, protocols, security and troubleshooting for IT professionals.", badge: "Core" },
  { id: 3, vendor: "comptia", code: "CompTIA Security+", title: "Cybersecurity Essentials", level: "Intermediate", duration: "10 weeks", price: 1300, seats: 20, enrolled: 18, delivery: "Hybrid", nextStart: "2026-05-05", description: "Threat management, cryptography, identity management and risk mitigation skills.", badge: "Hot" },
  { id: 4, vendor: "microsoft", code: "AZ-900", title: "Azure Cloud Fundamentals", level: "Beginner", duration: "6 weeks", price: 950, seats: 24, enrolled: 9, delivery: "Online", nextStart: "2026-04-07", description: "Cloud concepts, Azure core services, pricing and support fundamentals.", badge: "New" },
  { id: 5, vendor: "microsoft", code: "MS-900", title: "Microsoft 365 Fundamentals", level: "Beginner", duration: "4 weeks", price: 750, seats: 24, enrolled: 20, delivery: "Hybrid", nextStart: "2026-03-31", description: "M365 productivity services, security, compliance and licensing options.", badge: "" },
  { id: 6, vendor: "microsoft", code: "SC-900", title: "Security, Compliance & Identity", level: "Beginner", duration: "5 weeks", price: 850, seats: 20, enrolled: 7, delivery: "Online", nextStart: "2026-04-21", description: "Fundamentals of security, compliance and identity with Microsoft services.", badge: "" },
  { id: 7, vendor: "fortinet", code: "NSE 1-3", title: "Network Security Awareness", level: "Beginner", duration: "4 weeks", price: 800, seats: 20, enrolled: 12, delivery: "Online", nextStart: "2026-04-07", description: "Cybersecurity awareness, network infrastructure and firewall fundamentals.", badge: "" },
  { id: 8, vendor: "fortinet", code: "NSE 4", title: "FortiGate Firewall Administration", level: "Intermediate", duration: "8 weeks", price: 1400, seats: 16, enrolled: 8, delivery: "Hybrid", nextStart: "2026-05-12", description: "FortiGate security gateway configuration, monitoring and management.", badge: "Hot" },
  { id: 9, vendor: "ubiquiti", code: "UEWA", title: "Enterprise Wireless Admin", level: "Intermediate", duration: "6 weeks", price: 1100, seats: 16, enrolled: 6, delivery: "In-Person", nextStart: "2026-04-28", description: "UniFi wireless network design, deployment and enterprise management.", badge: "New" },
  { id: 10, vendor: "cisco", code: "CCNA", title: "Cisco Networking Associate", level: "Intermediate", duration: "12 weeks", price: 1600, seats: 18, enrolled: 15, delivery: "Hybrid", nextStart: "2026-04-14", description: "Routing, switching, security fundamentals and network automation with Cisco.", badge: "Hot" },
  { id: 11, vendor: "cisco", code: "CCST", title: "Cisco Cybersecurity Technician", level: "Beginner", duration: "8 weeks", price: 1200, seats: 20, enrolled: 10, delivery: "Online", nextStart: "2026-05-05", description: "Entry-level cybersecurity skills including network defense and threat analysis.", badge: "" },
];

const SCHEDULE = [
  { courseId: 1, day: "Mon/Wed", time: "09:00 – 12:00", instructor: "Marcus Williams", room: "Lab A + Teams", type: "Hybrid" },
  { courseId: 2, day: "Tue/Thu", time: "14:00 – 17:00", instructor: "Sandra Lee", room: "MS Teams", type: "Online" },
  { courseId: 3, day: "Mon/Wed/Fri", time: "13:00 – 15:30", instructor: "Darnell Jackson", room: "Lab B + Teams", type: "Hybrid" },
  { courseId: 4, day: "Tue/Thu", time: "09:00 – 11:30", instructor: "Priya Nair", room: "MS Teams", type: "Online" },
  { courseId: 5, day: "Mon/Wed", time: "18:00 – 20:30", instructor: "Chris Okafor", room: "Lab A + Teams", type: "Hybrid" },
  { courseId: 10, day: "Mon/Wed/Fri", time: "09:00 – 11:00", instructor: "Elena Vasquez", room: "Lab B + Teams", type: "Hybrid" },
];

const INTEGRATIONS = [
  { name: "MS Teams", icon: "💬", desc: "Live sessions & collaboration" },
  { name: "OneNote", icon: "📓", desc: "Shared course notebooks" },
  { name: "Moodle LMS", icon: "🎓", desc: "Course content & assignments" },
  { name: "SkillJa", icon: "⚡", desc: "Skills assessment & labs" },
  { name: "NotebookLM", icon: "🤖", desc: "AI-powered study guides" },
  { name: "M365", icon: "☁️", desc: "Student accounts & email" },
];

const MOCK_STUDENTS = [
  { id: "STU-001", name: "Alex Thompson", email: "a.thompson@traineeid.edu", courses: [1, 2], progress: { 1: 72, 2: 45 }, certs: [], joined: "2026-01-15" },
  { id: "STU-002", name: "Maria Santos", email: "m.santos@traineeid.edu", courses: [3, 4], progress: { 3: 100, 4: 88 }, certs: [3], joined: "2026-01-15" },
  { id: "STU-003", name: "James Obi", email: "j.obi@traineeid.edu", courses: [10], progress: { 10: 55 }, certs: [], joined: "2026-02-01" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const vendorOf = (id) => VENDORS.find((v) => v.id === id) || VENDORS[0];
const courseById = (id) => COURSES.find((c) => c.id === id);

const levelColor = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" };

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
  const vendor = vendorOf(course.vendor);
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

// ─── VIEWS ───────────────────────────────────────────────────────────────────

function HomeView({ onNav }) {
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
          {[["11+", "Courses Available"], ["5", "Vendor Partners"], ["Hybrid", "Delivery Model"], ["M365", "Student Accounts"]].map(([val, lbl]) => (
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
          {VENDORS.map((v) => {
            const count = COURSES.filter(c => c.vendor === v.id).length;
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

function CoursesView({ enrolledCourses, onEnroll }) {
  const [filter, setFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");

  const filtered = COURSES.filter(c => {
    if (filter !== "all" && c.vendor !== filter) return false;
    if (levelFilter !== "all" && c.level !== levelFilter) return false;
    if (deliveryFilter !== "all" && c.delivery !== deliveryFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", marginBottom: 8, fontFamily: "Georgia, serif" }}>Course Catalog</h2>
      <p style={{ color: "#64748b", marginBottom: 32 }}>{COURSES.length} courses across 5 certification tracks</p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[{ id: "all", name: "All Vendors" }, ...VENDORS].map(v => (
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

function ScheduleView() {
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
            {SCHEDULE.map((s, i) => {
              const course = courseById(s.courseId);
              const vendor = vendorOf(course.vendor);
              return (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td style={{ padding: "16px", color: "#f1f5f9", fontWeight: 600 }}>
                    <div>{course.title}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{course.code}</div>
                  </td>
                  <td style={{ padding: "16px" }}><span style={{ color: vendor.color, fontWeight: 700, fontSize: 12 }}>{vendor.name}</span></td>
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

function RegisterView({ enrolledCourses, onEnroll }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", dob: "", education: "", goals: "", selectedCourses: [] });
  const [submitted, setSubmitted] = useState(false);

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
            {COURSES.map(course => {
              const vendor = vendorOf(course.vendor);
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
                    <div style={{ fontSize: 11, color: vendor.color, fontWeight: 700, marginBottom: 2 }}>{vendor.name} · {course.code}</div>
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
                const v = vendorOf(c.vendor);
                return (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, color: "#e2e8f0", fontSize: 14 }}>
                    <span><span style={{ color: v.color, fontWeight: 700 }}>{v.name}</span> · {c.title}</span>
                    <span style={{ color: "#f1f5f9", fontWeight: 700 }}>${c.price.toLocaleString()}</span>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}>
                <span style={{ color: "#f1f5f9" }}>Total</span>
                <span style={{ color: "#0ea5e9" }}>${form.selectedCourses.reduce((s, id) => s + courseById(id).price, 0).toLocaleString()}</span>
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

function DashboardView({ enrolledCourses }) {
  const student = { ...MOCK_STUDENTS[0], courses: enrolledCourses.length > 0 ? enrolledCourses : MOCK_STUDENTS[1].courses };
  const [activeCourse, setActiveCourse] = useState(null);
  const [showCert, setShowCert] = useState(null);

  const mockProgress = enrolledCourses.reduce((acc, id) => {
    acc[id] = Math.floor(Math.random() * 80) + 10;
    return acc;
  }, { ...MOCK_STUDENTS[0].progress, ...MOCK_STUDENTS[1].progress });

  const coursesToShow = enrolledCourses.length > 0 ? enrolledCourses : MOCK_STUDENTS[1].courses;

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", marginBottom: 4 }}>Student Dashboard</h2>
          <p style={{ color: "#64748b" }}>Welcome back, <span style={{ color: "#0ea5e9" }}>Maria Santos</span></p>
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
          const vendor = vendorOf(course.vendor);
          const progress = mockProgress[id] || 55;
          const completed = progress === 100;
          return (
            <div key={id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: vendor.color }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: vendor.color, fontWeight: 700, marginBottom: 4 }}>{vendor.name} · {course.code}</div>
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

function AdminView() {
  const [tab, setTab] = useState("overview");

  const adminTabs = ["overview", "students", "courses", "schedule", "integrations"];

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
        {tab === "overview" && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", marginBottom: 32 }}>Platform Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 40 }}>
              {[
                { label: "Total Students", value: 47, change: "+8 this month", color: "#0ea5e9" },
                { label: "Active Courses", value: 11, change: "2 starting soon", color: "#6366f1" },
                { label: "Completions", value: 23, change: "+5 this week", color: "#22c55e" },
                { label: "Certs Issued", value: 19, change: "+3 this week", color: "#fbbf24" },
                { label: "M365 Accounts", value: 47, change: "All synced ✓", color: "#0ea5e9" },
                { label: "Avg Completion", value: "71%", change: "↑ from 64%", color: "#22c55e" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: stat.color, fontFamily: "Georgia, serif" }}>{stat.value}</div>
                  <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13, margin: "4px 0" }}>{stat.label}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{stat.change}</div>
                </div>
              ))}
            </div>
            <h3 style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 16 }}>Recent Registrations</h3>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
              {MOCK_STUDENTS.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i < MOCK_STUDENTS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {s.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{s.email}</div>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>{s.courses.length} course{s.courses.length !== 1 ? "s" : ""}</div>
                  <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>{s.joined}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "students" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", margin: 0 }}>Students</h2>
              <button style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ Add Student</button>
            </div>
            {MOCK_STUDENTS.map(s => (
              <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                    {s.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>{s.name}</div>
                        <div style={{ color: "#0ea5e9", fontSize: 13, fontFamily: "monospace" }}>{s.email}</div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>ID: {s.id} · Joined: {s.joined}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                        <button style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>M365</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {s.courses.map(id => {
                        const c = courseById(id);
                        if (!c) return null;
                        const prog = s.progress[id] || 0;
                        return (
                          <div key={id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "#e2e8f0", fontSize: 13 }}>{c.code}</span>
                            <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${prog}%`, background: prog === 100 ? "#22c55e" : "#0ea5e9", borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12, color: prog === 100 ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>{prog}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "courses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", margin: 0 }}>Course Management</h2>
              <button style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ New Course</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    {["Course", "Vendor", "Level", "Delivery", "Enrollment", "Start Date", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COURSES.map((c, i) => {
                    const v = vendorOf(c.vendor);
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "14px" }}>
                          <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.title}</div>
                          <div style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>{c.code}</div>
                        </td>
                        <td style={{ padding: "14px" }}><span style={{ color: v.color, fontWeight: 700 }}>{v.name}</span></td>
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
                        <td style={{ padding: "14px", color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>{c.nextStart}</td>
                        <td style={{ padding: "14px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Edit</button>
                            <button style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

        {tab === "schedule" && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", fontFamily: "Georgia, serif", marginBottom: 24 }}>Schedule Management</h2>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 4 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Course", "Days", "Time", "Instructor", "Room", "Format"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE.map((s, i) => {
                    const c = courseById(s.courseId);
                    const v = vendorOf(c.vendor);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.title}</div>
                          <div style={{ color: v.color, fontSize: 11, fontWeight: 700 }}>{c.code}</div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#94a3b8", fontFamily: "monospace" }}>{s.day}</td>
                        <td style={{ padding: "14px 16px", color: "#94a3b8", fontFamily: "monospace" }}>{s.time}</td>
                        <td style={{ padding: "14px 16px", color: "#e2e8f0" }}>{s.instructor}</td>
                        <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: 12 }}>{s.room}</td>
                        <td style={{ padding: "14px 16px" }}><Chip text={s.type} color={s.type === "Online" ? "#0ea5e9" : "#8b5cf6"} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("home");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { id: "admin", label: "Admin ⚙️" },
  ];

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
            <button onClick={() => setView("register")} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Views */}
      <main>
        {view === "home" && <HomeView onNav={setView} />}
        {view === "courses" && <CoursesView enrolledCourses={enrolledCourses} onEnroll={handleEnroll} />}
        {view === "schedule" && <ScheduleView />}
        {view === "register" && <RegisterView enrolledCourses={enrolledCourses} onEnroll={handleEnroll} />}
        {view === "dashboard" && <DashboardView enrolledCourses={enrolledCourses} />}
        {view === "admin" && <AdminView />}
      </main>

      {/* Footer */}
      {view !== "admin" && (
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
              {VENDORS.map(v => <div key={v.id} style={{ color: "#64748b", fontSize: 13, marginBottom: 6 }}>{v.name}</div>)}
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
