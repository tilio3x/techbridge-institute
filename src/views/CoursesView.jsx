import { useState } from "react";
import CourseCard from "../components/CourseCard";

export default function CoursesView({ enrolledCourses, onEnroll, vendors, courses }) {
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
