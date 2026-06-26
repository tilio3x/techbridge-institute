export const INTEGRATIONS = [
  { name: "MS Teams", icon: "\u{1F4AC}", desc: "Live sessions & collaboration" },
  { name: "OneNote", icon: "\u{1F4D3}", desc: "Shared course notebooks" },
  { name: "Moodle LMS", icon: "\u{1F393}", desc: "Course content & assignments" },
  { name: "SkillJa", icon: "⚡", desc: "Skills assessment & labs" },
  { name: "NotebookLM", icon: "\u{1F916}", desc: "AI-powered study guides" },
  { name: "M365", icon: "☁️", desc: "Student accounts & email" },
];

export const levelColor = {
  Beginner: "#22c55e",
  Intermediate: "#f59e0b",
  Advanced: "#ef4444",
};

export const TIMEZONES = (() => {
  const now = new Date();
  return Intl.supportedValuesOf("timeZone")
    .map(tz => {
      try {
        const parts = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(now);
        const offset = parts.find(p => p.type === "timeZoneName")?.value?.replace("GMT", "UTC") ?? "UTC";
        return { tz, label: `${offset} · ${tz.replace(/_/g, " ")}` };
      } catch {
        return { tz, label: `UTC · ${tz.replace(/_/g, " ")}` };
      }
    })
    .sort((a, b) => {
      const toMin = s => { const m = s.label.match(/UTC([+-])(\d+)(?::(\d+))?/); return m ? (m[1] === "+" ? 1 : -1) * (parseInt(m[2]) * 60 + parseInt(m[3] ?? 0)) : 0; };
      return toMin(a) - toMin(b);
    });
})();

export const DURATION_UNITS = ["Hour", "Day", "Week", "Month", "Year"];

export const EMPTY_COURSE = {
  vendor_id: "", code: "", title: "", level: "Beginner",
  duration_value: "", duration_unit: "Week",
  price: "", seats: "", delivery: "Hybrid", next_start: "", description: "",
  badge: "", instructor_id: "", delivery_location_id: "",
};

export const EMPTY_INSTRUCTOR = {
  first_name: "", last_name: "", email: "", phone: "", title: "",
  bio: "", specializations: "", certifications: "", employment_type: "Full-time",
  status: "Active", hire_date: "", photo_url: "", linkedin_url: "",
  available_days: [], available_hours: "", availability_note: "",
};

export const EMPTY_LOCATION = {
  name: "", type: "Physical", address_line1: "", address_line2: "",
  city: "", state_province: "", country_code: "", country_name: "",
  postal_code: "", room_number: "", floor: "", building: "",
  capacity: "", platform: "", meeting_url: "", facilities: "",
  timezone: "UTC", contact_name: "", contact_email: "", contact_phone: "", notes: "",
};
