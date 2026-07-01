import { useState, useMemo } from "react";
import CourseCard from "../components/CourseCard";

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Starting Soon" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "title", label: "Alphabetical" },
];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 20, marginBottom: 20 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none", border: "none", cursor: "pointer", width: "100%",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: 0, marginBottom: open ? 12 : 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</span>
        <span style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1, transition: "transform 0.2s", transform: open ? "rotate(0)" : "rotate(-90deg)" }}>▾</span>
      </button>
      {open && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange, count, color }) {
  return (
    <div onClick={onChange} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 0", fontSize: 14 }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
        border: checked ? "none" : "2px solid #cbd5e1",
        background: checked ? (color || "#3b82f6") : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
      }}>
        {checked && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ color: "#334155", flex: 1 }}>{label}</span>
      {count !== undefined && <span style={{ color: "#94a3b8", fontSize: 12 }}>{count}</span>}
    </div>
  );
}

export default function CoursesView({ enrolledCourses, onEnroll, vendors, courses }) {
  const [search, setSearch] = useState("");
  const [vendorFilters, setVendorFilters] = useState([]);
  const [levelFilters, setLevelFilters] = useState([]);
  const [deliveryFilters, setDeliveryFilters] = useState([]);
  const [sort, setSort] = useState("popular");

  const toggleFilter = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const filtered = useMemo(() => {
    let result = courses.filter(c => {
      if (search) {
        const q = search.toLowerCase();
        const match = c.title.toLowerCase().includes(q)
          || c.code.toLowerCase().includes(q)
          || c.vendorName.toLowerCase().includes(q)
          || c.description.toLowerCase().includes(q)
          || (c.tags || []).some(t => t.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (vendorFilters.length && !vendorFilters.includes(c.vendor)) return false;
      if (levelFilters.length && !levelFilters.includes(c.level)) return false;
      if (deliveryFilters.length && !deliveryFilters.includes(c.delivery)) return false;
      return true;
    });

    switch (sort) {
      case "popular": result.sort((a, b) => b.enrolled - a.enrolled); break;
      case "newest": result.sort((a, b) => new Date(a.nextStart) - new Date(b.nextStart)); break;
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "title": result.sort((a, b) => a.title.localeCompare(b.title)); break;
    }
    return result;
  }, [courses, search, vendorFilters, levelFilters, deliveryFilters, sort]);

  const vendorCounts = useMemo(() => {
    const counts = {};
    courses.forEach(c => { counts[c.vendor] = (counts[c.vendor] || 0) + 1; });
    return counts;
  }, [courses]);

  const levelCounts = useMemo(() => {
    const counts = {};
    courses.forEach(c => { counts[c.level] = (counts[c.level] || 0) + 1; });
    return counts;
  }, [courses]);

  const deliveryCounts = useMemo(() => {
    const counts = {};
    courses.forEach(c => { counts[c.delivery] = (counts[c.delivery] || 0) + 1; });
    return counts;
  }, [courses]);

  const activeFilterCount = vendorFilters.length + levelFilters.length + deliveryFilters.length;

  const clearAll = () => {
    setVendorFilters([]);
    setLevelFilters([]);
    setDeliveryFilters([]);
    setSearch("");
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 80px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", letterSpacing: -0.5, marginBottom: 8 }}>
          Course Catalog
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>
          Browse {courses.length} courses across {vendors.length} industry-leading certification tracks
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 32 }}>
        <div style={{
          position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
          color: "#94a3b8", fontSize: 18, pointerEvents: "none",
        }}>🔍</div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search courses, certifications, or topics..."
          style={{
            width: "100%", padding: "14px 16px 14px 48px",
            background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12,
            fontSize: 15, color: "#1e293b", outline: "none",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "#f1f5f9", border: "none", borderRadius: 6,
              width: 28, height: 28, cursor: "pointer", color: "#64748b", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        )}
      </div>

      {/* Main layout: sidebar + grid */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40, alignItems: "start" }}>
        {/* Sidebar filters */}
        <aside style={{
          background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0",
          padding: "24px 20px", position: "sticky", top: 84,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} style={{
                background: "none", border: "none", color: "#3b82f6", fontSize: 13,
                fontWeight: 600, cursor: "pointer", padding: 0,
              }}>Clear all ({activeFilterCount})</button>
            )}
          </div>

          <FilterSection title="Certification Track">
            {vendors.map(v => (
              <FilterCheckbox
                key={v.id}
                label={v.name}
                checked={vendorFilters.includes(v.id)}
                onChange={() => toggleFilter(vendorFilters, setVendorFilters, v.id)}
                count={vendorCounts[v.id]}
                color={v.color}
              />
            ))}
          </FilterSection>

          <FilterSection title="Level">
            {["Beginner", "Intermediate", "Advanced"].map(level => (
              <FilterCheckbox
                key={level}
                label={level}
                checked={levelFilters.includes(level)}
                onChange={() => toggleFilter(levelFilters, setLevelFilters, level)}
                count={levelCounts[level]}
                color={level === "Beginner" ? "#22c55e" : level === "Intermediate" ? "#f59e0b" : "#ef4444"}
              />
            ))}
          </FilterSection>

          <FilterSection title="Delivery Format">
            {["Online", "Hybrid", "In-Person"].map(d => (
              <FilterCheckbox
                key={d}
                label={d}
                checked={deliveryFilters.includes(d)}
                onChange={() => toggleFilter(deliveryFilters, setDeliveryFilters, d)}
                count={deliveryCounts[d]}
              />
            ))}
          </FilterSection>
        </aside>

        {/* Results */}
        <div>
          {/* Toolbar: count + sort */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 24,
          }}>
            <span style={{ color: "#64748b", fontSize: 14 }}>
              Showing <strong style={{ color: "#1e293b" }}>{filtered.length}</strong> of {courses.length} courses
              {search && <> matching "<strong style={{ color: "#3b82f6" }}>{search}</strong>"</>}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>Sort by</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{
                  background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8,
                  padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#334155",
                  cursor: "pointer", outline: "none",
                }}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {vendorFilters.map(vId => {
                const v = vendors.find(x => x.id === vId);
                return v && (
                  <button key={vId} onClick={() => toggleFilter(vendorFilters, setVendorFilters, vId)} style={{
                    background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#3b82f6",
                    fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}>{v.name} <span style={{ fontSize: 14, lineHeight: 1 }}>×</span></button>
                );
              })}
              {levelFilters.map(l => (
                <button key={l} onClick={() => toggleFilter(levelFilters, setLevelFilters, l)} style={{
                  background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
                  borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#8b5cf6",
                  fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>{l} <span style={{ fontSize: 14, lineHeight: 1 }}>×</span></button>
              ))}
              {deliveryFilters.map(d => (
                <button key={d} onClick={() => toggleFilter(deliveryFilters, setDeliveryFilters, d)} style={{
                  background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#22c55e",
                  fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>{d} <span style={{ fontSize: 14, lineHeight: 1 }}>×</span></button>
              ))}
            </div>
          )}

          {/* Course grid */}
          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {filtered.map(course => (
                <CourseCard key={course.id} course={course} onEnroll={onEnroll} isEnrolled={enrolledCourses.includes(course.id)} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "80px 24px",
              background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>No courses found</h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <button onClick={clearAll} style={{
                background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Clear all filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
