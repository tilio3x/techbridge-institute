import { useState } from "react";
import { INTEGRATIONS } from "../utils/constants";

export default function DashboardView({ enrolledCourses, courses, user, profile }) {
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
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", marginBottom: 4 }}>Student Dashboard</h2>
          <p style={{ color: "#64748b" }}>Welcome back, <span style={{ color: "#0ea5e9" }}>{user?.name ?? user?.username ?? "Student"}</span></p>
        </div>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 20px", fontSize: 13, color: "#94a3b8" }}>
          <span style={{ color: "#64748b" }}>M365: </span>
          <span style={{ color: "#0ea5e9", fontFamily: "monospace" }}>m.santos@trainee.edu</span>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 36 }}>
        {INTEGRATIONS.map(int => (
          <div key={int.name} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{int.icon}</div>
            <div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>Open {int.name}</div>
          </div>
        ))}
      </div>

      {/* Courses */}
      <h3 style={{ color: "#334155", fontWeight: 700, marginBottom: 20, fontSize: 20 }}>My Courses</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 40 }}>
        {coursesToShow.map(id => {
          const course = courseById(id);
          if (!course) return null;
          const progress = mockProgress[id] || 55;
          const completed = progress === 100;
          return (
            <div key={id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: course.vendorColor }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: course.vendorColor, fontWeight: 700, marginBottom: 4 }}>{course.vendorName} · {course.code}</div>
                  <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 16 }}>{course.title}</div>
                </div>
                {completed && <span style={{ fontSize: 24 }}>🏆</span>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>Progress</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: completed ? "#22c55e" : "#1e293b" }}>{progress}%</span>
                </div>
                <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
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
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 36, maxWidth: 600, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ color: "#0ea5e9", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{activeCourse.code}</div>
                <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 22, margin: 0 }}>{activeCourse.title}</h3>
              </div>
              <button onClick={() => setActiveCourse(null)} style={{ background: "rgba(0,0,0,0.03)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[["Next Session", "Tuesday, March 3 · 9:00 AM"], ["Instructor", "Sandra Lee"], ["Platform", "MS Teams + Moodle"], ["Assignment Due", "March 7, 2026"]].map(([k, v]) => (
                <div key={k} style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                  <div style={{ color: "#334155", fontSize: 14 }}>{v}</div>
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
            <button onClick={() => setShowCert(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.03)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>✕</button>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <div style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Certificate of Completion</div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>This certifies that</div>
            <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "Georgia, serif", color: "#1e293b", marginBottom: 8 }}>Maria Santos</div>
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
