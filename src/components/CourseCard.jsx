import Badge from "./Badge";
import Chip from "./Chip";
import { levelColor } from "../utils/constants";

export default function CourseCard({ course, onEnroll, isEnrolled }) {
  const vendor = { name: course.vendorName, color: course.vendorColor, logo: course.vendorLogo };
  const seatsLeft = course.seats - course.enrolled;
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-3 transition-all duration-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: vendor.color }} />
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-xl">{vendor.logo}</span>
          <span className="text-[11px] font-bold tracking-widest uppercase font-mono" style={{ color: vendor.color }}>{vendor.name}</span>
        </div>
        <Badge text={course.badge} />
      </div>
      <div>
        <div className="font-mono text-xs text-slate-500 mb-1">{course.code}</div>
        <div className="text-[17px] font-bold text-slate-100 leading-tight">{course.title}</div>
      </div>
      <p className="text-[13px] text-slate-400 leading-relaxed m-0">{course.description}</p>
      <div className="flex gap-2 flex-wrap">
        <Chip text={course.level} color={levelColor[course.level]} />
        <Chip text={course.delivery} color="#0ea5e9" />
        <Chip text={course.duration} color="#8b5cf6" />
      </div>
      <div className="border-t border-white/[0.06] pt-3 flex justify-between items-center">
        <div>
          <div className="text-xl font-extrabold text-slate-100">${course.price.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">
            Starts {new Date(course.nextStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {seatsLeft} seats left
          </div>
        </div>
        <button
          onClick={() => onEnroll(course)}
          className={`rounded-[10px] px-5 py-2.5 font-bold text-[13px] cursor-pointer ${
            isEnrolled
              ? "bg-green-500/15 text-green-500 border border-green-500"
              : "bg-gradient-to-br from-sky-500 to-indigo-500 text-white border-none"
          }`}
          style={isEnrolled ? { cursor: "default" } : {}}
        >
          {isEnrolled ? "✓ Enrolled" : "Enroll Now"}
        </button>
      </div>
    </div>
  );
}
