import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CourseCard from "../components/CourseCard";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Starting Soon" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "title", label: "Alphabetical" },
];

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: 20, marginBottom: 20 }}>
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
        border: checked ? "none" : "2px solid #94a3b8",
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

export default function VendorCoursesView({ enrolledCourses, onEnroll, vendors, courses }) {
  const { vendorId } = useParams();
  const navigate = useNavigate();

  const vendor = vendors.find(v => v.id === vendorId || v.id === Number(vendorId));
  const vendorCourses = useMemo(() => courses.filter(c => c.vendor === (vendor?.id)), [courses, vendor]);

  const [search, setSearch] = useState("");
  const [levelFilters, setLevelFilters] = useState([]);
  const [deliveryFilters, setDeliveryFilters] = useState([]);
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);

  const toggleFilter = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = vendorCourses.filter(c => {
      if (search) {
        const q = search.toLowerCase();
        const match = c.title.toLowerCase().includes(q)
          || c.code.toLowerCase().includes(q)
          || c.description.toLowerCase().includes(q)
          || (c.tags || []).some(t => t.toLowerCase().includes(q));
        if (!match) return false;
      }
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
  }, [vendorCourses, search, levelFilters, deliveryFilters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const levelCounts = useMemo(() => {
    const counts = {};
    vendorCourses.forEach(c => { counts[c.level] = (counts[c.level] || 0) + 1; });
    return counts;
  }, [vendorCourses]);

  const deliveryCounts = useMemo(() => {
    const counts = {};
    vendorCourses.forEach(c => { counts[c.delivery] = (counts[c.delivery] || 0) + 1; });
    return counts;
  }, [vendorCourses]);

  const activeFilterCount = levelFilters.length + deliveryFilters.length;

  const clearAll = () => {
    setLevelFilters([]);
    setDeliveryFilters([]);
    setSearch("");
    setPage(1);
  };

  if (!vendor) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Vendor not found</h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>The certification track you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/courses")} style={{
          background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>Back to Catalog</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 80px" }}>
      {/* Breadcrumb + header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <button onClick={() => navigate("/courses")} style={{
            background: "none", border: "none", color: "#3b82f6", fontSize: 14,
            fontWeight: 600, cursor: "pointer", padding: 0,
          }}>← Back to Catalog</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: `linear-gradient(135deg, ${vendor.color}20, ${vendor.color}08)`,
            border: `2px solid ${vendor.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          }}>{vendor.logo}</div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", letterSpacing: -0.5, margin: 0 }}>
              {vendor.name}
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
              {vendorCourses.length} course{vendorCourses.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
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
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder={`Search ${vendor.name} courses...`}
          style={{
            width: "100%", padding: "14px 16px 14px 48px",
            background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 12,
            fontSize: 15, color: "#1e293b", outline: "none",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
          onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
        />
        {search && (
          <button
            onClick={() => { setSearch(""); setPage(1); }}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "#f1f5f9", border: "none", borderRadius: 6,
              width: 28, height: 28, cursor: "pointer", color: "#64748b", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        )}
      </div>

      {/* Main layout: sidebar + courses */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40, alignItems: "start" }}>
        {/* Sidebar filters */}
        <aside style={{
          background: "#ffffff", borderRadius: 12, border: "1px solid #cbd5e1",
          padding: "24px 20px", position: "sticky", top: 84,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
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
          {/* Toolbar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 24,
          }}>
            <span style={{ color: "#64748b", fontSize: 14 }}>
              Showing <strong style={{ color: "#1e293b" }}>{filtered.length}</strong> course{filtered.length !== 1 ? "s" : ""}
              {search && <> matching "<strong style={{ color: "#3b82f6" }}>{search}</strong>"</>}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>Sort by</span>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1); }}
                style={{
                  background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8,
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

          {/* Course list */}
          {paginated.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {paginated.map(course => (
                <CourseCard key={course.id} course={course} onEnroll={onEnroll} isEnrolled={enrolledCourses.includes(course.id)} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "80px 24px",
              background: "#ffffff", borderRadius: 12, border: "1px solid #cbd5e1",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>No courses found</h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
                Try adjusting your search or filters.
              </p>
              <button onClick={clearAll} style={{
                background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Clear all filters</button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              gap: 8, marginTop: 32,
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8,
                  padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: page === 1 ? "default" : "pointer",
                  color: page === 1 ? "#cbd5e1" : "#334155",
                }}
              >← Previous</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    background: p === page ? "#3b82f6" : "#ffffff",
                    color: p === page ? "#ffffff" : "#334155",
                    border: p === page ? "1px solid #3b82f6" : "1px solid #cbd5e1",
                    borderRadius: 8, width: 36, height: 36,
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >{p}</button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8,
                  padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: page === totalPages ? "default" : "pointer",
                  color: page === totalPages ? "#cbd5e1" : "#334155",
                }}
              >Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
