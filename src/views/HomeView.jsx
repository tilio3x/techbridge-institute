import { useNavigate } from "react-router-dom";
import { INTEGRATIONS } from "../utils/constants";

export default function HomeView({ vendors, courses }) {
  const navigate = useNavigate();

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
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
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
          <button onClick={() => navigate("/courses")} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 14, padding: "16px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 32px rgba(14,165,233,0.3)" }}>
            Browse Courses →
          </button>
          <button onClick={() => navigate("/register")} style={{ background: "rgba(255,255,255,0.05)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "16px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            Register Today
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 48, marginTop: 80, flexWrap: "wrap", justifyContent: "center" }}>
          {[[`${courses.length}+`, "Courses Available"], [`${vendors.length}`, "Vendor Partners"], ["Hybrid", "Delivery Model"], ["M365", "Student Accounts"]].map(([val, lbl]) => (
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
          {vendors.map((v) => {
            const count = courses.filter(c => c.vendor === v.id).length;
            return (
              <div key={v.id} onClick={() => navigate("/courses")} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${v.color}33`, borderRadius: 16, padding: 28, textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}>
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
