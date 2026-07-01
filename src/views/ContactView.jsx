import { useState, useEffect } from "react";

export default function ContactView({ deliveryLocations }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch("/api/locations/physical").then(r => r.json()).then(setLocations).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", background: "#f1f5f9", border: "1px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, color: "#1e293b", outline: "none",
  };
  const labelStyle = { display: "block", color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6 };

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 28 }}>✓</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>Message Sent!</h2>
        <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.7 }}>Thank you for reaching out. Our team will get back to you within 1–2 business days.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>
          Get in <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Touch</span>
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>Have a question about our programs? Want to partner with us? We'd love to hear from you.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
        {/* Inquiry Form */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#334155", marginBottom: 24 }}>Send Us a Message</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input required type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <label style={labelStyle}>Subject *</label>
                <select required style={{ ...inputStyle, cursor: "pointer" }} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                  <option value="">Select a subject</option>
                  <option>General Inquiry</option>
                  <option>Enrollment</option>
                  <option>Partnership</option>
                  <option>Technical Support</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Message *</label>
              <textarea required rows={5} style={{ ...inputStyle, resize: "vertical" }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="How can we help you?" />
            </div>
            <button type="submit" disabled={submitting} style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", border: "none", borderRadius: 12,
              padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1, alignSelf: "flex-start",
            }}>
              {submitting ? "Sending..." : "Send Message →"}
            </button>
          </form>
        </div>

        {/* Right column: Contact info + Map */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Contact Info */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#334155", marginBottom: 20 }}>Contact Information</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📧</div>
                <div><div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Email</div><div style={{ color: "#334155", fontSize: 14 }}>info@techbridge.edu</div></div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📞</div>
                <div><div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Phone</div><div style={{ color: "#334155", fontSize: 14 }}>+1 (555) 234-5678</div></div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🕐</div>
                <div><div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Hours</div><div style={{ color: "#334155", fontSize: 14 }}>Mon–Fri 8am–6pm EST</div></div>
              </div>
            </div>
          </div>

          {/* Locations + Map */}
          {locations.length > 0 && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#334155", marginBottom: 20 }}>Our Locations</h2>
              {locations.map(loc => (
                <div key={loc.id} style={{ marginBottom: 20 }}>
                  <div style={{ color: "#334155", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{loc.name}</div>
                  <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
                    {loc.address_line1}{loc.address_line2 ? `, ${loc.address_line2}` : ""}<br />
                    {[loc.city, loc.state_province, loc.postal_code].filter(Boolean).join(", ")}{loc.country_name ? ` — ${loc.country_name}` : ""}
                  </div>
                  {loc.contact_phone && <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>📞 {loc.contact_phone}</div>}
                  <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <iframe
                      title={`Map — ${loc.name}`}
                      width="100%"
                      height="220"
                      style={{ border: 0, display: "block" }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent([loc.address_line1, loc.city, loc.state_province, loc.country_name].filter(Boolean).join(", "))}&t=k&output=embed`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
