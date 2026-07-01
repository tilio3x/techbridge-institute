import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Certification paths", id: "certs", active: true },
  { label: "Skill paths", id: "skills", active: false },
  { label: "Career paths", id: "careers", active: false },
];

export default function CoursesView({ vendors, courses }) {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 80px" }}>
      {/* Main layout: sidebar + content */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 48, alignItems: "start" }}>
        {/* Sidebar — flat text links */}
        <nav style={{ position: "sticky", top: 84 }}>
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", cursor: "pointer",
                borderLeft: item.active ? "3px solid #3b82f6" : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{
                fontSize: 15, fontWeight: item.active ? 600 : 400,
                color: item.active ? "#3b82f6" : "#475569",
              }}>{item.label}</span>
              {item.active && <span style={{ color: "#3b82f6", fontSize: 14 }}>›</span>}
            </div>
          ))}
        </nav>

        {/* Center content */}
        <div>
          {/* Heading + description */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", letterSpacing: -0.5, margin: "0 0 12px" }}>
              Certification paths
            </h1>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 720 }}>
              Prepare for top industry certifications with a guided path. Each one includes expert-reviewed lessons, hands-on projects, and practice tests to help you pass the exam.
            </p>
          </div>

          {/* Providers label */}
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Providers</div>

          {/* Vendor logo grid — 4 columns, minimal cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {vendors.map(v => (
              <div
                key={v.id}
                onClick={() => navigate(`/courses/${v.id}`)}
                style={{
                  background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10,
                  padding: "24px 16px", textAlign: "center", cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  minHeight: 56,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <span style={{ fontSize: 22 }}>{v.logo}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>{v.name}</span>
              </div>
            ))}
          </div>

          {/* Explore all link */}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <span
              onClick={() => {}}
              style={{
                color: "#3b82f6", fontSize: 15, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Explore all {courses.length} certification paths →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
