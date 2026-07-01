export default function AuthWall({ onLogin, message }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-10 text-center">
      <div className="text-5xl">🔒</div>
      <h2 className="text-2xl font-bold text-slate-800 m-0">Authentication Required</h2>
      <p className="text-slate-500 text-base max-w-[400px] m-0">{message}</p>
      <button onClick={onLogin} className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-none rounded-lg px-9 py-3.5 text-[15px] font-semibold cursor-pointer">
        Sign In / Register
      </button>
    </div>
  );
}
