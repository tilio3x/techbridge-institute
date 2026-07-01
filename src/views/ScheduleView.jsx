import Chip from "../components/Chip";

export default function ScheduleView({ schedule, courses }) {
  const courseById = (id) => courses.find(c => c.id === id);

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1e293b", marginBottom: 8, fontFamily: "Inter, system-ui, sans-serif" }}>Class Schedule</h2>
      <p style={{ color: "#64748b", marginBottom: 36 }}>Spring 2026 · All times local</p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
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
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td style={{ padding: "16px", color: "#1e293b", fontWeight: 600 }}>
                    <div>{course.title}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{course.code}</div>
                  </td>
                  <td style={{ padding: "16px" }}><span style={{ color: course.vendorColor, fontWeight: 700, fontSize: 12 }}>{course.vendorName}</span></td>
                  <td style={{ padding: "16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 13 }}>{s.day}</td>
                  <td style={{ padding: "16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 13 }}>{s.time}</td>
                  <td style={{ padding: "16px", color: "#334155" }}>{s.instructor}</td>
                  <td style={{ padding: "16px", color: "#94a3b8", fontSize: 13 }}>{s.room}</td>
                  <td style={{ padding: "16px" }}><Chip text={s.type} color={s.type === "Online" ? "#3b82f6" : s.type === "Hybrid" ? "#8b5cf6" : "#f59e0b"} /></td>
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
      <div style={{ marginTop: 40, background: "#f8fafc", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0" }}>
        <h3 style={{ color: "#334155", fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Delivery Format Legend</h3>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[
            { type: "Hybrid", desc: "In-person lab sessions + MS Teams for remote students", icon: "🏫" },
            { type: "Online", desc: "Fully virtual via MS Teams, Moodle & SkillJa", icon: "💻" },
            { type: "In-Person", desc: "On-site lab-intensive sessions with hands-on equipment", icon: "🔧" },
          ].map(d => (
            <div key={d.type} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>{d.icon}</span>
              <div>
                <div style={{ color: "#334155", fontWeight: 700, fontSize: 14 }}>{d.type}</div>
                <div style={{ color: "#64748b", fontSize: 13, maxWidth: 260 }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
