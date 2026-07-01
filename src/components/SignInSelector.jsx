export default function SignInSelector({ onStudentLogin, onStaffLogin, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 w-full max-w-[780px]">
        <div className="relative text-center mb-8">
          <div className="text-blue-500 text-[11px] font-bold tracking-[2px] uppercase mb-2.5">TechBridge Institute</div>
          <h2 className="text-slate-800 font-bold text-[22px] m-0">Welcome — how would you like to sign in?</h2>
          <button onClick={onClose} className="absolute top-0 right-0 bg-slate-100 border-none text-slate-500 rounded-lg px-3 py-1.5 cursor-pointer text-base hover:bg-slate-200">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-6 flex flex-col gap-4">
            <div className="text-[34px]">🎓</div>
            <div>
              <div className="text-slate-800 font-semibold text-[15px] mb-1.5">Student</div>
              <div className="text-slate-500 text-xs leading-relaxed">Sign in to access your courses, dashboard, and certifications. New students can register here.</div>
            </div>
            <button onClick={() => { onClose(); onStudentLogin(); }} className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-none rounded-lg py-[11px] px-4 font-semibold text-[13px] cursor-pointer mt-auto">
              Student Sign In / Register
            </button>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-6 flex flex-col gap-4">
            <div className="text-[34px]">👨‍🏫</div>
            <div>
              <div className="text-slate-800 font-semibold text-[15px] mb-1.5">Educator</div>
              <div className="text-slate-500 text-xs leading-relaxed">Sign in with your institution Microsoft 365 account. Educator accounts are provisioned by HR.</div>
            </div>
            <button onClick={onStaffLogin} className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white border-none rounded-lg py-[11px] px-4 font-semibold text-[13px] cursor-pointer mt-auto">
              Educator Sign In
            </button>
          </div>

          <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-6 flex flex-col gap-4">
            <div className="text-[34px]">🛡️</div>
            <div>
              <div className="text-slate-800 font-semibold text-[15px] mb-1.5">Site Admin</div>
              <div className="text-slate-500 text-xs leading-relaxed">Sign in with your institution Microsoft 365 account. Admin access is granted by IT.</div>
            </div>
            <button onClick={onStaffLogin} className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none rounded-lg py-[11px] px-4 font-semibold text-[13px] cursor-pointer mt-auto">
              Admin Sign In
            </button>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6 mb-0">
          Educators & admins — don't have an account? Contact HR or IT to start the onboarding process.
        </p>
      </div>
    </div>
  );
}
