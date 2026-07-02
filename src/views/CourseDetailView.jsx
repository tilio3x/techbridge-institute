import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Badge from "../components/Badge";

const levelStyle = {
  Beginner: { bg: "#dcfce7", color: "#15803d" },
  Intermediate: { bg: "#fef3c7", color: "#b45309" },
  Advanced: { bg: "#fee2e2", color: "#dc2626" },
};

// No per-course syllabus exists in the database yet; generate a certification-prep
// outline from the course fields, closing with practice-exam and scheduling units.
function buildSyllabus(course) {
  const focusAreas = course.tags?.length ? course.tags : ["core concepts"];
  return [
    {
      title: `Introduction to ${course.title}`,
      summary: `Get oriented with the ${course.code} certification journey and understand what the exam covers.`,
      bullets: [
        "Review the official exam objectives and structure",
        "Set up your learning environment and study plan",
      ],
    },
    {
      title: "Core concepts and fundamentals",
      summary: `Build a solid foundation in ${focusAreas.join(", ")} as covered by the ${course.code} exam.`,
      bullets: [
        "Master the key terminology and principles",
        "Understand how concepts map to real-world scenarios",
      ],
    },
    {
      title: "Hands-on labs and guided practice",
      summary: `Apply what you've learned through practical exercises delivered in our ${course.delivery.toLowerCase()} format.`,
      bullets: [
        "Complete instructor-guided lab exercises",
        "Work through real-world troubleshooting scenarios",
      ],
    },
    {
      title: "Review and knowledge checks",
      summary: "Consolidate your knowledge with structured reviews and identify areas that need more attention.",
      bullets: [
        "Take end-of-module quizzes to validate understanding",
        "Revisit weak areas with targeted review sessions",
      ],
    },
    {
      title: "Take the Practice Exam",
      summary: "Practice exams are designed to help you prepare for the exam and perform on exam day. Study at your own pace and practice with exam-like questions.",
      bullets: [],
    },
    {
      title: "Schedule your Exam",
      summary: `After completing your studies, schedule your ${course.code} exam with ${course.vendorName}.`,
      bullets: [],
    },
  ];
}

function buildSkills(course) {
  const skills = [...(course.tags || [])];
  skills.push(`${course.vendorName} Technologies`);
  if (course.level === "Beginner") skills.push("Foundational IT Concepts");
  if (course.level === "Intermediate") skills.push("Applied Administration");
  if (course.level === "Advanced") skills.push("Expert-Level Design & Operations");
  skills.push("Hands-on Lab Experience");
  skills.push("Exam Preparation");
  skills.push("Real-World Troubleshooting");
  return [...new Set(skills)];
}

function StatItem({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 28px", flex: 1, justifyContent: "center" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <tr>
      <td style={{
        padding: "12px 20px", fontSize: 13, fontWeight: 600, color: "#64748b",
        borderBottom: "1px solid #e2e8f0", width: 220, background: "#f8fafc",
      }}>{label}</td>
      <td style={{
        padding: "12px 20px", fontSize: 14, color: "#1e293b",
        borderBottom: "1px solid #e2e8f0",
      }}>{value}</td>
    </tr>
  );
}

function SyllabusUnit({ index, unit, open, onToggle }) {
  return (
    <div style={{ borderBottom: "1px solid #e2e8f0" }}>
      <div onClick={onToggle} style={{
        display: "flex", alignItems: "flex-start", gap: 16, padding: "20px 24px",
        cursor: "pointer",
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", background: "#0f172a", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 1,
        }}>{index + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{unit.title}</div>
          {open && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>{unit.summary}</p>
              {unit.bullets.length > 0 && (
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                  {unit.bullets.map(b => (
                    <li key={b} style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <span style={{
          color: "#64748b", fontSize: 16, flexShrink: 0,
          transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)",
        }}>▾</span>
      </div>
    </div>
  );
}

export default function CourseDetailView({ enrolledCourses, onEnroll, vendors, courses }) {
  const { vendorId, courseId } = useParams();
  const navigate = useNavigate();

  const course = courses.find(c => String(c.id) === String(courseId));
  const vendor = vendors.find(v => v.id === vendorId || v.id === course?.vendor);

  const syllabus = useMemo(() => course ? buildSyllabus(course) : [], [course]);
  const skills = useMemo(() => course ? buildSkills(course) : [], [course]);

  const [openUnits, setOpenUnits] = useState(() => new Set([0]));
  const allOpen = openUnits.size === syllabus.length;

  const toggleUnit = (i) => {
    setOpenUnits(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    setOpenUnits(allOpen ? new Set() : new Set(syllabus.map((_, i) => i)));
  };

  if (!course || !vendor) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Course not found</h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>The course you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate("/courses")} style={{
          background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>Back to Catalog</button>
      </div>
    );
  }

  const seatsLeft = course.seats - course.enrolled;
  const isEnrolled = enrolledCourses.includes(course.id);
  const lvl = levelStyle[course.level] || levelStyle.Beginner;
  const startDate = new Date(course.nextStart).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const locationParts = [course.locationName, course.locationCity, course.locationCountry].filter(Boolean);
  const roomParts = [
    course.locationBuilding && `Building ${course.locationBuilding}`,
    course.locationFloor && `Floor ${course.locationFloor}`,
    course.locationRoom && `Room ${course.locationRoom}`,
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 32px 80px" }}>
      {/* Breadcrumb */}
      <button onClick={() => navigate(`/courses/${vendor.id}`)} style={{
        background: "none", border: "none", color: "#3b82f6", fontSize: 14,
        fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 24,
      }}>← Back to {vendor.name} courses</button>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: vendor.color, letterSpacing: 0.3 }}>{vendor.name}</span>
          <span style={{ fontSize: 13, fontFamily: "monospace", color: "#94a3b8" }}>{course.code}</span>
          <Badge text={course.badge} />
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: "#1e293b", letterSpacing: -0.5, margin: 0, lineHeight: 1.2 }}>
          {course.title}
        </h1>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", background: "#ffffff", border: "1px solid #cbd5e1",
        borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 40,
        flexWrap: "wrap",
      }}>
        <StatItem icon="📊" label="Skill level" value={
          <span style={{ background: lvl.bg, color: lvl.color, fontSize: 13, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>{course.level}</span>
        } />
        <div style={{ width: 1, background: "#e2e8f0", margin: "14px 0" }} />
        <StatItem icon="🕐" label="Time to complete" value={`Approx. ${course.duration}`} />
        <div style={{ width: 1, background: "#e2e8f0", margin: "14px 0" }} />
        <StatItem icon="📜" label="Certification exam" value={`Delivered by ${vendor.name}`} />
      </div>

      {/* About + Skills */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 48, marginBottom: 48 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 14px" }}>About this course</h2>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, margin: 0 }}>{course.description}</p>
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 14px" }}>Skills you'll gain</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {skills.map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", background: "#0f172a", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>✓</span>
                <span style={{ fontSize: 14, color: "#334155" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course details table */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>Course details</h2>
        <div style={{
          background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 12,
          overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <DetailRow label="Course code" value={<span style={{ fontFamily: "monospace" }}>{course.code}</span>} />
              <DetailRow label="Provider" value={<span style={{ color: vendor.color, fontWeight: 700 }}>{vendor.name}</span>} />
              <DetailRow label="Skill level" value={course.level} />
              <DetailRow label="Duration" value={course.duration} />
              <DetailRow label="Delivery format" value={course.delivery} />
              <DetailRow label="Next start date" value={startDate} />
              <DetailRow label="Price" value={<strong>${course.price.toLocaleString()}</strong>} />
              <DetailRow label="Seats available" value={
                <span style={{ color: seatsLeft < 5 ? "#ef4444" : "#1e293b", fontWeight: seatsLeft < 5 ? 700 : 400 }}>
                  {seatsLeft} of {course.seats}{seatsLeft < 5 ? " — almost full" : ""}
                </span>
              } />
              <DetailRow label="Instructor" value={course.instructorName} />
              <DetailRow label="Location" value={locationParts.length ? locationParts.join(", ") : null} />
              <DetailRow label="Room" value={roomParts.length ? roomParts.join(" · ") : null} />
              <DetailRow label="Online platform" value={course.locationPlatform} />
              <DetailRow label="Timezone" value={course.locationTimezone} />
              <DetailRow label="Focus areas" value={course.tags?.length ? course.tags.join(", ") : null} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Syllabus */}
      <div style={{
        background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 40, overflow: "hidden",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "22px 24px", borderBottom: "1px solid #e2e8f0",
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>Syllabus</h2>
            <span style={{ fontSize: 13, color: "#64748b" }}>{syllabus.length} units · {course.duration}</span>
          </div>
          <button onClick={toggleAll} style={{
            background: "none", border: "none", color: "#3b82f6", fontSize: 13,
            fontWeight: 600, cursor: "pointer", padding: 0,
          }}>{allOpen ? "Collapse all sections" : "Expand all sections"}</button>
        </div>
        {syllabus.map((unit, i) => (
          <SyllabusUnit key={unit.title} index={i} unit={unit} open={openUnits.has(i)} onToggle={() => toggleUnit(i)} />
        ))}
      </div>

      {/* Enroll CTA */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => onEnroll(course)}
          style={{
            background: isEnrolled ? "#f0fdf4" : "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: isEnrolled ? "#22c55e" : "#ffffff",
            border: isEnrolled ? "1px solid #bbf7d0" : "none",
            borderRadius: 10, padding: "14px 64px", fontSize: 15,
            fontWeight: 700, cursor: isEnrolled ? "default" : "pointer",
            boxShadow: isEnrolled ? "none" : "0 4px 16px rgba(59,130,246,0.25)",
          }}
        >
          {isEnrolled ? "✓ Enrolled" : `Enroll — $${course.price.toLocaleString()}`}
        </button>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          Next cohort starts {startDate} · {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left
        </span>
      </div>
    </div>
  );
}
