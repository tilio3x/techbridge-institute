# Frontend Architecture

Modular React SPA built with Vite, React Router, and Tailwind CSS v4. Views are split into individual files under `src/views/`, shared components under `src/components/`, and utilities under `src/utils/`.

## File Structure

```
src/
  App.jsx                    # Routing shell — navbar, routes, footer (~220 lines)
  main.jsx                   # BrowserRouter + MsalProvider + CSS import
  index.css                  # Tailwind CSS base + custom dark theme (@theme)
  api/client.js              # Centralized fetch wrapper with namespaced methods
  auth/msalConfig.js         # Dual MSAL configs (student CIAM + staff corporate)
  components/                # Shared UI (Tailwind CSS classes)
  utils/                     # Constants, normalizers
  views/                     # One file per route (10 views)
```

## Component Tree

```mermaid
graph TD
    Main["main.jsx<br/>BrowserRouter + MsalProvider"]
    Main --> App["App.jsx<br/>Routing Shell"]

    App --> Nav["Navbar"]
    App --> SSM["SignInSelector<br/>src/components/"]
    App --> Router["React Router<br/>Routes"]
    App --> Footer

    Router --> Home["HomeView<br/>src/views/"]
    Router --> Courses["CoursesView"]
    Router --> Schedule["ScheduleView"]
    Router --> Contact["ContactView"]
    Router --> Register["RegisterView"]
    Router --> Dashboard["DashboardView"]
    Router --> Educator["EducatorPortalView"]
    Router --> Admin["AdminView"]
    Router --> Profile["ProfileSetupView"]
    Router --> ProfileEdit["ProfileEditView"]

    Home --> CourseCard["CourseCard<br/>src/components/"]
    Courses --> CourseCard
    CourseCard --> Badge["Badge"]
    CourseCard --> Chip["Chip"]
    Schedule --> Chip

    Admin --> AdminOverview["Overview Tab"]
    Admin --> AdminStudents["Students Tab"]
    Admin --> AdminCourses["Courses Tab"]
    Admin --> AdminLocations["Locations Tab"]
    Admin --> AdminInstructors["Instructors Tab"]
    Admin --> AdminEnrollments["Enrollments Tab"]
    Admin --> AdminSchedule["Schedule Tab"]

    Educator --> EduCourses["Courses Tab"]
    Educator --> EduStudents["Students Tab"]
    Educator --> EduSchedule["Schedule Tab"]
    Educator --> EduProfile["My Profile Tab"]
```

## Routing

React Router DOM provides URL-based navigation. Routes are defined in `App.jsx`:

| Path | View | Auth | Role | Purpose |
|------|------|------|------|---------|
| `/` | HomeView | No | — | Hero, vendor showcase, stats, integrations |
| `/courses` | CoursesView | No | — | Catalog landing with provider cards |
| `/courses/:vendorId` | VendorCoursesView | No | — | Paginated vendor course listing with filters |
| `/courses/:vendorId/:courseId` | CourseDetailView | No | — | Course detail: stats bar, skills, syllabus, details table |
| `/schedule` | ScheduleView | No | — | Class schedule table |
| `/contact` | ContactView | No | — | Contact form + Google Maps |
| `/register` | RegisterView | Yes | Student | 3-step enrollment wizard |
| `/dashboard` | DashboardView | Yes | Student | Progress, certificates, quick links |
| `/educator` | EducatorPortalView | Yes | Instructor | Instructor's courses, students, schedule, profile |
| `/admin` | AdminView | Yes | Admin | Full CRUD admin console |
| `/profile` | ProfileEditView | Yes | Student | Edit existing profile |
| `*` | HomeView | No | — | Catch-all fallback |

Protected routes show `AuthWall` if the user isn't authenticated or lacks the required role.

## Navigation Flow

```mermaid
stateDiagram-v2
    [*] --> /
    / --> /courses: Browse Courses
    / --> /register: Register Today
    /courses --> /register: Enroll Now
    / --> /schedule
    / --> /contact
    / --> /dashboard: My Learning

    /register --> /dashboard: After enrollment

    state auth_check <<choice>>
    /dashboard --> auth_check
    auth_check --> ProfileSetup: No profile
    auth_check --> DashboardView: Has profile
    ProfileSetup --> /: Profile saved

    / --> signin: Sign In
    signin --> student_auth: Student
    signin --> staff_auth: Staff
    staff_auth --> /admin: Role = Admin
    staff_auth --> /educator: Role = Instructor
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as React App
    participant MSAL as MSAL.js
    participant CIAM as Entra External ID
    participant Staff as Entra ID (tidisoft.com)
    participant API as Express API

    Note over U,App: Student Login
    U->>App: Click "Student Sign In"
    App->>MSAL: loginPopup(studentScopes)
    MSAL->>CIAM: Auth redirect
    CIAM-->>MSAL: ID token
    MSAL-->>App: Account + claims
    App->>API: GET /api/profile/{oid}
    alt No profile exists
        App->>U: Show ProfileSetupView
        U->>API: POST /api/profile
        API-->>U: Profile created + welcome email
    end

    Note over U,App: Staff Login
    U->>App: Click "Educator/Admin Sign In"
    App->>MSAL: staffMsalInstance.loginPopup()
    MSAL->>Staff: Auth redirect
    Staff-->>MSAL: ID token with roles claim
    MSAL-->>App: staffAccount + roles
    alt roles includes "Admin"
        App->>U: navigate("/admin")
    else roles includes "Instructor"
        App->>U: navigate("/educator")
    end
```

## State Management

All state lives in `App.jsx` via `useState` and is passed as props to views:

| State | Type | Source | Used by |
|-------|------|--------|---------|
| vendors | array | GET /api/vendors | HomeView, CoursesView, AdminView, Footer |
| courses | array | GET /api/courses | Most views |
| schedule | array | GET /api/schedule | ScheduleView, AdminView, EducatorPortal |
| students | array | GET /api/students | AdminView |
| profiles | array | GET /api/profiles | AdminView |
| instructors | array | GET /api/instructors | AdminView, EducatorPortal |
| deliveryLocations | array | GET /api/delivery-locations | AdminView, ContactView |
| enrollments | array | GET /api/enrollments | AdminView, EducatorPortal |
| enrolledCourses | array | Local state | CoursesView, RegisterView, DashboardView |
| profile | object | GET /api/profile/:oid | DashboardView, ProfileEditView |
| loading | boolean | — | Loading screen |

## Shared Components

Located in `src/components/`, styled with Tailwind CSS:

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| AuthWall | AuthWall.jsx | onLogin, message | Auth gate with sign-in button |
| Badge | Badge.jsx | text | Course badge (Hot/New/Core) with color mapping |
| Chip | Chip.jsx | text, color | Colored tag with dynamic background |
| CourseCard | CourseCard.jsx | course, onEnroll, isEnrolled | Course catalog card |
| SignInSelector | SignInSelector.jsx | onStudentLogin, onStaffLogin, onClose | 3-card sign-in modal |

## API Client

`src/api/client.js` provides a centralized fetch wrapper:

```js
import { api } from "../api/client";

// Namespaced methods
api.vendors.list()
api.courses.create(data)
api.courses.update(id, data)
api.courses.remove(id)
api.profiles.get(oid)
api.profiles.save(data)
api.contact.submit(data)
```

## Design System

- **Theme:** Dark (`#0a0f1e` background, `#f1f5f9` text)
- **Primary gradient:** `linear-gradient(135deg, #0ea5e9, #6366f1)` (sky → indigo)
- **Success:** `#22c55e` | **Warning:** `#ef4444` | **Info:** `#0ea5e9`
- **Font:** Segoe UI, system-ui, sans-serif
- **Styling:** Tailwind CSS v4 (shared components) + inline styles (views, incremental migration)
- **Tailwind config:** Via `@theme` directive in `src/index.css` (no `tailwind.config.js`)
- **Custom colors:** `dark-bg`, `dark-card`, `dark-surface`, `dark-border`
