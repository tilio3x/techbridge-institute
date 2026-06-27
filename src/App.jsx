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
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 16 }}>
      Loading...
    </div>
  );

  const showProfileGate = isAuthenticated && profileLoaded && !profile && location.pathname !== "/profile";

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", color: "#1e293b", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .course-card:hover { transform: translateY(-4px); border-color: rgba(14,165,233,0.3) !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        select option { background: #ffffff; color: #1e293b; }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
        input, textarea, select { color: #1e293b !important; }
        input[type="date"], input[type="time"] { color-scheme: light; }
      `}</style>

      {showSignInSelector && (
        <SignInSelector
          onStudentLogin={handleLogin}
          onStaffLogin={handleStaffLogin}
          onClose={() => setShowSignInSelector(false)}
        />
      )}

      {/* Navbar — stays dark as accent */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 64, gap: 32 }}>
          <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🖥️</div>
            <div>
              <div style={{ fontWeight: 900, color: "#f1f5f9", fontSize: 15, lineHeight: 1.1 }}>TechBridge</div>
              <div style={{ fontWeight: 600, color: "#64748b", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Institute</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
            {navLinks.map(link => (
              <button key={link.path} onClick={() => navigate(link.path)} style={{
                background: location.pathname === link.path ? "rgba(14,165,233,0.12)" : "transparent",
                color: location.pathname === link.path ? "#0ea5e9" : "#94a3b8",
                border: "none", borderRadius: 10,
                padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                borderBottom: location.pathname === link.path ? "2px solid #0ea5e9" : "2px solid transparent",
              }}>{link.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {enrolledCourses.length > 0 && (
              <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#0ea5e9", fontWeight: 700 }}>
                {enrolledCourses.length} enrolled
              </div>
            )}
            {isStaff ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "7px 14px", fontSize: 13, color: "#fca5a5", fontWeight: 600 }}>
                  🛡️ {staffAccount?.name ?? staffAccount?.username ?? "Staff"}
                </div>
                <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Sign Out
                </button>
              </div>
            ) : isAuthenticated ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div onClick={() => navigate("/profile")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "7px 14px", fontSize: 13, color: "#e2e8f0", fontWeight: 600, cursor: "pointer" }}>
                  👤 {profile ? `${profile.first_name} ${profile.last_name}` : (user?.name ?? "Student")}
                </div>
                <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={openSignIn} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
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

      {/* Footer — stays dark as accent */}
      {location.pathname !== "/admin" && location.pathname !== "/educator" && (
        <footer style={{ background: "#0f172a", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px", marginTop: 60 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>🖥️</div>
                <span style={{ fontWeight: 900, color: "#f1f5f9" }}>TechBridge Institute</span>
              </div>
              <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7 }}>Empowering careers in IT through industry-recognized certifications and hybrid learning.</p>
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Certifications</div>
              {vendors.map(v => <div key={v.id} style={{ color: "#64748b", fontSize: 13, marginBottom: 6 }}>{v.name}</div>)}
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Platform</div>
              {["Course Catalog", "Class Schedule", "Student Portal", "Certifications", "Admin Console"].map(l => (
                <div key={l} style={{ color: "#64748b", fontSize: 13, marginBottom: 6, cursor: "pointer" }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Contact</div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.8 }}>
                info@techbridge.edu<br />
                +1 (555) 234-5678<br />
                Mon–Fri 8am–6pm EST
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 1100, margin: "32px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: "#475569", fontSize: 12 }}>© 2026 TechBridge Institute. All rights reserved.</span>
            <span style={{ color: "#475569", fontSize: 12 }}>Powered by Microsoft 365 · Moodle · SkillJa · MS Teams</span>
          </div>
        </footer>
      )}
    </div>
  );
}
