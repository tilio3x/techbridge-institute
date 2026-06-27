import { useState } from "react";
import { Country, City } from "country-state-city";

export default function ProfileSetupView({ user, onSaved }) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", country_code: "", country_name: "", city: "", phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const countries = Country.getAllCountries();
  const cities = form.country_code ? City.getCitiesOfCountry(form.country_code) : [];

  const inputStyle = {
    background: "#f1f5f9", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "12px 16px", color: "#1e293b", fontSize: 15,
    width: "100%", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" };

  const handleCountry = (e) => {
    const code = e.target.value;
    const name = countries.find(c => c.isoCode === code)?.name || "";
    setForm(f => ({ ...f, country_code: code, country_name: name, city: "" }));
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.country_code || !form.city) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entra_oid: user.localAccountId,
          first_name: form.first_name,
          last_name: form.last_name,
          email: user.username,
          country_code: form.country_code,
          country_name: form.country_name,
          city: form.city,
          phone: form.phone || null,
        }),
      });
      const saved = await res.json();
      onSaved(saved);
    } catch {
      setError("Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 40, maxWidth: 560, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", margin: "0 0 8px" }}>Complete Your Profile</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Before you continue, please tell us a little about yourself.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={labelStyle}>First Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} placeholder="First name" />
          </div>
          <div>
            <label style={labelStyle}>Last Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} style={inputStyle} placeholder="Last name" />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Country <span style={{ color: "#ef4444" }}>*</span></label>
            <select value={form.country_code} onChange={handleCountry} style={inputStyle}>
              <option value="">Select country...</option>
              {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>City <span style={{ color: "#ef4444" }}>*</span></label>
            {cities.length > 0 ? (
              <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle}>
                <option value="">Select city...</option>
                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            ) : (
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} placeholder={form.country_code ? "Enter your city" : "Select a country first"} disabled={!form.country_code} />
            )}
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Phone Number</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} placeholder="+1 234 567 8900" type="tel" />
          </div>
        </div>

        {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 16, textAlign: "center" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={saving} style={{ marginTop: 28, width: "100%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Continue →"}
        </button>
      </div>
    </div>
  );
}
