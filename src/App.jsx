import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest, staffMsalInstance, staffLoginRequest } from "./auth/msalConfig.js";
import { normalizeCourse, normalizeSchedule } from "./utils/normalizers";
import SignInSelector from "./components/SignInSelector";
import AuthWall from "./components/AuthWall";
import HomeView from "./views/HomeView";
import CoursesView from "./views/CoursesView";
import ScheduleView from "./views/ScheduleView";
import ContactView from "./views/ContactView";
import RegisterView from "./views/RegisterView";
import DashboardView from "./views/DashboardView";
import EducatorPortalView from "./views/EducatorPortalView";
import AdminView from "./views/AdminView";
import ProfileSetupView from "./views/ProfileSetupView";
import ProfileEditView from "./views/ProfileEditView";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const user = accounts[0] ?? null;
  const [staffAccount, setStaffAccount] = useState(() => staffMsalInstance.getAllAccounts()[0] ?? null);
  const isAdmin = staffAccount?.idTokenClaims?.roles?.includes("Admin") ?? user?.idTokenClaims?.roles?.includes("Admin") ?? false;
  const isInstructor = !isAdmin && (staffAccount?.idTokenClaims?.roles?.includes("Instructor") ?? false);
  const isStaff = !!staffAccount;

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [students, setStudents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [deliveryLocations, setDeliveryLocations] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [showSignInSelector, setShowSignInSelector] = useState(false);

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (e) {
      if (e?.errorCode === "interaction_in_progress") {
        await instance.clearCache();
        await instance.loginPopup(loginRequest).catch(() => {});
      }
    }
  };

  const openSignIn = () => setShowSignInSelector(true);

  const handleStaffLogin = async () => {
    const finalize = (account) => {
      setStaffAccount(account);
      setShowSignInSelector(false);
      const roles = account?.idTokenClaims?.roles ?? [];
      if (roles.includes("Admin")) navigate("/admin");
      else if (roles.includes("Instructor")) navigate("/educator");
    };
    try {
      const result = await staffMsalInstance.loginPopup(staffLoginRequest);
      finalize(result.account);
    } catch (e) {
      if (e?.errorCode === "interaction_in_progress") {
        await staffMsalInstance.clearCache();
        const result = await staffMsalInstance.loginPopup(staffLoginRequest).catch(() => null);
        if (result) finalize(result.account);
      }
    }
  };

  const handleLogout = () => {
    setProfile(null);
    setProfileLoaded(false);
    if (staffAccount) {
      setStaffAccount(null);
      staffMsalInstance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
    } else {
      instance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetch(`/api/profile/${user.localAccountId}`)
        .then(r => r.json())
        .then(data => { setProfile(data); setProfileLoaded(true); })
        .catch(() => setProfileLoaded(true));
    } else {
      setProfileLoaded(false);
      setProfile(null);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    Promise.all([
      fetch("/api/vendors").then(r => r.json()),
      fetch("/api/courses").then(r => r.json()),
      fetch("/api/schedule").then(r => r.json()),
      fetch("/api/students").then(r => r.json()),
      fetch("/api/profiles").then(r => r.json()),
      fetch("/api/instructors").then(r => r.json()),
      fetch("/api/delivery-locations").then(r => r.json()),
      fetch("/api/enrollments").then(r => r.json()),
    ]).then(([v, c, s, st, p, ins, locs, enr]) => {
      setVendors(v);
      setCourses(c.map(normalizeCourse));
      setSchedule(s.map(normalizeSchedule));
      setStudents(st);
      setProfiles(p);
      setInstructors(ins);
      setDeliveryLocations(locs);
      setEnrollments(enr);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleEnroll = (course) => {
    if (!enrolledCourses.includes(course.id)) {
      setEnrolledCourses(prev => [...prev, course.id]);
    }
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/courses", label: "Courses" },
    { path: "/schedule", label: "Schedule" },
    { path: "/contact", label: "Contact" },
    { path: "/dashboard", label: "My Learning" },
    ...(isInstructor ? [{ path: "/educator", label: "My Portal" }] : []),
    ...(isAdmin ? [{ path: "/admin", label: "Admin ⚙️" }] : []),
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>Loading...</span>
    </div>
  );

  const showProfileGate = isAuthenticated && profileLoaded && !profile && location.pathname !== "/profile";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", color: "#1e293b", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .course-card { transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1); }
        .course-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        select option { background: #ffffff; color: #1e293b; }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        input, textarea, select { color: #1e293b !important; }
        input[type="date"], input[type="time"] { color-scheme: light; }
        .nav-link { position: relative; transition: all 0.2s ease; }
        .nav-link:hover { color: #e2e8f0 !important; background: rgba(255,255,255,0.06) !important; }
        .footer-link { transition: color 0.2s ease; }
        .footer-link:hover { color: #94a3b8 !important; }
      `}</style>

      {showSignInSelector && (
        <SignInSelector
          onStudentLogin={handleLogin}
          onStaffLogin={handleStaffLogin}
          onClose={() => setShowSignInSelector(false)}
        />
      )}

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", height: 68, gap: 40 }}>
          <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}>🖥️</div>
            <div>
              <div style={{ fontWeight: 800, color: "#f8fafc", fontSize: 16, lineHeight: 1.1, letterSpacing: -0.3 }}>TechBridge</div>
              <div style={{ fontWeight: 600, color: "#475569", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Institute</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 2, flex: 1, justifyContent: "center" }}>
            {navLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <button key={link.path} onClick={() => navigate(link.path)} className="nav-link" style={{
                  background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                  color: isActive ? "#60a5fa" : "#94a3b8",
                  border: "none", borderRadius: 8,
                  padding: "8px 16px", fontSize: 14, fontWeight: isActive ? 600 : 500, cursor: "pointer",
                  letterSpacing: -0.1,
                }}>{link.label}</button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            {enrolledCourses.length > 0 && (
              <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#60a5fa", fontWeight: 600 }}>
                {enrolledCourses.length} enrolled
              </div>
            )}
            {isStaff ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#fca5a5", fontWeight: 500 }}>
                  🛡️ {staffAccount?.name ?? staffAccount?.username ?? "Staff"}
                </div>
                <button onClick={handleLogout} style={{ background: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Sign Out
                </button>
              </div>
            ) : isAuthenticated ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div onClick={() => navigate("/profile")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#e2e8f0", fontWeight: 500, cursor: "pointer" }}>
                  👤 {profile ? `${profile.first_name} ${profile.last_name}` : (user?.name ?? "Student")}
                </div>
                <button onClick={handleLogout} style={{ background: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={openSignIn} style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.25)" }}>
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Views */}
      <main>
        {showProfileGate ? (
          <ProfileSetupView user={user} onSaved={(p) => { setProfile(p); navigate("/"); }} />
        ) : (
          <Routes>
            <Route path="/" element={<HomeView vendors={vendors} courses={courses} />} />
            <Route path="/courses" element={<CoursesView enrolledCourses={enrolledCourses} onEnroll={handleEnroll} vendors={vendors} courses={courses} />} />
            <Route path="/schedule" element={<ScheduleView schedule={schedule} courses={courses} />} />
            <Route path="/contact" element={<ContactView deliveryLocations={deliveryLocations} />} />
            <Route path="/register" element={
              isAuthenticated
                ? <RegisterView enrolledCourses={enrolledCourses} onEnroll={handleEnroll} courses={courses} />
                : <AuthWall onLogin={openSignIn} message="Sign in to register for courses." />
            } />
            <Route path="/dashboard" element={
              isAuthenticated
                ? <DashboardView enrolledCourses={enrolledCourses} courses={courses} user={user} profile={profile} />
                : <AuthWall onLogin={openSignIn} message="Sign in to access your dashboard." />
            } />
            <Route path="/admin" element={
              isAdmin
                ? <AdminView
                    courses={courses} vendors={vendors} schedule={schedule} students={students} profiles={profiles} instructors={instructors} deliveryLocations={deliveryLocations} enrollments={enrollments}
                    onDeleteProfile={(oid) => setProfiles(p => p.filter(x => x.entra_oid !== oid))}
                    onCourseAdd={(c) => setCourses(prev => [...prev, normalizeCourse(c)])}
                    onCourseUpdate={(c) => setCourses(prev => prev.map(x => x.id === c.id ? normalizeCourse(c) : x))}
                    onCourseDelete={(id) => setCourses(prev => prev.filter(x => x.id !== id))}
                    onLocationAdd={(loc) => setDeliveryLocations(prev => [...prev, loc])}
                    onLocationUpdate={(loc) => setDeliveryLocations(prev => prev.map(x => x.id === loc.id ? loc : x))}
                    onLocationDelete={(id) => setDeliveryLocations(prev => prev.filter(x => x.id !== id))}
                    onInstructorAdd={(i) => setInstructors(prev => [...prev, i])}
                    onInstructorUpdate={(i) => setInstructors(prev => prev.map(x => x.id === i.id ? i : x))}
                    onInstructorDeactivate={(id) => setInstructors(prev => prev.map(x => x.id === id ? { ...x, status: "Inactive" } : x))}
                    onEnrollmentAdd={(e) => setEnrollments(prev => [...prev, e])}
                    onEnrollmentRemove={(sid, cid) => setEnrollments(prev => prev.filter(e => !(e.student_id === sid && e.course_id === cid)))}
                    onScheduleAdd={(s) => setSchedule(prev => [...prev, s])}
                    onScheduleUpdate={(s) => setSchedule(prev => prev.map(x => x.id === s.id ? s : x))}
                    onScheduleDelete={(id) => setSchedule(prev => prev.filter(x => x.id !== id))}
                  />
                : <AuthWall onLogin={handleLogin} message="Admin access only. Sign in with an administrator account." />
            } />
            <Route path="/educator" element={
              isInstructor
                ? <EducatorPortalView staffAccount={staffAccount} instructors={instructors} courses={courses} enrollments={enrollments} schedule={schedule} onInstructorUpdate={(i) => setInstructors(prev => prev.map(x => x.id === i.id ? i : x))} />
                : <AuthWall onLogin={openSignIn} message="Educator access only. Sign in with your institution account." />
            } />
            <Route path="/profile" element={
              isAuthenticated
                ? <ProfileEditView user={user} profile={profile} onSaved={setProfile} />
                : <AuthWall onLogin={openSignIn} message="Sign in to view your profile." />
            } />
            <Route path="*" element={<HomeView vendors={vendors} courses={courses} />} />
          </Routes>
        )}
      </main>

      {/* Footer */}
      {location.pathname !== "/admin" && location.pathname !== "/educator" && (
        <footer style={{ background: "#0f172a", marginTop: 80 }}>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)" }} />
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 32px 48px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 48 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 12px rgba(59,130,246,0.2)" }}>🖥️</div>
                  <span style={{ fontWeight: 800, color: "#f8fafc", fontSize: 17, letterSpacing: -0.3 }}>TechBridge Institute</span>
                </div>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.8, maxWidth: 280 }}>Empowering careers in IT through industry-recognized certifications and hybrid learning.</p>
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 20, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Certifications</div>
                {vendors.map(v => <div key={v.id} className="footer-link" style={{ color: "#64748b", fontSize: 13, marginBottom: 10, cursor: "pointer" }}>{v.name}</div>)}
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 20, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Platform</div>
                {[
                  { label: "Course Catalog", path: "/courses" },
                  { label: "Class Schedule", path: "/schedule" },
                  { label: "My Learning", path: "/dashboard" },
                  { label: "Contact Us", path: "/contact" },
                ].map(l => (
                  <div key={l.label} className="footer-link" onClick={() => navigate(l.path)} style={{ color: "#64748b", fontSize: 13, marginBottom: 10, cursor: "pointer" }}>{l.label}</div>
                ))}
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 20, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Contact</div>
                <div style={{ color: "#64748b", fontSize: 13, lineHeight: 2 }}>
                  info@techbridge.edu<br />
                  +1 (555) 234-5678<br />
                  Mon–Fri 8am–6pm EST
                </div>
              </div>
            </div>
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span style={{ color: "#475569", fontSize: 12 }}>© 2026 TechBridge Institute. All rights reserved.</span>
              <span style={{ color: "#475569", fontSize: 12 }}>Powered by Microsoft 365 · Moodle · SkillJa · MS Teams</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
