import { useState } from "react";

export default function RegisterView({ enrolledCourses, onEnroll, courses }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", dob: "", education: "", goals: "", selectedCourses: [] });
  const [submitted, setSubmitted] = useState(false);

  const courseById = (id) => courses.find(c => c.id === id);

  const toggle = (id) => {
    setForm(f => ({
      ...f,
      selectedCourses: f.selectedCourses.includes(id)
        ? f.selectedCourses.filter(x => x !== id)
        : [...f.selectedCourses, id]
    }));
  };

  const submit = () => {
    form.selectedCourses.forEach(id => onEnroll(courseById(id)));
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ padding: "80px 24px", textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
      <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1e293b", fontFamily: "Inter, system-ui, sans-serif", marginBottom: 16 }}>Registration Complete!</h2>
      <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
        Welcome, <strong style={{ color: "#1e293b" }}>{form.firstName}</strong>! Your application has been submitted.
        You'll receive a confirmation email shortly with your <strong style={{ color: "#3b82f6" }}>Microsoft 365 account credentials</strong> ({form.firstName.toLowerCase()}.{form.lastName.toLowerCase()}@trainee.edu).
      </p>
      <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 16, padding: 24, textAlign: "left" }}>
        <h3 style={{ color: "#3b82f6", fontWeight: 700, marginBottom: 16 }}>📋 Next Steps</h3>
        {["Check email for M365 account setup instructions", "Access Moodle LMS with your student credentials", "Join your course Teams channels", "Review your course schedule and first assignment", "Set up your OneNote class notebook"].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, color: "#94a3b8", fontSize: 14 }}>
            <span style={{ color: "#22c55e", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span> {s}
          </div>
        ))}
      </div>
    </div>
  );

  const inputStyle = {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#1e293b",
    fontSize: 15,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = { color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" };

  return (
    <div style={{ padding: "40px 24px", maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1e293b", marginBottom: 8, fontFamily: "Inter, system-ui, sans-serif" }}>Student Registration</h2>
      <p style={{ color: "#64748b", marginBottom: 36 }}>Complete all steps to enroll. A Microsoft 365 account will be created for you.</p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: 40 }}>
        {["Personal Info", "Select Courses", "Review & Submit"].map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: step > i + 1 ? "#22c55e" : step === i + 1 ? "#3b82f6" : "#e2e8f0",
                color: step >= i + 1 ? "#fff" : "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: step === i + 1 ? "#f1f5f9" : "#64748b" }}>{s}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? "#22c55e" : "#e2e8f0", margin: "0 12px" }} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[["firstName", "First Name", "text"], ["lastName", "Last Name", "text"], ["email", "Email Address", "email"], ["phone", "Phone Number", "tel"], ["dob", "Date of Birth", "date"]].map(([key, label, type]) => (
            <div key={key} style={{ gridColumn: key === "email" || key === "dob" ? "span 1" : undefined }}>
              <label style={labelStyle}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} placeholder={label} />
            </div>
          ))}
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Highest Education Level</label>
            <select value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} style={{ ...inputStyle }}>
              <option value="">Select...</option>
              {["High School Diploma / GED", "Some College", "Associate Degree", "Bachelor's Degree", "Master's or Higher", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={labelStyle}>Career Goals</label>
            <textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} style={{ ...inputStyle, height: 100, resize: "vertical" }} placeholder="Tell us about your career goals in IT..." />
          </div>
          <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setStep(2)} disabled={!form.firstName || !form.email} style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: (!form.firstName || !form.email) ? 0.5 : 1 }}>
              Next: Select Courses →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <p style={{ color: "#94a3b8", marginBottom: 24 }}>Select one or more courses to enroll in this cohort.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12, marginBottom: 32 }}>
            {courses.map(course => {
              const sel = form.selectedCourses.includes(course.id);
              return (
                <div key={course.id} onClick={() => toggle(course.id)} style={{
                  border: sel ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                  borderRadius: 12, padding: 16, cursor: "pointer",
                  background: sel ? "rgba(59,130,246,0.08)" : "#f8fafc",
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: sel ? "none" : "2px solid #475569", background: sel ? "#3b82f6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    {sel && <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: course.vendorColor, fontWeight: 700, marginBottom: 2 }}>{course.vendorName} · {course.code}</div>
                    <div style={{ color: "#1e293b", fontWeight: 600, fontSize: 14 }}>{course.title}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{course.duration} · {course.delivery} · ${course.price.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(1)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 24px", fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <button onClick={() => setStep(3)} disabled={form.selectedCourses.length === 0} style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: form.selectedCourses.length === 0 ? 0.5 : 1 }}>
              Review ({form.selectedCourses.length} selected) →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 28, marginBottom: 24 }}>
            <h3 style={{ color: "#1e293b", fontWeight: 700, marginBottom: 20 }}>Registration Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[["Full Name", `${form.firstName} ${form.lastName}`], ["Email", form.email], ["Phone", form.phone || "—"], ["Education", form.education || "—"]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                  <div style={{ color: "#334155", fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Enrolled Courses</div>
              {form.selectedCourses.map(id => {
                const c = courseById(id);
                if (!c) return null;
                return (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, color: "#334155", fontSize: 14 }}>
                    <span><span style={{ color: c.vendorColor, fontWeight: 700 }}>{c.vendorName}</span> · {c.title}</span>
                    <span style={{ color: "#1e293b", fontWeight: 700 }}>${c.price.toLocaleString()}</span>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}>
                <span style={{ color: "#1e293b" }}>Total</span>
                <span style={{ color: "#3b82f6" }}>${form.selectedCourses.reduce((s, id) => s + (courseById(id)?.price || 0), 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14, color: "#94a3b8" }}>
            💡 A <strong style={{ color: "#3b82f6" }}>Microsoft 365 account</strong> will be automatically provisioned for you as <code style={{ color: "#818cf8" }}>{form.firstName.toLowerCase() || "firstname"}.{form.lastName.toLowerCase() || "lastname"}@trainee.edu</code> — you'll receive setup instructions via email.
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 24px", fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <button onClick={submit} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 36px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              ✓ Complete Registration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
