import { useState } from "react";
import Chip from "../components/Chip";
import { levelColor } from "../utils/constants";

export default function EducatorPortalView({ staffAccount, instructors, courses, enrollments, schedule, onInstructorUpdate }) {
  const [tab, setTab] = useState("courses");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const instructor = instructors.find(i => i.entra_oid === staffAccount?.localAccountId) ?? null;

  const [profileForm, setProfileForm] = useState(() => instructor ? {
    title: instructor.title || "",
    phone: instructor.phone || "",
    linkedin_url: instructor.linkedin_url || "",
    bio: instructor.bio || "",
    specializations: (instructor.specializations || []).join(", "),
    certifications: (instructor.certifications || []).join(", "),
    available_days: instructor.available_days || [],
    available_hours: instructor.available_hours || "",
    availability_note: instructor.availability_note || "",
  } : {
    title: "", phone: "", linkedin_url: "", bio: "",
    specializations: "", certifications: "",
    available_days: [], available_hours: "", availability_note: "",
  });

  const myCourses = instructor
    ? courses.filter(c => c.instructorId === instructor.id)
    : [];

  const myCourseIds = new Set(myCourses.map(c => c.id));

  const myEnrollments = enrollments.filter(e => myCourseIds.has(e.course_id));

  const uniqueStudentIds = [...new Set(myEnrollments.map(e => e.student_id))];

  const mySchedule = schedule.filter(s => myCourseIds.has(s.courseId));

  const portalTabs = ["courses", "students", "schedule", "profile"];

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const saveProfile = async () => {
    if (!instructor) return;
    setProfileSaving(true);
    try {
      const payload = {
        ...instructor,
        title: profileForm.title,
        phone: profileForm.phone,
        linkedin_url: profileForm.linkedin_url,
        bio: profileForm.bio,
        specializations: profileForm.specializations.split(",").map(s => s.trim()).filter(Boolean),
        certifications: profileForm.certifications.split(",").map(s => s.trim()).filter(Boolean),
        available_days: profileForm.available_days,
        available_hours: profileForm.available_hours,
        availability_note: profileForm.availability_note,
      };
      const res = await fetch(`/api/instructors/${instructor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      onInstructorUpdate(saved);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } finally {
      setProfileSaving(false);
    }
  };

  const cell = (content, opts = {}) => (
    <td style={{ padding: "12px 16px", color: "#cbd5e1", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)", ...opts }}>{content}</td>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      {/* Header card */}
      <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: 28, marginBottom: 32, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>👨‍🏫</div>
        <div style={{ flex: 1 }}>
          {instructor ? (
            <>
              <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 22 }}>{instructor.first_name} {instructor.last_name}</div>
              <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>{instructor.title || "Instructor"}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ color: "#6366f1", fontSize: 12 }}>📚 {myCourses.length} course{myCourses.length !== 1 ? "s" : ""}</span>
                <span style={{ color: "#0ea5e9", fontSize: 12 }}>👥 {uniqueStudentIds.length} student{uniqueStudentIds.length !== 1 ? "s" : ""}</span>
                {instructor.email && <span style={{ color: "#64748b", fontSize: 12 }}>✉️ {instructor.email}</span>}
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20 }}>{staffAccount?.name ?? "Educator"}</div>
              <div style={{ color: "#f59e0b", fontSize: 13, marginTop: 6 }}>
                Your instructor record has not been linked yet. Contact an administrator to link your account.
              </div>
            </>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
            {instructor?.status ?? "Active"}
          </div>
          {instructor?.employment_type && (
            <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{instructor.employment_type}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
        {portalTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "10px 20px", fontWeight: 700, fontSize: 13, textTransform: "capitalize",
            color: tab === t ? "#6366f1" : "#64748b",
            borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent",
            marginBottom: -1,
          }}>
            {t === "courses" && `Courses (${myCourses.length})`}
            {t === "students" && `Students (${uniqueStudentIds.length})`}
            {t === "schedule" && `Schedule (${mySchedule.length})`}
            {t === "profile" && "My Profile"}
          </button>
        ))}
      </div>

      {/* Courses tab */}
      {tab === "courses" && (
        myCourses.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>No courses assigned yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {myCourses.map(c => {
              const enrolled = myEnrollments.filter(e => e.course_id === c.id).length;
              return (
                <div key={c.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.vendorColor }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ color: c.vendorColor, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{c.vendorName}</span>
                    <Chip text={c.level} color={levelColor[c.level]} />
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", marginBottom: 2 }}>{c.code}</div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{c.title}</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#94a3b8" }}>
                    <span>📅 {c.nextStart ? new Date(c.nextStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}</span>
                    <span>👥 {enrolled} / {c.seats}</span>
                  </div>
                  {c.locationName && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>📍 {c.locationName}</div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Students tab */}
      {tab === "students" && (
        myEnrollments.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>No students enrolled in your courses yet.</div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  {["Student", "Email", "Course", "Progress"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myEnrollments.map((e, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    {cell(e.student_name || "—")}
                    {cell(e.student_email || "—")}
                    {cell(myCourses.find(c => c.id === e.course_id)?.title ?? "—")}
                    {cell(e.progress != null ? `${e.progress}%` : "—")}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Schedule tab */}
      {tab === "schedule" && (
        mySchedule.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>No schedule entries for your courses yet.</div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  {["Course", "Day", "Time", "Room", "Type"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mySchedule.map((s, i) => {
                  const course = courses.find(c => c.id === s.courseId);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      {cell(course?.title ?? "—")}
                      {cell(s.day)}
                      {cell(s.time)}
                      {cell(s.room || "—")}
                      {cell(s.type)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Profile tab */}
      {tab === "profile" && (
        !instructor ? (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>No instructor record linked to your account.</div>
        ) : (
          <div style={{ maxWidth: 700 }}>
            {(() => {
              const inp = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" };
              const lbl = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };
              const set = k => e => setProfileForm(f => ({ ...f, [k]: e.target.value }));
              const toggleDay = day => setProfileForm(f => ({
                ...f,
                available_days: f.available_days.includes(day)
                  ? f.available_days.filter(d => d !== day)
                  : [...f.available_days, day],
              }));
              return (
                <div style={{ display: "grid", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div><label style={lbl}>Title / Role</label><input value={profileForm.title} onChange={set("title")} style={inp} placeholder="e.g. Senior Instructor" /></div>
                    <div><label style={lbl}>Phone</label><input value={profileForm.phone} onChange={set("phone")} style={inp} placeholder="+223 ..." /></div>
                    <div style={{ gridColumn: "span 2" }}><label style={lbl}>LinkedIn URL</label><input value={profileForm.linkedin_url} onChange={set("linkedin_url")} style={inp} placeholder="https://linkedin.com/in/..." /></div>
                    <div style={{ gridColumn: "span 2" }}><label style={lbl}>Bio</label><textarea value={profileForm.bio} onChange={set("bio")} style={{ ...inp, height: 100, resize: "vertical" }} placeholder="Short public-facing biography" /></div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                    <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Expertise</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div><label style={lbl}>Specializations <span style={{ color: "#475569", fontWeight: 400 }}>(comma-separated)</span></label><input value={profileForm.specializations} onChange={set("specializations")} style={inp} placeholder="e.g. Networking, Cloud, Security" /></div>
                      <div><label style={lbl}>Certifications <span style={{ color: "#475569", fontWeight: 400 }}>(comma-separated)</span></label><input value={profileForm.certifications} onChange={set("certifications")} style={inp} placeholder="e.g. CCNA, AWS SAA" /></div>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                    <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Availability</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                      {DAYS.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: profileForm.available_days.includes(day) ? "#6366f1" : "rgba(255,255,255,0.1)", background: profileForm.available_days.includes(day) ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)", color: profileForm.available_days.includes(day) ? "#818cf8" : "#64748b" }}>
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div><label style={lbl}>Available Hours</label><input value={profileForm.available_hours} onChange={set("available_hours")} style={inp} placeholder="e.g. 09:00-17:00" /></div>
                      <div><label style={lbl}>Availability Note</label><input value={profileForm.availability_note} onChange={set("availability_note")} style={inp} placeholder="e.g. Evenings only in July" /></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 8 }}>
                    <button onClick={saveProfile} disabled={profileSaving} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: profileSaving ? 0.7 : 1 }}>
                      {profileSaving ? "Saving..." : "Save Profile"}
                    </button>
                    {profileSaved && <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>✓ Profile updated</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        )
      )}
    </div>
  );
}
