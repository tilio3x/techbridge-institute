import { useNavigate } from "react-router-dom";

export default function CoursesView({ vendors, courses }) {
  const navigate = useNavigate();

  const vendorCourseCount = (vendorId) => courses.filter(c => c.vendor === vendorId).length;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 80px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", letterSpacing: -0.5, marginBottom: 8 }}>
          Course Catalog
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>
          Explore {courses.length} courses across {vendors.length} industry-leading certification tracks
        </p>
      </div>

      {/* Main layout: sidebar + vendor cards */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40, alignItems: "start" }}>
        {/* Sidebar navigation */}
        <aside style={{
          background: "#ffffff", borderRadius: 12, border: "1px solid #cbd5e1",
          padding: "24px 20px", position: "sticky", top: 84,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>Browse by</div>

          {[
            { label: "Certification Paths", icon: "🎓", desc: "Industry-recognized credentials", active: true },
            { label: "Career Paths", icon: "🚀", desc: "Role-based learning journeys", active: false },
            { label: "Skill Paths", icon: "⚡", desc: "Focused skill development", active: false },
          ].map(item => (
            <div
              key={item.label}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                marginBottom: 4, transition: "all 0.2s ease",
                background: item.active ? "rgba(59,130,246,0.06)" : "transparent",
                border: item.active ? "1px solid rgba(59,130,246,0.15)" : "1px solid transparent",
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: item.active ? "#3b82f6" : "#334155",
                }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </aside>

        {/* Vendor cards grid */}
        <div>
          <div style={{ marginBottom: 24 }}>
            <span style={{ color: "#64748b", fontSize: 14 }}>
              <strong style={{ color: "#1e293b" }}>{vendors.length}</strong> certification tracks available
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {vendors.map(v => {
              const count = vendorCourseCount(v.id);
              const levels = [...new Set(courses.filter(c => c.vendor === v.id).map(c => c.level))];
              return (
                <div
                  key={v.id}
                  onClick={() => navigate(`/courses/${v.id}`)}
                  className="course-card"
                  style={{
                    background: "#ffffff", borderRadius: 12, overflow: "hidden",
                    border: "1px solid #cbd5e1", cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Colored header */}
                  <div style={{
                    background: `linear-gradient(135deg, ${v.color}20, ${v.color}08)`,
                    borderBottom: `2px solid ${v.color}40`,
                    padding: "28px 24px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>{v.logo}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{v.name}</div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 14, color: "#64748b" }}>
                        <strong style={{ color: "#1e293b", fontSize: 20 }}>{count}</strong> course{count !== 1 ? "s" : ""}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        {levels.map(l => (
                          <span key={l} style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                            background: l === "Beginner" ? "#dcfce7" : l === "Intermediate" ? "#fef3c7" : "#fee2e2",
                            color: l === "Beginner" ? "#15803d" : l === "Intermediate" ? "#b45309" : "#dc2626",
                          }}>{l}</span>
                        ))}
                      </div>
                    </div>

                    <button style={{
                      width: "100%", background: v.color, color: "#ffffff",
                      border: "none", borderRadius: 8, padding: "10px 20px",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}>
                      View Courses →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
