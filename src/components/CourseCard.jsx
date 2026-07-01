import Badge from "./Badge";

const levelStyle = {
  Beginner: { bg: "#dcfce7", color: "#15803d" },
  Intermediate: { bg: "#fef3c7", color: "#b45309" },
  Advanced: { bg: "#fee2e2", color: "#dc2626" },
};

export default function CourseCard({ course, onEnroll, isEnrolled }) {
  const vendor = { name: course.vendorName, color: course.vendorColor, logo: course.vendorLogo };
  const seatsLeft = course.seats - course.enrolled;
  const lvl = levelStyle[course.level] || levelStyle.Beginner;

  return (
    <div className="course-card" style={{
      background: "#ffffff", borderRadius: 12, overflow: "hidden",
      border: "1px solid #e2e8f0", display: "flex", flexDirection: "column",
      cursor: "pointer",
    }}>
      {/* Colored header strip */}
      <div style={{
        background: `linear-gradient(135deg, ${vendor.color}18, ${vendor.color}08)`,
        borderBottom: `2px solid ${vendor.color}30`,
        padding: "16px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{vendor.logo}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: vendor.color, letterSpacing: 0.3 }}>{vendor.name}</span>
        </div>
        <Badge text={course.badge} />
      </div>

      {/* Content */}
      <div style={{ padding: "20px 20px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", lineHeight: 1.4, marginBottom: 4 }}>
            {course.title}
          </div>
          <div style={{ fontSize: 12, fontFamily: "monospace", color: "#94a3b8" }}>{course.code}</div>
        </div>

        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0, flex: 1 }}>
          {course.description.length > 120 ? course.description.slice(0, 120) + "…" : course.description}
        </p>

        {/* Metadata row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{
            background: lvl.bg, color: lvl.color, fontSize: 11, fontWeight: 600,
            padding: "3px 10px", borderRadius: 20,
          }}>{course.level}</span>
          <span style={{
            background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 500,
            padding: "3px 10px", borderRadius: 20,
          }}>{course.delivery}</span>
          <span style={{
            background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 500,
            padding: "3px 10px", borderRadius: 20,
          }}>{course.duration}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "14px 20px", borderTop: "1px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>${course.price.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {new Date(course.nextStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onEnroll(course); }}
          style={{
            background: isEnrolled ? "#f0fdf4" : "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: isEnrolled ? "#22c55e" : "#ffffff",
            border: isEnrolled ? "1px solid #bbf7d0" : "none",
            borderRadius: 8, padding: "9px 20px", fontSize: 13,
            fontWeight: 600, cursor: isEnrolled ? "default" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {isEnrolled ? "✓ Enrolled" : "Enroll"}
        </button>
      </div>
    </div>
  );
}
