import { useState } from "react";
import { Country, City } from "country-state-city";

export default function ProfileEditView({ user, profile, onSaved }) {
  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    country_code: profile?.country_code || "",
    country_name: profile?.country_name || "",
    city: profile?.city || "",
    phone: profile?.phone || "",
    date_of_birth: profile?.date_of_birth ? profile.date_of_birth.split("T")[0] : "",
    education: profile?.education || "",
    goals: profile?.goals || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
      setError("First name, last name, country and city are required.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
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
          date_of_birth: form.date_of_birth || null,
          education: form.education || null,
          goals: form.goals || null,
        }),
      });
      const updated = await res.json();
      onSaved(updated);
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", marginBottom: 8 }}>My Profile</h2>
      <p style={{ color: "#64748b", marginBottom: 36 }}>Update your contact details and learning goals.</p>

      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
        <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Personal Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>First Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Country <span style={{ color: "#ef4444" }}>*</span></label>
            <select value={form.country_code} onChange={handleCountry} style={inputStyle}>
              <option value="">Select country...</option>
              {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>City <span style={{ color: "#ef4444" }}>*</span></label>
            {cities.length > 0 ? (
              <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle}>
                <option value="">Select city...</option>
                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            ) : (
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} placeholder="Enter your city" />
            )}
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} placeholder="+1 234 567 8900" type="tel" />
          </div>
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} style={inputStyle} type="date" />
          </div>
        </div>

        <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>Academic Background</h3>
        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={labelStyle}>Highest Education Level</label>
            <select value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} style={inputStyle}>
              <option value="">Select...</option>
              {["High School Diploma / GED", "Some College", "Associate Degree", "Bachelor's Degree", "Master's or Higher", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Career Goals</label>
            <textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} style={{ ...inputStyle, height: 120, resize: "vertical" }} placeholder="Tell us about your career goals in IT..." />
          </div>
        </div>

        {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 16 }}>{error}</p>}
        {saved && <p style={{ color: "#22c55e", fontSize: 13, marginTop: 16 }}>Profile saved successfully.</p>}

        <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleSubmit} disabled={saving} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 32px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
