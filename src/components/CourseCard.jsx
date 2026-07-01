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
      border: "1px solid #e2e8f0", display: "flex", flexDirection: "row",
      cursor: "pointer",
    }}>
      {/* Vendor color bar (left edge) */}
      <div style={{ width: 4, background: vendor.color, flexShrink: 0 }} />

      {/* Main content */}
      <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        {/* Top row: vendor + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{vendor.logo}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: vendor.color, letterSpacing: 0.3 }}>{vendor.name}</span>
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "#94a3b8" }}>{course.code}</span>
          <Badge text={course.badge} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", lineHeight: 1.4 }}>
          {course.title}
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
          {course.description.length > 180 ? course.description.slice(0, 180) + "…" : course.description}
        </p>

        {/* Metadata pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
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

      {/* Right side: price + CTA */}
      <div style={{
        borderLeft: "1px solid #f1f5f9", padding: "20px 24px",
        display: "flex", flexDirection: "column", alignItems: "flex-end",
        justifyContent: "center", gap: 10, flexShrink: 0, minWidth: 160,
      }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>${course.price.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            Starts {new Date(course.nextStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
          <div style={{ fontSize: 11, color: seatsLeft < 5 ? "#ef4444" : "#94a3b8" }}>
            {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onEnroll(course); }}
          style={{
            background: isEnrolled ? "#f0fdf4" : "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: isEnrolled ? "#22c55e" : "#ffffff",
            border: isEnrolled ? "1px solid #bbf7d0" : "none",
            borderRadius: 8, padding: "9px 24px", fontSize: 13,
            fontWeight: 600, cursor: isEnrolled ? "default" : "pointer",
            transition: "all 0.2s ease", width: "100%",
          }}
        >
          {isEnrolled ? "✓ Enrolled" : "Enroll"}
        </button>
      </div>
    </div>
  );
}
