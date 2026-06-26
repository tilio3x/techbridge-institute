export default function Chip({ text, color }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border"
      style={{ background: `${color}22`, color, borderColor: `${color}44` }}
    >
      {text}
    </span>
  );
}
