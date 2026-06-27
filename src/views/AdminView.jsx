import { useState, Fragment } from "react";
import { Country, City } from "country-state-city";
import Chip from "../components/Chip";
import { EMPTY_COURSE, EMPTY_INSTRUCTOR, EMPTY_LOCATION, TIMEZONES, DURATION_UNITS, COURSE_TAGS, levelColor } from "../utils/constants";
import { normalizeSchedule } from "../utils/normalizers";

const EMPTY_SCHEDULE = { course_id: "", day: "", time_start: "", time_end: "", instructor: "", room: "", type: "Online" };

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function parse24(str) {
  const match = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  let h = parseInt(match[1]);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${match[2]}`;
}

export default function AdminView({ courses, vendors, schedule, students, profiles, instructors, deliveryLocations, enrollments, onDeleteProfile, onCourseAdd, onCourseUpdate, onCourseDelete, onLocationAdd, onLocationUpdate, onLocationDelete, onInstructorAdd, onInstructorUpdate, onInstructorDeactivate, onEnrollmentAdd, onEnrollmentRemove, onScheduleAdd, onScheduleUpdate, onScheduleDelete }) {
  const [tab, setTab] = useState("overview");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(null);
  const [courseModal, setCourseModal] = useState(null); // null | { mode: "new"|"edit", data: {} }
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [courseSaving, setCourseSaving] = useState(false);
  const [locationModal, setLocationModal] = useState(null); // null | { mode: "new"|"edit", id? }
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION);
  const [locationSaving, setLocationSaving] = useState(false);
  const [confirmDeleteLocation, setConfirmDeleteLocation] = useState(null);
  const [instructorModal, setInstructorModal] = useState(null);
  const [instructorForm, setInstructorForm] = useState(EMPTY_INSTRUCTOR);
  const [instructorSaving, setInstructorSaving] = useState(false);
  const [confirmDeactivateInstructor, setConfirmDeactivateInstructor] = useState(null);
  const [instructorCreated, setInstructorCreated] = useState(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ student_id: "", course_id: "" });
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [confirmUnenroll, setConfirmUnenroll] = useState(null);
  const [enrollFilter, setEnrollFilter] = useState("");
  const [studentDetail, setStudentDetail] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null); // null | { mode: "new"|"edit", data: {} }
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // null | { instructor }
  const [assignCourseIds, setAssignCourseIds] = useState(new Set());
  const [assignSaving, setAssignSaving] = useState(false);
  const [courseSort, setCourseSort] = useState({ key: null, dir: "asc" });
  const [courseGroup, setCourseGroup] = useState("none");
  const [courseSearch, setCourseSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [enrollSearch, setEnrollSearch] = useState("");
  const [instructorSearch, setInstructorSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const courseById = (id) => courses.find(c => c.id === id);

  const courseSortColumns = [
    { key: "title", label: "Course" },
    { key: "vendorName", label: "Vendor" },
    { key: "instructorName", label: "Instructor" },
    { key: "level", label: "Level" },
    { key: "delivery", label: "Delivery" },
    { key: "enrolled", label: "Enrollment" },
    { key: "nextStart", label: "Start Date" },
  ];

  const toggleSort = (key) => {
    setCourseSort(prev => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  };

  const filteredCourses = (() => {
    if (!courseSearch.trim()) return courses;
    const q = courseSearch.toLowerCase();
    return courses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.vendorName || "").toLowerCase().includes(q) ||
      (c.instructorName || "").toLowerCase().includes(q) ||
      c.level.toLowerCase().includes(q) ||
      c.delivery.toLowerCase().includes(q) ||
      (c.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (c.description || "").toLowerCase().includes(q)
    );
  })();

  const sortedCourses = (() => {
    const list = [...filteredCourses];
    if (courseSort.key) {
      const dir = courseSort.dir === "asc" ? 1 : -1;
      list.sort((a, b) => {
        let va = a[courseSort.key], vb = b[courseSort.key];
        if (courseSort.key === "enrolled") return (va - vb) * dir;
        if (courseSort.key === "nextStart") return ((new Date(va || 0)) - (new Date(vb || 0))) * dir;
        va = (va || "").toString().toLowerCase();
        vb = (vb || "").toString().toLowerCase();
        return va < vb ? -dir : va > vb ? dir : 0;
      });
    }
    return list;
  })();

  const groupedCourses = (() => {
    if (courseGroup === "none") return [{ label: null, items: sortedCourses }];
    const key = courseGroup === "vendor" ? "vendorName" : "instructorName";
    const groups = {};
    for (const c of sortedCourses) {
      const g = c[key] || "Unassigned";
      (groups[g] ||= []).push(c);
    }
    return Object.keys(groups).sort().map(label => ({ label, items: groups[label] }));
  })();

  const filteredStudents = (() => {
    if (!studentSearch.trim()) return profiles;
    const q = studentSearch.toLowerCase();
    return profiles.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      (p.country_name || "").toLowerCase().includes(q) ||
      (p.education || "").toLowerCase().includes(q)
    );
  })();

  const filteredInstructors = (() => {
    if (!instructorSearch.trim()) return instructors;
    const q = instructorSearch.toLowerCase();
    return instructors.filter(ins =>
      `${ins.first_name} ${ins.last_name}`.toLowerCase().includes(q) ||
      (ins.email || "").toLowerCase().includes(q) ||
      (ins.title || "").toLowerCase().includes(q) ||
      (ins.status || "").toLowerCase().includes(q) ||
      (ins.employment_type || "").toLowerCase().includes(q) ||
      (ins.specializations || []).some(s => s.toLowerCase().includes(q)) ||
      (ins.certifications || []).some(c => c.toLowerCase().includes(q))
    );
  })();

  const filteredLocations = (() => {
    if (!locationSearch.trim()) return deliveryLocations;
    const q = locationSearch.toLowerCase();
    return deliveryLocations.filter(loc =>
      (loc.name || "").toLowerCase().includes(q) ||
      (loc.type || "").toLowerCase().includes(q) ||
      (loc.city || "").toLowerCase().includes(q) ||
      (loc.country_name || "").toLowerCase().includes(q) ||
      (loc.building || "").toLowerCase().includes(q) ||
      (loc.platform || "").toLowerCase().includes(q) ||
      (loc.contact_name || "").toLowerCase().includes(q)
    );
  })();

  const filteredSchedule = (() => {
    if (!scheduleSearch.trim()) return schedule;
    const q = scheduleSearch.toLowerCase();
    return schedule.filter(s => {
      const c = courseById(s.courseId);
      return (c?.title || "").toLowerCase().includes(q) ||
        (c?.code || "").toLowerCase().includes(q) ||
        (c?.vendorName || "").toLowerCase().includes(q) ||
        (s.day || "").toLowerCase().includes(q) ||
        (s.instructor || "").toLowerCase().includes(q) ||
        (s.room || "").toLowerCase().includes(q) ||
        (s.type || "").toLowerCase().includes(q);
    });
  })();

  const SearchBar = ({ value, onChange, placeholder, total, filtered }) => (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px 10px 36px", color: "#1e293b", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 14, pointerEvents: "none" }}>&#x1F50D;</span>
      {value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14 }}>✕</button>}
      {value && <span style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 11 }}>{filtered} of {total}</span>}
    </div>
  );

  const openNew = () => { setCourseForm(EMPTY_COURSE); setCourseModal({ mode: "new" }); };
  const parseDuration = (str) => {
    if (!str) return { duration_value: "", duration_unit: "Week" };
    const match = str.match(/^(\d+)\s*(\w+)/);
    if (!match) return { duration_value: "", duration_unit: "Week" };
    const unit = DURATION_UNITS.find(u => match[2].toLowerCase().startsWith(u.toLowerCase())) || "Week";
    return { duration_value: match[1], duration_unit: unit };
  };

  const openEdit = (c) => {
    const { duration_value, duration_unit } = parseDuration(c.duration);
    setCourseForm({
      vendor_id: c.vendor, code: c.code, title: c.title, level: c.level,
      duration_value, duration_unit, price: c.price, seats: c.seats, delivery: c.delivery,
      next_start: c.nextStart ? c.nextStart.split("T")[0] : "", description: c.description, badge: c.badge || "",
      tags: c.tags || [],
      instructor_id: c.instructorId || "",
      delivery_location_id: c.locationId || "",
    });
    setCourseModal({ mode: "edit", id: c.id });
  };

  const saveCourse = async () => {
    setCourseSaving(true);
    try {
      const isEdit = courseModal.mode === "edit";
      const url = isEdit ? `/api/courses/${courseModal.id}` : "/api/courses";
      const method = isEdit ? "PUT" : "POST";
      const dv = Number(courseForm.duration_value);
      const du = courseForm.duration_unit;
      const duration = dv ? `${dv} ${du.toLowerCase()}${dv !== 1 ? "s" : ""}` : "";
      const { duration_value, duration_unit, ...rest } = courseForm;
      const body = {
        ...rest,
        duration,
        price: Number(courseForm.price),
        seats: Number(courseForm.seats),
        instructor_id: courseForm.instructor_id || null,
        delivery_location_id: courseForm.delivery_location_id || null,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const saved = await res.json();
      isEdit ? onCourseUpdate(saved) : onCourseAdd(saved);
      setCourseModal(null);
    } catch (err) {
      alert(err.message || "Failed to save course");
    } finally {
      setCourseSaving(false);
    }
  };

  const deleteCourse = async (course) => {
    await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    onCourseDelete(course.id);
    setConfirmDeleteCourse(null);
  };

  const handleDelete = async (profile) => {
    await fetch(`/api/profile/${profile.entra_oid}`, { method: "DELETE" });
    onDeleteProfile(profile.entra_oid);
    setConfirmDelete(null);
  };

  const openNewLocation = () => { setLocationForm(EMPTY_LOCATION); setLocationModal({ mode: "new" }); };
  const openEditLocation = (loc) => {
    setLocationForm({
      name: loc.name || "", type: loc.type || "Physical",
      address_line1: loc.address_line1 || "", address_line2: loc.address_line2 || "",
      city: loc.city || "", state_province: loc.state_province || "", postal_code: loc.postal_code || "",
      country_code: loc.country_code || "", country_name: loc.country_name || "",
      room_number: loc.room_number || "", building: loc.building || "",
      floor: loc.floor || "", capacity: loc.capacity || "",
      platform: loc.platform || "", timezone: loc.timezone || "UTC",
      contact_name: loc.contact_name || "", contact_email: loc.contact_email || "",
      contact_phone: loc.contact_phone || "", notes: loc.notes || "",
    });
    setLocationModal({ mode: "edit", id: loc.id });
  };

  const saveLocation = async () => {
    setLocationSaving(true);
    const isEdit = locationModal.mode === "edit";
    const url = isEdit ? `/api/delivery-locations/${locationModal.id}` : "/api/delivery-locations";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...locationForm, capacity: locationForm.capacity ? Number(locationForm.capacity) : null, is_active: true }) });
    const saved = await res.json();
    isEdit ? onLocationUpdate(saved) : onLocationAdd(saved);
    setLocationModal(null);
    setLocationSaving(false);
  };

  const deleteLocation = async (loc) => {
    await fetch(`/api/delivery-locations/${loc.id}`, { method: "DELETE" });
    onLocationDelete(loc.id);
    setConfirmDeleteLocation(null);
  };

  const openNewInstructor = () => { setInstructorForm(EMPTY_INSTRUCTOR); setInstructorModal({ mode: "new" }); };
  const openEditInstructor = (i) => {
    setInstructorForm({
      first_name: i.first_name || "", last_name: i.last_name || "", email: i.email || "",
      phone: i.phone || "", title: i.title || "", bio: i.bio || "",
      specializations: (i.specializations || []).join(", "),
      certifications: (i.certifications || []).join(", "),
      employment_type: i.employment_type || "Full-time", status: i.status || "Active",
      hire_date: i.hire_date ? i.hire_date.split("T")[0] : "",
      linkedin_url: i.linkedin_url || "",
      available_days: i.available_days || [],
      available_hours: i.available_hours || "", availability_note: i.availability_note || "",
    });
    setInstructorModal({ mode: "edit", id: i.id });
  };

  const saveInstructor = async () => {
    setInstructorSaving(true);
    const isEdit = instructorModal.mode === "edit";
    const url = isEdit ? `/api/instructors/${instructorModal.id}` : "/api/instructors";
    const method = isEdit ? "PUT" : "POST";
    const payload = {
      ...instructorForm,
      specializations: instructorForm.specializations.split(",").map(s => s.trim()).filter(Boolean),
      certifications: instructorForm.certifications.split(",").map(s => s.trim()).filter(Boolean),
      hire_date: instructorForm.hire_date || null,
    };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const saved = await res.json();
    isEdit ? onInstructorUpdate(saved) : onInstructorAdd(saved);
    setInstructorModal(null);
    setInstructorSaving(false);
    if (!isEdit || saved.upn || saved.entraWarning) {
      setInstructorCreated({
        name: `${saved.first_name} ${saved.last_name}`,
        upn: saved.upn,
        tempPassword: saved.tempPassword,
        warning: saved.entraWarning,
      });
    }
  };

  const deactivateInstructor = async (instructor) => {
    await fetch(`/api/instructors/${instructor.id}`, { method: "DELETE" });
    onInstructorDeactivate(instructor.id);
    setConfirmDeactivateInstructor(null);
  };

  const saveEnrollment = async () => {
    setEnrollSaving(true);
    const res = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: Number(enrollForm.student_id), course_id: Number(enrollForm.course_id) }) });
    const data = await res.json();
    if (data.inserted) {
      const course = courses.find(c => c.id === Number(enrollForm.course_id));
      const student = students.find(s => s.id === Number(enrollForm.student_id));
      onEnrollmentAdd({ student_id: Number(enrollForm.student_id), course_id: Number(enrollForm.course_id), student_name: student?.name, student_email: student?.email, code: course?.code, title: course?.title, delivery: course?.delivery, vendor_name: course?.vendorName, vendor_color: course?.vendorColor });
    }
    setEnrollModal(false);
    setEnrollForm({ student_id: "", course_id: "" });
    setEnrollSaving(false);
  };

  const unenroll = async (row) => {
    await fetch("/api/enrollments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: row.student_id, course_id: row.course_id }) });
    onEnrollmentRemove(row.student_id, row.course_id);
    setConfirmUnenroll(null);
  };

  const adminTabs = ["overview", "students", "courses", "enrollments", "instructors", "locations", "schedule", "integrations"];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0f172a", borderRight: "1px solid rgba(255,255,255,0.08)", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }}>
          <div style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Admin Console</div>
        </div>
        {adminTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            width: "100%", textAlign: "left", padding: "12px 20px",
            background: tab === t ? "rgba(14,165,233,0.12)" : "transparent",
            color: tab === t ? "#38bdf8" : "#94a3b8",
            border: "none", borderLeft: tab === t ? "3px solid #0ea5e9" : "3px solid transparent",
            fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "40px 32px", overflowY: "auto", background: "#f0f4f8" }}>
        {tab === "overview" && (() => {
          const activeInstructors = instructors.filter(i => i.status === "Active").length;
          const totalEnrollments = enrollments.length;
          const studentsEnrolled = new Set(enrollments.map(e => e.student_id)).size;
          const avgFill = courses.length
            ? Math.round(courses.reduce((sum, c) => sum + (c.seats > 0 ? (c.enrolled / c.seats) * 100 : 0), 0) / courses.length)
            : 0;
          const now = new Date();
          const soon = courses.filter(c => {
            if (!c.nextStart) return false;
            const d = new Date(c.nextStart);
            return d >= now && d <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          });
          const recentProfiles = [...profiles].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

          const stats = [
            { label: "Registered Students", value: profiles.length, change: `${studentsEnrolled} enrolled in at least 1 course`, color: "#0ea5e9" },
            { label: "Active Courses", value: courses.length, change: soon.length > 0 ? `${soon.length} starting within 30 days` : "No upcoming start dates", color: "#6366f1" },
            { label: "Total Enrollments", value: totalEnrollments, change: `Across ${courses.length} course${courses.length !== 1 ? "s" : ""}`, color: "#22c55e" },
            { label: "Active Instructors", value: activeInstructors, change: `${instructors.length - activeInstructors} inactive / on leave`, color: "#f59e0b" },
            { label: "Entra Accounts", value: profiles.length, change: "All synced ✓", color: "#0ea5e9" },
            { label: "Avg Seats Filled", value: `${avgFill}%`, change: courses.length ? `across ${courses.length} courses` : "No courses yet", color: avgFill >= 75 ? "#22c55e" : avgFill >= 40 ? "#f59e0b" : "#ef4444" },
          ];

          return (
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", marginBottom: 32 }}>Platform Overview</h2>

              {/* Stat tiles */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 40 }}>
                {stats.map(stat => (
                  <div key={stat.label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: stat.color, fontFamily: "Georgia, serif" }}>{stat.value}</div>
                    <div style={{ color: "#334155", fontWeight: 700, fontSize: 13, margin: "4px 0" }}>{stat.label}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{stat.change}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
                {/* Enrollment breakdown by course */}
                <div>
                  <h3 style={{ color: "#334155", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Enrollment by Course</h3>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                    {courses.length === 0 && <div style={{ color: "#64748b", fontSize: 13, padding: 20, textAlign: "center" }}>No courses yet.</div>}
                    {courses.map((c, i) => {
                      const pct = c.seats > 0 ? Math.round((c.enrolled / c.seats) * 100) : 0;
                      return (
                        <div key={c.id} style={{ padding: "12px 16px", borderBottom: i < courses.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <div>
                              <span style={{ color: "#334155", fontWeight: 600, fontSize: 13 }}>{c.title}</span>
                              <span style={{ color: c.vendorColor, fontSize: 11, fontWeight: 700, marginLeft: 8 }}>{c.vendorName}</span>
                            </div>
                            <span style={{ color: "#94a3b8", fontSize: 12 }}>{c.enrolled}/{c.seats}</span>
                          </div>
                          <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 75 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#0ea5e9", borderRadius: 2, transition: "width 0.4s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Courses starting soon */}
                <div>
                  <h3 style={{ color: "#334155", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Starting Within 30 Days</h3>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                    {soon.length === 0 && <div style={{ color: "#64748b", fontSize: 13, padding: 20, textAlign: "center" }}>No courses starting soon.</div>}
                    {soon.sort((a, b) => new Date(a.nextStart) - new Date(b.nextStart)).map((c, i) => (
                      <div key={c.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", borderBottom: i < soon.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none" }}>
                        <div style={{ width: 40, textAlign: "center", flexShrink: 0 }}>
                          <div style={{ color: c.vendorColor, fontWeight: 900, fontSize: 16 }}>{new Date(c.nextStart).getDate()}</div>
                          <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>{new Date(c.nextStart).toLocaleString("en-US", { month: "short" })}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#334155", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                          <div style={{ color: "#64748b", fontSize: 11 }}>{c.enrolled}/{c.seats} enrolled · {c.delivery}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent registrations */}
              <h3 style={{ color: "#334155", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Recent Registrations</h3>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                {recentProfiles.length === 0 && <div style={{ color: "#64748b", fontSize: 13, padding: 20, textAlign: "center" }}>No students registered yet.</div>}
                {recentProfiles.map((p, i) => (
                  <div key={p.entra_oid} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: i < recentProfiles.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#1e293b", fontWeight: 600, fontSize: 14 }}>{p.first_name} {p.last_name}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{p.city}, {p.country_name}</div>
                    </div>
                    <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>
                      {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {tab === "students" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Registered Students</h2>
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{profiles.length} account{profiles.length !== 1 ? "s" : ""} registered via Entra External ID</p>
              </div>
            </div>
            <SearchBar value={studentSearch} onChange={setStudentSearch} placeholder="Search by name, email, city, country, education..." total={profiles.length} filtered={filteredStudents.length} />
            {filteredStudents.length === 0 ? (
              <div style={{ color: "#64748b", fontSize: 14, padding: 24, textAlign: "center" }}>{studentSearch ? "No students match your search." : "No registered students yet."}</div>
            ) : filteredStudents.map(p => (
              <div key={p.entra_oid} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 16 }}>{p.first_name} {p.last_name}</div>
                        <div style={{ color: "#0ea5e9", fontSize: 13, fontFamily: "monospace" }}>{p.email}</div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                          {p.city}, {p.country_name}
                          {p.education && ` · ${p.education}`}
                          {" · "}Joined {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(p)}
                        style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Confirm delete modal */}
            {confirmDelete && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                <div style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                  <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Delete Student Account?</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                    This will permanently delete <strong style={{ color: "#1e293b" }}>{confirmDelete.first_name} {confirmDelete.last_name}</strong>'s profile from the database and their account from Entra External ID. This cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button onClick={() => handleDelete(confirmDelete)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "courses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", margin: 0 }}>Course Management</h2>
              <button onClick={openNew} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ New Course</button>
            </div>
            <SearchBar value={courseSearch} onChange={setCourseSearch} placeholder="Search by title, code, vendor, instructor, tag..." total={courses.length} filtered={filteredCourses.length} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Group by:</span>
              {["none", "vendor", "instructor"].map(g => (
                <button key={g} onClick={() => setCourseGroup(g)}
                  style={{ padding: "5px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer", border: courseGroup === g ? "1px solid #0ea5e9" : "1px solid #e2e8f0", background: courseGroup === g ? "rgba(14,165,233,0.12)" : "#f8fafc", color: courseGroup === g ? "#38bdf8" : "#94a3b8" }}>
                  {g === "none" ? "None" : g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
              {courseSort.key && (
                <button onClick={() => setCourseSort({ key: null, dir: "asc" })}
                  style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#94a3b8" }}>
                  Clear sort
                </button>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    {courseSortColumns.map(col => (
                      <th key={col.key} onClick={() => toggleSort(col.key)} style={{ padding: "10px 14px", textAlign: "left", color: courseSort.key === col.key ? "#38bdf8" : "#64748b", fontWeight: 700, fontSize: 11, textTransform: "uppercase", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                        {col.label} {courseSort.key === col.key ? (courseSort.dir === "asc" ? "▲" : "▼") : ""}
                      </th>
                    ))}
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedCourses.map(group => (
                    <Fragment key={group.label || "__all"}>
                      {group.label && (
                        <tr><td colSpan={8} style={{ padding: "12px 14px 6px", color: "#334155", fontWeight: 800, fontSize: 13, borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>{group.label} <span style={{ color: "#64748b", fontWeight: 500, fontSize: 11 }}>({group.items.length})</span></td></tr>
                      )}
                      {group.items.map((c) => (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px" }}>
                            <div style={{ color: "#1e293b", fontWeight: 600 }}>{c.title}</div>
                            <div style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>{c.code}</div>
                          </td>
                          <td style={{ padding: "14px" }}><span style={{ color: c.vendorColor, fontWeight: 700 }}>{c.vendorName}</span></td>
                          <td style={{ padding: "14px", color: c.instructorName ? "#e2e8f0" : "#475569", fontSize: 12 }}>{c.instructorName || "—"}</td>
                          <td style={{ padding: "14px" }}><Chip text={c.level} color={levelColor[c.level]} /></td>
                          <td style={{ padding: "14px" }}><Chip text={c.delivery} color="#0ea5e9" /></td>
                          <td style={{ padding: "14px" }}>
                            <div>
                              <span style={{ color: "#22c55e", fontWeight: 700 }}>{c.enrolled}</span>
                              <span style={{ color: "#64748b" }}> / {c.seats}</span>
                            </div>
                            <div style={{ width: 60, height: 3, background: "#e2e8f0", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(c.enrolled / c.seats) * 100}%`, background: "#0ea5e9" }} />
                            </div>
                          </td>
                          <td style={{ padding: "14px", color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>
                            {c.nextStart ? new Date(c.nextStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </td>
                          <td style={{ padding: "14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => openEdit(c)} style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                              <button onClick={() => setConfirmDeleteCourse(c)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Course form modal */}
            {courseModal && (() => {
              const inp = { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#1e293b", fontSize: 13, width: "100%", boxSizing: "border-box" };
              const lbl = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" };
              const set = (k) => (e) => setCourseForm(f => ({ ...f, [k]: e.target.value }));
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, overflowY: "auto" }}>
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 36, width: "100%", maxWidth: 680 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                      <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, margin: 0 }}>{courseModal.mode === "new" ? "New Course" : "Edit Course"}</h3>
                      <button onClick={() => setCourseModal(null)} style={{ background: "rgba(0,0,0,0.03)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={lbl}>Vendor</label>
                        <select value={courseForm.vendor_id} onChange={set("vendor_id")} style={inp}>
                          <option value="">Select vendor...</option>
                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Instructor</label>
                        <select value={courseForm.instructor_id} onChange={set("instructor_id")} style={inp}>
                          <option value="">Unassigned</option>
                          {instructors.filter(i => i.status === "Active").map(i => <option key={i.id} value={i.id}>{i.first_name} {i.last_name}{i.title ? ` — ${i.title}` : ""}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Course Code</label><input value={courseForm.code} onChange={set("code")} style={inp} placeholder="e.g. AZ-900" /></div>
                      <div><label style={lbl}>Badge</label>
                        <select value={courseForm.badge} onChange={set("badge")} style={inp}>
                          {["", "Hot", "New", "Core"].map(b => <option key={b} value={b}>{b || "None"}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Title</label><input value={courseForm.title} onChange={set("title")} style={inp} placeholder="Full course title" /></div>
                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Description</label><textarea value={courseForm.description} onChange={set("description")} style={{ ...inp, height: 80, resize: "vertical" }} placeholder="Short course description" /></div>
                      <div><label style={lbl}>Level</label>
                        <select value={courseForm.level} onChange={set("level")} style={inp}>
                          {["Beginner", "Intermediate", "Advanced"].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Delivery</label>
                        <select value={courseForm.delivery} onChange={set("delivery")} style={inp}>
                          {["Online", "Hybrid", "In-Person"].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Duration</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input type="number" min="1" value={courseForm.duration_value} onChange={set("duration_value")} style={{ ...inp, flex: 1 }} placeholder="0" />
                          <select value={courseForm.duration_unit} onChange={set("duration_unit")} style={{ ...inp, flex: 1 }}>
                            {DURATION_UNITS.map(u => <option key={u} value={u}>{u}{courseForm.duration_value !== "1" ? "s" : ""}</option>)}
                          </select>
                        </div>
                      </div>
                      <div><label style={lbl}>Start Date</label><input type="date" value={courseForm.next_start} onChange={set("next_start")} style={inp} /></div>
                      <div><label style={lbl}>Price (USD)</label><input type="number" value={courseForm.price} onChange={set("price")} style={inp} placeholder="0" /></div>
                      <div><label style={lbl}>Seats</label><input type="number" value={courseForm.seats} onChange={set("seats")} style={inp} placeholder="0" /></div>

                      {/* Domain Tags */}
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={lbl}>Domain Tags</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {COURSE_TAGS.map(tag => {
                            const selected = (courseForm.tags || []).includes(tag);
                            return (
                              <button key={tag} type="button" onClick={() => setCourseForm(f => ({ ...f, tags: selected ? f.tags.filter(t => t !== tag) : [...(f.tags || []), tag] }))}
                                style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: selected ? "1px solid #0ea5e9" : "1px solid #cbd5e1", background: selected ? "rgba(14,165,233,0.15)" : "#f8fafc", color: selected ? "#38bdf8" : "#94a3b8", transition: "all 0.15s" }}>
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Delivery Location */}
                      <div style={{ gridColumn: "span 2", borderTop: "1px solid #e2e8f0", paddingTop: 16, marginTop: 4 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Delivery Location</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div style={{ gridColumn: "span 2" }}>
                            <label style={lbl}>Location</label>
                            <select value={courseForm.delivery_location_id} onChange={set("delivery_location_id")} style={inp}>
                              <option value="">No location assigned</option>
                              {deliveryLocations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                  {loc.name}{loc.city ? ` — ${loc.city}` : ""}{loc.country_name ? `, ${loc.country_name}` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          {courseForm.delivery_location_id && (() => {
                            const loc = deliveryLocations.find(l => String(l.id) === String(courseForm.delivery_location_id));
                            if (!loc) return null;
                            return (
                              <div style={{ gridColumn: "span 2", background: "rgba(14,165,233,0.04)", border: "1px solid rgba(14,165,233,0.12)", borderRadius: 10, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px" }}>
                                {loc.type && <div><span style={{ color: "#475569", fontSize: 11 }}>Type</span><div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{loc.type}</div></div>}
                                {loc.room_number && <div><span style={{ color: "#475569", fontSize: 11 }}>Room</span><div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{loc.room_number}{loc.floor ? `, ${loc.floor} floor` : ""}</div></div>}
                                {loc.building && <div><span style={{ color: "#475569", fontSize: 11 }}>Building</span><div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{loc.building}</div></div>}
                                {loc.city && <div><span style={{ color: "#475569", fontSize: 11 }}>City</span><div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{loc.city}</div></div>}
                                {loc.country_name && <div><span style={{ color: "#475569", fontSize: 11 }}>Country</span><div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{loc.country_name}</div></div>}
                                {loc.capacity && <div><span style={{ color: "#475569", fontSize: 11 }}>Capacity</span><div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{loc.capacity} seats</div></div>}
                                {loc.platform && <div><span style={{ color: "#475569", fontSize: 11 }}>Platform</span><div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{loc.platform}</div></div>}
                                {loc.timezone && <div><span style={{ color: "#475569", fontSize: 11 }}>Timezone</span><div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{loc.timezone}</div></div>}
                                {loc.contact_name && <div><span style={{ color: "#475569", fontSize: 11 }}>Contact</span><div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>{loc.contact_name}</div></div>}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
                      <button onClick={() => setCourseModal(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveCourse} disabled={courseSaving || !courseForm.vendor_id || !courseForm.title} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: courseSaving ? 0.7 : 1 }}>
                        {courseSaving ? "Saving..." : courseModal.mode === "new" ? "Create Course" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Confirm delete course modal */}
            {confirmDeleteCourse && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                <div style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                  <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Delete Course?</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                    This will permanently delete <strong style={{ color: "#1e293b" }}>{confirmDeleteCourse.title}</strong> along with its schedule and all enrollment records. This cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => setConfirmDeleteCourse(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => deleteCourse(confirmDeleteCourse)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "enrollments" && (() => {
          const courseFiltered = enrollFilter
            ? enrollments.filter(e => String(e.course_id) === enrollFilter)
            : enrollments;
          const eq = enrollSearch.toLowerCase();
          const filtered = eq ? courseFiltered.filter(e =>
            (e.student_name || "").toLowerCase().includes(eq) ||
            (e.student_email || "").toLowerCase().includes(eq) ||
            (e.title || "").toLowerCase().includes(eq) ||
            (e.code || "").toLowerCase().includes(eq) ||
            (e.vendor_name || "").toLowerCase().includes(eq) ||
            (e.delivery || "").toLowerCase().includes(eq)
          ) : courseFiltered;
          const inp = { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#1e293b", fontSize: 13, boxSizing: "border-box" };
          const lbl = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" };
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Enrollment Management</h2>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{enrollments.length} enrollment{enrollments.length !== 1 ? "s" : ""} across {courses.length} course{courses.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => { setEnrollForm({ student_id: "", course_id: "" }); setEnrollModal(true); }} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ Enroll Student</button>
              </div>

              {/* Course filter + per-course enrollment counts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 24 }}>
                <div onClick={() => setEnrollFilter("")} style={{ background: enrollFilter === "" ? "rgba(14,165,233,0.12)" : "#f8fafc", border: `1px solid ${enrollFilter === "" ? "rgba(14,165,233,0.3)" : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#0ea5e9" }}>{enrollments.length}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>All Enrollments</div>
                </div>
                {courses.map(c => {
                  const count = enrollments.filter(e => e.course_id === c.id).length;
                  return (
                    <div key={c.id} onClick={() => setEnrollFilter(String(c.id))} style={{ background: enrollFilter === String(c.id) ? `${c.vendorColor}18` : "#f8fafc", border: `1px solid ${enrollFilter === String(c.id) ? c.vendorColor + "44" : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: c.vendorColor }}>{count}</div>
                      <div style={{ color: "#334155", fontSize: 12, fontWeight: 600, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                      <div style={{ color: "#475569", fontSize: 11, fontFamily: "monospace" }}>{c.code}</div>
                    </div>
                  );
                })}
              </div>

              <SearchBar value={enrollSearch} onChange={setEnrollSearch} placeholder="Search by student, email, course, vendor..." total={courseFiltered.length} filtered={filtered.length} />

              {/* Enrollment table */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                {filtered.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 14, padding: 32, textAlign: "center" }}>No enrollments found.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                        {["Student", "Email", "Course", "Vendor", "Delivery", ""].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <div onClick={() => setStudentDetail(e.student_id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                                {e.student_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <span style={{ color: "#0ea5e9", fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>{e.student_name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>{e.student_email}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ color: "#1e293b", fontWeight: 600 }}>{e.title}</div>
                            <div style={{ color: "#475569", fontFamily: "monospace", fontSize: 11 }}>{e.code}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}><span style={{ color: e.vendor_color, fontWeight: 700 }}>{e.vendor_name}</span></td>
                          <td style={{ padding: "14px 16px" }}><Chip text={e.delivery} color="#0ea5e9" /></td>
                          <td style={{ padding: "14px 16px" }}>
                            <button onClick={() => setConfirmUnenroll(e)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Unenroll</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Enroll modal */}
              {enrollModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 36, width: "100%", maxWidth: 480 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                      <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, margin: 0 }}>Enroll Student</h3>
                      <button onClick={() => setEnrollModal(false)} style={{ background: "rgba(0,0,0,0.03)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                    </div>
                    <div style={{ display: "grid", gap: 16 }}>
                      <div>
                        <label style={lbl}>Student</label>
                        <select value={enrollForm.student_id} onChange={e => setEnrollForm(f => ({ ...f, student_id: e.target.value }))} style={{ ...inp, width: "100%" }}>
                          <option value="">Select student...</option>
                          {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Course</label>
                        <select value={enrollForm.course_id} onChange={e => setEnrollForm(f => ({ ...f, course_id: e.target.value }))} style={{ ...inp, width: "100%" }}>
                          <option value="">Select course...</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
                      <button onClick={() => setEnrollModal(false)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveEnrollment} disabled={enrollSaving || !enrollForm.student_id || !enrollForm.course_id} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: enrollSaving || !enrollForm.student_id || !enrollForm.course_id ? 0.6 : 1 }}>
                        {enrollSaving ? "Enrolling..." : "Confirm Enrollment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm unenroll modal */}
              {confirmUnenroll && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Remove Enrollment?</h3>
                    <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                      Remove <strong style={{ color: "#1e293b" }}>{confirmUnenroll.student_name}</strong> from <strong style={{ color: "#1e293b" }}>{confirmUnenroll.title}</strong>? This cannot be undone.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                      <button onClick={() => setConfirmUnenroll(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => unenroll(confirmUnenroll)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Remove</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Student detail modal */}
              {studentDetail && (() => {
                const student = students.find(s => s.id === studentDetail);
                const profile = profiles.find(p => p.email === student?.email);
                const studentEnrollments = enrollments.filter(e => e.student_id === studentDetail);
                return (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 36, width: "100%", maxWidth: 580, maxHeight: "85vh", overflowY: "auto" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                            {student?.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ color: "#1e293b", fontWeight: 800, fontSize: 18 }}>{student?.name}</div>
                            <div style={{ color: "#0ea5e9", fontSize: 13, fontFamily: "monospace" }}>{student?.email}</div>
                          </div>
                        </div>
                        <button onClick={() => setStudentDetail(null)} style={{ background: "rgba(0,0,0,0.03)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                      </div>

                      {profile && (
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Profile</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", fontSize: 13 }}>
                            {profile.city && <div><span style={{ color: "#475569" }}>Location </span><span style={{ color: "#334155" }}>{profile.city}, {profile.country_name}</span></div>}
                            {profile.phone && <div><span style={{ color: "#475569" }}>Phone </span><span style={{ color: "#334155" }}>{profile.phone}</span></div>}
                            {profile.date_of_birth && <div><span style={{ color: "#475569" }}>Date of Birth </span><span style={{ color: "#334155" }}>{new Date(profile.date_of_birth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>}
                            {profile.education && <div><span style={{ color: "#475569" }}>Education </span><span style={{ color: "#334155" }}>{profile.education}</span></div>}
                            <div><span style={{ color: "#475569" }}>Joined </span><span style={{ color: "#334155" }}>{new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
                          </div>
                          {profile.goals && <div style={{ marginTop: 12, color: "#64748b", fontSize: 12 }}>Goals: <span style={{ color: "#94a3b8" }}>{profile.goals}</span></div>}
                        </div>
                      )}

                      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                        Enrolled Courses ({studentEnrollments.length})
                      </div>
                      {studentEnrollments.length === 0 ? (
                        <div style={{ color: "#475569", fontSize: 13, padding: "12px 0" }}>No enrollments.</div>
                      ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                          {studentEnrollments.map((e, i) => (
                            <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ color: "#1e293b", fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                  <span style={{ color: e.vendor_color, fontSize: 11, fontWeight: 700 }}>{e.vendor_name}</span>
                                  <span style={{ color: "#475569", fontFamily: "monospace", fontSize: 11 }}>{e.code}</span>
                                </div>
                              </div>
                              <Chip text={e.delivery} color="#0ea5e9" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {tab === "instructors" && (() => {
          const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          const statusColor = { Active: "#22c55e", Inactive: "#ef4444", "On Leave": "#f59e0b" };
          const inp = { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#1e293b", fontSize: 13, width: "100%", boxSizing: "border-box" };
          const lbl = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" };
          const set = (k) => (e) => setInstructorForm(f => ({ ...f, [k]: e.target.value }));
          const toggleDay = (day) => setInstructorForm(f => ({ ...f, available_days: f.available_days.includes(day) ? f.available_days.filter(d => d !== day) : [...f.available_days, day] }));
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Instructors</h2>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{instructors.length} instructor{instructors.length !== 1 ? "s" : ""} on record</p>
                </div>
                <button onClick={openNewInstructor} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ New Instructor</button>
              </div>

              <SearchBar value={instructorSearch} onChange={setInstructorSearch} placeholder="Search by name, email, title, specialization, certification..." total={instructors.length} filtered={filteredInstructors.length} />

              <div style={{ display: "grid", gap: 14 }}>
                {filteredInstructors.length === 0 && <div style={{ color: "#64748b", fontSize: 14, padding: 24, textAlign: "center" }}>{instructorSearch ? "No instructors match your search." : "No instructors on record."}</div>}
                {filteredInstructors.map(ins => (
                  <div key={ins.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                      {ins.first_name?.[0]}{ins.last_name?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 15 }}>{ins.first_name} {ins.last_name}</div>
                          <div style={{ color: "#0ea5e9", fontSize: 12, fontFamily: "monospace" }}>{ins.email}</div>
                          {ins.title && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{ins.title} · {ins.employment_type}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                          <span style={{ background: `rgba(${ins.status === "Active" ? "34,197,94" : ins.status === "On Leave" ? "251,191,36" : "239,68,68"},0.12)`, color: statusColor[ins.status] || "#94a3b8", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{ins.status}</span>
                          <button onClick={() => {
                            setAssignCourseIds(new Set(courses.filter(c => c.instructorId === ins.id).map(c => c.id)));
                            setAssignModal({ instructor: ins });
                          }} style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Courses ({courses.filter(c => c.instructorId === ins.id).length})
                          </button>
                          <button onClick={() => openEditInstructor(ins)} style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                          {ins.status === "Active" && <button onClick={() => setConfirmDeactivateInstructor(ins)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Deactivate</button>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 10 }}>
                        {(ins.specializations || []).map(s => <span key={s} style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{s}</span>)}
                        {(ins.certifications || []).map(c => <span key={c} style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{c}</span>)}
                        {ins.available_days?.length > 0 && <span style={{ color: "#64748b", fontSize: 12 }}>Available: {ins.available_days.map(d => d.slice(0,3)).join(", ")}{ins.available_hours ? ` · ${ins.available_hours}` : ""}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructor form modal */}
              {instructorModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, overflowY: "auto" }}>
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 36, width: "100%", maxWidth: 720, margin: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                      <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, margin: 0 }}>{instructorModal.mode === "new" ? "New Instructor" : "Edit Instructor"}</h3>
                      <button onClick={() => setInstructorModal(null)} style={{ background: "rgba(0,0,0,0.03)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                    </div>

                    {/* Basic Info */}
                    <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Basic Information</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                      <div><label style={lbl}>First Name</label><input value={instructorForm.first_name} onChange={set("first_name")} style={inp} placeholder="First name" /></div>
                      <div><label style={lbl}>Last Name</label><input value={instructorForm.last_name} onChange={set("last_name")} style={inp} placeholder="Last name" /></div>
                      <div><label style={lbl}>Email</label><input value={instructorForm.email} onChange={set("email")} style={inp} placeholder="email@example.com" /></div>
                      <div><label style={lbl}>Phone</label><input value={instructorForm.phone} onChange={set("phone")} style={inp} placeholder="+223 ..." /></div>
                      <div><label style={lbl}>Title / Role</label><input value={instructorForm.title} onChange={set("title")} style={inp} placeholder="e.g. Senior Instructor" /></div>
                      <div><label style={lbl}>LinkedIn URL</label><input value={instructorForm.linkedin_url} onChange={set("linkedin_url")} style={inp} placeholder="https://linkedin.com/in/..." /></div>
                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Bio</label><textarea value={instructorForm.bio} onChange={set("bio")} style={{ ...inp, height: 72, resize: "vertical" }} placeholder="Short public-facing biography" /></div>
                    </div>

                    {/* Employment */}
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, marginBottom: 16 }}>
                      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Employment</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        <div>
                          <label style={lbl}>Employment Type</label>
                          <select value={instructorForm.employment_type} onChange={set("employment_type")} style={inp}>
                            {["Full-time", "Part-time", "Contractor"].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Status</label>
                          <select value={instructorForm.status} onChange={set("status")} style={inp}>
                            {["Active", "Inactive", "On Leave"].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div><label style={lbl}>Hire Date</label><input type="date" value={instructorForm.hire_date} onChange={set("hire_date")} style={inp} /></div>
                      </div>
                    </div>

                    {/* Expertise */}
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, marginBottom: 16 }}>
                      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Expertise</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div><label style={lbl}>Specializations <span style={{ color: "#475569", fontWeight: 400 }}>(comma-separated)</span></label><input value={instructorForm.specializations} onChange={set("specializations")} style={inp} placeholder="e.g. Azure, Security, CompTIA" /></div>
                        <div><label style={lbl}>Certifications <span style={{ color: "#475569", fontWeight: 400 }}>(comma-separated)</span></label><input value={instructorForm.certifications} onChange={set("certifications")} style={inp} placeholder="e.g. AZ-104, Security+, CCNA" /></div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, marginBottom: 24 }}>
                      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Availability</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                        {DAYS.map(day => (
                          <button key={day} type="button" onClick={() => toggleDay(day)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: instructorForm.available_days.includes(day) ? "#0ea5e9" : "#e2e8f0", background: instructorForm.available_days.includes(day) ? "rgba(14,165,233,0.15)" : "#f8fafc", color: instructorForm.available_days.includes(day) ? "#0ea5e9" : "#64748b" }}>
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div><label style={lbl}>Available Hours</label><input value={instructorForm.available_hours} onChange={set("available_hours")} style={inp} placeholder="e.g. 09:00–17:00" /></div>
                        <div><label style={lbl}>Availability Note</label><input value={instructorForm.availability_note} onChange={set("availability_note")} style={inp} placeholder="e.g. Evenings only in July" /></div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                      <button onClick={() => setInstructorModal(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveInstructor} disabled={instructorSaving || !instructorForm.first_name || !instructorForm.last_name || !instructorForm.email} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: instructorSaving ? 0.7 : 1 }}>
                        {instructorSaving ? "Saving..." : instructorModal.mode === "new" ? "Add Instructor" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm deactivate modal */}
              {confirmDeactivateInstructor && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Deactivate Instructor?</h3>
                    <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                      <strong style={{ color: "#1e293b" }}>{confirmDeactivateInstructor.first_name} {confirmDeactivateInstructor.last_name}</strong> will be set to Inactive and removed from course assignment dropdowns.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                      <button onClick={() => setConfirmDeactivateInstructor(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => deactivateInstructor(confirmDeactivateInstructor)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Deactivate</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Assign courses modal */}
              {assignModal && (() => {
                const ins = assignModal.instructor;
                const saveAssign = async () => {
                  setAssignSaving(true);
                  try {
                    const allCourses = courses;
                    const toUpdate = allCourses.filter(c => {
                      const wasAssigned = c.instructorId === ins.id;
                      const nowAssigned = assignCourseIds.has(c.id);
                      return wasAssigned !== nowAssigned;
                    });
                    for (const c of toUpdate) {
                      const newInstructorId = assignCourseIds.has(c.id) ? ins.id : null;
                      const res = await fetch(`/api/courses/${c.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          vendor_id: c.vendor, code: c.code, title: c.title, level: c.level,
                          duration: c.duration, price: c.price, seats: c.seats, delivery: c.delivery,
                          next_start: c.nextStart ? c.nextStart.split("T")[0] : "",
                          description: c.description, badge: c.badge || "", tags: c.tags || [],
                          instructor_id: newInstructorId,
                          delivery_location_id: c.locationId || null,
                        }),
                      });
                      const saved = await res.json();
                      onCourseUpdate(saved);
                    }
                    setAssignModal(null);
                  } finally {
                    setAssignSaving(false);
                  }
                };
                const toggle = (id) => setAssignCourseIds(prev => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                });
                return (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 36, width: "100%", maxWidth: 580, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, margin: 0 }}>Assign Courses</h3>
                          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>{ins.first_name} {ins.last_name}</p>
                        </div>
                        <button onClick={() => setAssignModal(null)} style={{ background: "rgba(0,0,0,0.03)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                      </div>

                      <p style={{ color: "#475569", fontSize: 12, marginBottom: 20 }}>Check the courses to assign to this instructor. Unchecking removes the assignment.</p>

                      <div style={{ overflowY: "auto", flex: 1, display: "grid", gap: 8, marginBottom: 24 }}>
                        {courses.length === 0 && <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 24 }}>No courses available.</div>}
                        {courses.map(c => {
                          const checked = assignCourseIds.has(c.id);
                          const otherInstructor = !checked && c.instructorId && c.instructorId !== ins.id
                            ? instructors.find(i => i.id === c.instructorId)
                            : null;
                          return (
                            <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, background: checked ? "rgba(99,102,241,0.08)" : "#f8fafc", border: `1px solid ${checked ? "rgba(99,102,241,0.3)" : "#e2e8f0"}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer" }}>
                              <input type="checkbox" checked={checked} onChange={() => toggle(c.id)} style={{ width: 16, height: 16, accentColor: "#6366f1", flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "#1e293b", fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                                <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                                  <span style={{ color: c.vendorColor, fontSize: 11, fontWeight: 700 }}>{c.vendorName}</span>
                                  <span style={{ color: "#475569", fontFamily: "monospace", fontSize: 11 }}>{c.code}</span>
                                  {otherInstructor && <span style={{ color: "#f59e0b", fontSize: 11 }}>Currently: {otherInstructor.first_name} {otherInstructor.last_name}</span>}
                                </div>
                              </div>
                              {checked && <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Assigned</span>}
                            </label>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                        <button onClick={() => setAssignModal(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                        <button onClick={saveAssign} disabled={assignSaving} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: assignSaving ? 0.7 : 1 }}>
                          {assignSaving ? "Saving..." : "Save Assignments"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Entra account created modal */}
              {instructorCreated && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
                  <div style={{ background: "#ffffff", border: `1px solid ${instructorCreated.warning ? "rgba(251,191,36,0.3)" : "rgba(34,197,94,0.3)"}`, borderRadius: 20, padding: 36, maxWidth: 480, width: "100%" }}>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>{instructorCreated.warning ? "⚠️" : "✅"}</div>
                      <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, margin: "0 0 8px" }}>
                        {instructorCreated.warning ? "Instructor Saved" : "Instructor Created"}
                      </h3>
                      <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{instructorCreated.name} has been added to the system.</p>
                    </div>

                    {instructorCreated.warning ? (
                      <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                        <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Entra ID account could not be created</div>
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>{instructorCreated.warning}</div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>The instructor record has been saved. Set up the Entra ID credentials in Azure App Service settings and try again via Edit.</div>
                      </div>
                    ) : (
                      <div style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Entra ID Account Details</div>
                        <div style={{ display: "grid", gap: 10 }}>
                          <div>
                            <div style={{ color: "#475569", fontSize: 11 }}>Username (UPN)</div>
                            <div style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{instructorCreated.upn}</div>
                          </div>
                          <div>
                            <div style={{ color: "#475569", fontSize: 11 }}>Temporary Password <span style={{ color: "#64748b", fontWeight: 400 }}>(instructor must change on first login)</span></div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                              <code style={{ background: "#e2e8f0", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", color: "#1e293b", fontFamily: "monospace", fontSize: 15, fontWeight: 700, flex: 1, textAlign: "center", letterSpacing: 2 }}>{instructorCreated.tempPassword}</code>
                              <button onClick={() => instructorCreated.tempPassword && navigator.clipboard.writeText(instructorCreated.tempPassword)} disabled={!instructorCreated.tempPassword} style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: instructorCreated.tempPassword ? "pointer" : "not-allowed", whiteSpace: "nowrap", opacity: instructorCreated.tempPassword ? 1 : 0.4 }}>Copy</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <button onClick={() => setInstructorCreated(null)} style={{ width: "100%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, cursor: "pointer" }}>Done</button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "locations" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", margin: "0 0 4px" }}>Delivery Locations</h2>
                <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{deliveryLocations.length} location{deliveryLocations.length !== 1 ? "s" : ""} configured</p>
              </div>
              <button onClick={openNewLocation} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ New Location</button>
            </div>

            <SearchBar value={locationSearch} onChange={setLocationSearch} placeholder="Search by name, type, city, country, building, platform..." total={deliveryLocations.length} filtered={filteredLocations.length} />

            <div style={{ display: "grid", gap: 14 }}>
              {filteredLocations.length === 0 && (
                <div style={{ color: "#64748b", fontSize: 14, padding: 24, textAlign: "center" }}>{locationSearch ? "No locations match your search." : "No locations configured yet."}</div>
              )}
              {filteredLocations.map(loc => (
                <div key={loc.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: loc.type === "Online" ? "rgba(99,102,241,0.15)" : loc.type === "Hybrid" ? "rgba(251,191,36,0.15)" : "rgba(14,165,233,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {loc.type === "Online" ? "🌐" : loc.type === "Hybrid" ? "🔀" : "🏢"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 15 }}>{loc.name}</div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                          {[loc.room_number && `Room ${loc.room_number}`, loc.building, loc.city, loc.country_name].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => openEditLocation(loc)} style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => setConfirmDeleteLocation(loc)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Deactivate</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
                      <span style={{ background: loc.type === "Online" ? "rgba(99,102,241,0.12)" : loc.type === "Hybrid" ? "rgba(251,191,36,0.12)" : "rgba(14,165,233,0.12)", color: loc.type === "Online" ? "#818cf8" : loc.type === "Hybrid" ? "#fbbf24" : "#38bdf8", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{loc.type}</span>
                      {loc.capacity && <span style={{ color: "#64748b", fontSize: 12 }}>Capacity: <span style={{ color: "#94a3b8" }}>{loc.capacity}</span></span>}
                      {loc.platform && <span style={{ color: "#64748b", fontSize: 12 }}>Platform: <span style={{ color: "#94a3b8" }}>{loc.platform}</span></span>}
                      {loc.timezone && loc.timezone !== "UTC" && <span style={{ color: "#64748b", fontSize: 12 }}>TZ: <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{loc.timezone}</span></span>}
                      {loc.contact_name && <span style={{ color: "#64748b", fontSize: 12 }}>Contact: <span style={{ color: "#94a3b8" }}>{loc.contact_name}</span></span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Location form modal */}
            {locationModal && (() => {
              const inp = { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", color: "#1e293b", fontSize: 13, width: "100%", boxSizing: "border-box" };
              const lbl = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" };
              const set = (k) => (e) => setLocationForm(f => ({ ...f, [k]: e.target.value }));
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, overflowY: "auto" }}>
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 36, width: "100%", maxWidth: 680, margin: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                      <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, margin: 0 }}>{locationModal.mode === "new" ? "New Location" : "Edit Location"}</h3>
                      <button onClick={() => setLocationModal(null)} style={{ background: "rgba(0,0,0,0.03)", border: "none", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Location Name</label><input value={locationForm.name} onChange={set("name")} style={inp} placeholder='e.g. "Bamako Training Centre – Lab A"' /></div>
                      <div>
                        <label style={lbl}>Type</label>
                        <select value={locationForm.type} onChange={set("type")} style={inp}>
                          {["Physical", "Online", "Hybrid"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Timezone</label>
                        <select value={locationForm.timezone} onChange={set("timezone")} style={inp}>
                          {TIMEZONES.map(({ tz, label }) => (
                            <option key={tz} value={tz}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ gridColumn: "span 2", borderTop: "1px solid #e2e8f0", paddingTop: 14, marginTop: 4 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Address</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div style={{ gridColumn: "span 2" }}><label style={lbl}>Address Line 1</label><input value={locationForm.address_line1} onChange={set("address_line1")} style={inp} placeholder="Street address, P.O. box" /></div>
                          <div style={{ gridColumn: "span 2" }}><label style={lbl}>Address Line 2</label><input value={locationForm.address_line2} onChange={set("address_line2")} style={inp} placeholder="Apartment, suite, building, floor…" /></div>
                          <div>
                            <label style={lbl}>Country</label>
                            <select value={locationForm.country_code} onChange={e => {
                              const code = e.target.value;
                              const name = Country.getAllCountries().find(c => c.isoCode === code)?.name || "";
                              setLocationForm(f => ({ ...f, country_code: code, country_name: name, city: "", state_province: "" }));
                            }} style={inp}>
                              <option value="">Select country...</option>
                              {Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>City</label>
                            {(() => {
                              const cities = locationForm.country_code ? City.getCitiesOfCountry(locationForm.country_code) : [];
                              return cities.length > 0 ? (
                                <select value={locationForm.city} onChange={set("city")} style={inp}>
                                  <option value="">Select city...</option>
                                  {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                              ) : (
                                <input value={locationForm.city} onChange={set("city")} style={inp} placeholder={locationForm.country_code ? "Enter city" : "Select a country first"} disabled={!locationForm.country_code} />
                              );
                            })()}
                          </div>
                          <div><label style={lbl}>State / Province</label><input value={locationForm.state_province} onChange={set("state_province")} style={inp} placeholder="State or province" /></div>
                          <div><label style={lbl}>Postal Code</label><input value={locationForm.postal_code} onChange={set("postal_code")} style={inp} placeholder="ZIP / postal code" /></div>
                        </div>
                      </div>

                      <div style={{ gridColumn: "span 2", borderTop: "1px solid #e2e8f0", paddingTop: 14, marginTop: 4 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Room Details</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <div><label style={lbl}>Room Number</label><input value={locationForm.room_number} onChange={set("room_number")} style={inp} placeholder="e.g. Lab A" /></div>
                          <div><label style={lbl}>Floor</label><input value={locationForm.floor} onChange={set("floor")} style={inp} placeholder="e.g. 2nd" /></div>
                          <div><label style={lbl}>Building</label><input value={locationForm.building} onChange={set("building")} style={inp} placeholder="e.g. ICT Block" /></div>
                          <div><label style={lbl}>Capacity (seats)</label><input type="number" value={locationForm.capacity} onChange={set("capacity")} style={inp} placeholder="0" /></div>
                          <div><label style={lbl}>Platform</label><input value={locationForm.platform} onChange={set("platform")} style={inp} placeholder="e.g. Microsoft Teams" /></div>
                        </div>
                      </div>

                      <div style={{ gridColumn: "span 2", borderTop: "1px solid #e2e8f0", paddingTop: 14, marginTop: 4 }}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Venue Contact</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                          <div><label style={lbl}>Contact Name</label><input value={locationForm.contact_name} onChange={set("contact_name")} style={inp} placeholder="Full name" /></div>
                          <div><label style={lbl}>Email</label><input value={locationForm.contact_email} onChange={set("contact_email")} style={inp} placeholder="email@example.com" /></div>
                          <div><label style={lbl}>Phone</label><input value={locationForm.contact_phone} onChange={set("contact_phone")} style={inp} placeholder="+223 ..." /></div>
                        </div>
                      </div>

                      <div style={{ gridColumn: "span 2" }}><label style={lbl}>Notes</label><textarea value={locationForm.notes} onChange={set("notes")} style={{ ...inp, height: 72, resize: "vertical" }} placeholder="Additional notes..." /></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
                      <button onClick={() => setLocationModal(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveLocation} disabled={locationSaving || !locationForm.name} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: locationSaving ? 0.7 : 1 }}>
                        {locationSaving ? "Saving..." : locationModal.mode === "new" ? "Create Location" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Confirm deactivate modal */}
            {confirmDeleteLocation && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                <div style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                  <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Deactivate Location?</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                    <strong style={{ color: "#1e293b" }}>{confirmDeleteLocation.name}</strong> will be hidden from location selectors. Existing course assignments are preserved.
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => setConfirmDeleteLocation(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => deleteLocation(confirmDeleteLocation)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Deactivate</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "integrations" && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", marginBottom: 32 }}>Integrations & Provisioning</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {[
                { name: "Microsoft 365 Tenant", icon: "☁️", status: "Connected", desc: "Auto-provisioning student accounts on registration. Tenant: trainee.edu", color: "#0ea5e9" },
                { name: "MS Teams", icon: "💬", status: "Connected", desc: "Course channels auto-created. 47 active student members.", color: "#6366f1" },
                { name: "OneNote Class Notebooks", icon: "📓", status: "Connected", desc: "Shared notebooks synced per course cohort.", color: "#8b5cf6" },
                { name: "Moodle LMS", icon: "🎓", status: "Connected", desc: "Course content, quizzes, and assignments managed via Moodle.", color: "#f59e0b" },
                { name: "SkillJa", icon: "⚡", status: "Connected", desc: "Hands-on labs and skills assessments integrated.", color: "#22c55e" },
                { name: "Google NotebookLM", icon: "🤖", status: "Pending Setup", desc: "AI-powered study companion. Configure API keys to activate.", color: "#64748b" },
              ].map(int => (
                <div key={int.name} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>{int.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 16 }}>{int.name}</div>
                      <span style={{ background: int.status === "Connected" ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)", color: int.status === "Connected" ? "#22c55e" : "#fbbf24", border: `1px solid ${int.status === "Connected" ? "rgba(34,197,94,0.2)" : "rgba(251,191,36,0.2)"}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                        {int.status}
                      </span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: 14 }}>{int.desc}</div>
                  </div>
                  <button style={{ background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                    {int.status === "Connected" ? "Configure" : "Setup"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "schedule" && (() => {
          const openNewSchedule = () => {
            setScheduleForm(EMPTY_SCHEDULE);
            setScheduleModal({ mode: "new" });
          };
          const openEditSchedule = (s) => {
            const parts = s.time.split(/\s*[–\-]\s*/);
            setScheduleForm({ course_id: s.courseId, day: s.day, time_start: parse24(parts[0] || ""), time_end: parse24(parts[1] || ""), instructor: s.instructor, room: s.room, type: s.type });
            setScheduleModal({ mode: "edit", id: s.id });
          };
          const saveSchedule = async () => {
            if (!scheduleForm.course_id || !scheduleForm.day || !scheduleForm.time_start || !scheduleForm.type) return;
            const time = scheduleForm.time_end
              ? `${fmt12(scheduleForm.time_start)} – ${fmt12(scheduleForm.time_end)}`
              : fmt12(scheduleForm.time_start);
            const payload = { course_id: scheduleForm.course_id, day: scheduleForm.day, time, instructor: scheduleForm.instructor, room: scheduleForm.room, type: scheduleForm.type };
            setScheduleSaving(true);
            try {
              if (scheduleModal.mode === "new") {
                const r = await fetch("/api/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                const saved = await r.json();
                onScheduleAdd(normalizeSchedule(saved));
              } else {
                const r = await fetch(`/api/schedule/${scheduleModal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                const saved = await r.json();
                onScheduleUpdate(normalizeSchedule(saved));
              }
              setScheduleModal(null);
            } finally {
              setScheduleSaving(false);
            }
          };
          const deleteSchedule = async (entry) => {
            await fetch(`/api/schedule/${entry.id}`, { method: "DELETE" });
            onScheduleDelete(entry.id);
            setConfirmDeleteSchedule(null);
          };

          const inputStyle = { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", color: "#1e293b", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" };
          const labelStyle = { color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" };

          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", fontFamily: "Georgia, serif", margin: 0 }}>Schedule Management</h2>
                <button onClick={openNewSchedule} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  + Add Entry
                </button>
              </div>

              <SearchBar value={scheduleSearch} onChange={setScheduleSearch} placeholder="Search by course, day, instructor, room, format..." total={schedule.length} filtered={filteredSchedule.length} />

              {filteredSchedule.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>{scheduleSearch ? "No schedule entries match your search." : "No schedule entries yet. Add one to get started."}</div>
              ) : (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9" }}>
                        {["Course", "Day", "Time", "Instructor", "Room", "Format", ""].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchedule.map((s, i) => {
                        const c = courseById(s.courseId);
                        if (!c) return null;
                        return (
                          <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)" }}>
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ color: "#1e293b", fontWeight: 600 }}>{c.title}</div>
                              <div style={{ color: c.vendorColor, fontSize: 11, fontWeight: 700 }}>{c.code}</div>
                            </td>
                            <td style={{ padding: "14px 16px", color: "#94a3b8", fontFamily: "monospace" }}>{s.day}</td>
                            <td style={{ padding: "14px 16px", color: "#94a3b8", fontFamily: "monospace" }}>{s.time}</td>
                            <td style={{ padding: "14px 16px", color: "#334155" }}>{s.instructor || "—"}</td>
                            <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: 12 }}>{s.room || "—"}</td>
                            <td style={{ padding: "14px 16px" }}><Chip text={s.type} color={s.type === "Online" ? "#0ea5e9" : s.type === "Hybrid" ? "#f59e0b" : "#8b5cf6"} /></td>
                            <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                              <button onClick={() => openEditSchedule(s)} style={{ background: "#e2e8f0", color: "#94a3b8", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginRight: 6 }}>Edit</button>
                              <button onClick={() => setConfirmDeleteSchedule(s)} style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Schedule modal */}
              {scheduleModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 36, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
                    <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, marginBottom: 28 }}>
                      {scheduleModal.mode === "new" ? "Add Schedule Entry" : "Edit Schedule Entry"}
                    </h3>
                    <div style={{ display: "grid", gap: 18 }}>
                      <div>
                        <label style={labelStyle}>Course *</label>
                        <select value={scheduleForm.course_id} onChange={e => {
                          const c = courses.find(x => x.id === Number(e.target.value));
                          setScheduleForm(f => ({ ...f, course_id: Number(e.target.value), instructor: c?.instructorName || f.instructor }));
                        }} style={inputStyle}>
                          <option value="">Select a course...</option>
                          {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Date *</label>
                        <input type="date" value={scheduleForm.day} onChange={e => setScheduleForm(f => ({ ...f, day: e.target.value }))} style={inputStyle} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Start Time *</label>
                          <input type="time" value={scheduleForm.time_start} onChange={e => setScheduleForm(f => ({ ...f, time_start: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>End Time</label>
                          <input type="time" value={scheduleForm.time_end} onChange={e => setScheduleForm(f => ({ ...f, time_end: e.target.value }))} style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Format *</label>
                        <select value={scheduleForm.type} onChange={e => setScheduleForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                          {["Online", "In-Person", "Hybrid"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Instructor</label>
                        <select value={scheduleForm.instructor} onChange={e => setScheduleForm(f => ({ ...f, instructor: e.target.value }))} style={inputStyle}>
                          <option value="">— None / TBD —</option>
                          {instructors.filter(i => i.status === "Active").map(i => (
                            <option key={i.id} value={`${i.first_name} ${i.last_name}`}>{i.first_name} {i.last_name}{i.title ? ` — ${i.title}` : ""}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Room / Location</label>
                        <input value={scheduleForm.room} onChange={e => setScheduleForm(f => ({ ...f, room: e.target.value }))} style={inputStyle} placeholder="e.g. Room 204 or Teams link" />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
                      <button onClick={() => setScheduleModal(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={saveSchedule} disabled={scheduleSaving || !scheduleForm.course_id || !scheduleForm.day || !scheduleForm.time_start} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, cursor: "pointer", opacity: scheduleSaving || !scheduleForm.course_id || !scheduleForm.day || !scheduleForm.time_start ? 0.6 : 1 }}>
                        {scheduleSaving ? "Saving..." : scheduleModal.mode === "new" ? "Add Entry" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm delete modal */}
              {confirmDeleteSchedule && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
                  <div style={{ background: "#ffffff", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>{"🗑️"}</div>
                    <h3 style={{ color: "#1e293b", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Delete Schedule Entry?</h3>
                    <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                      This will permanently remove the <strong style={{ color: "#1e293b" }}>{confirmDeleteSchedule.day} {confirmDeleteSchedule.time}</strong> entry for <strong style={{ color: "#1e293b" }}>{courseById(confirmDeleteSchedule.courseId)?.title}</strong>.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                      <button onClick={() => setConfirmDeleteSchedule(null)} style={{ background: "rgba(0,0,0,0.03)", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => deleteSchedule(confirmDeleteSchedule)} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, cursor: "pointer" }}>Yes, Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
