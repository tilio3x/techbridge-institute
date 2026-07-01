const colors = { Hot: "bg-red-500", New: "bg-green-500", Core: "bg-violet-500" };

export default function Badge({ text, color = "bg-blue-500" }) {
  if (!text) return null;
  const bg = colors[text] || color;
  return (
    <span className={`${bg} text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase`}>
      {text}
    </span>
  );
}
