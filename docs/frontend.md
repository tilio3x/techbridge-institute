# Frontend Architecture

Single-page React application built with Vite. All components live in `src/App.jsx` (3165 lines). No routing library — navigation managed via `useState`.

## Component Tree

```mermaid
graph TD
    App["App (main)"]
    App --> Nav["Navbar"]
    App --> SSM["SignInSelector Modal"]
    App --> Main["Main Views"]
    App --> Footer

    Main --> Home["HomeView"]
    Main --> Courses["CoursesView"]
    Main --> Schedule["ScheduleView"]
    Main --> Contact["ContactView"]
    Main --> Register["RegisterView"]
    Main --> Dashboard["DashboardView"]
    Main --> Educator["EducatorPortalView"]
    Main --> Admin["AdminView"]
    Main --> Profile["ProfileSetupView"]
    Main --> ProfileEdit["ProfileEditView"]

    Home --> CourseCard
    Home --> Badge
    Courses --> CourseCard
    Courses --> Chip

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

## Navigation Flow

```mermaid
stateDiagram-v2
    [*] --> home
    home --> courses: Browse Courses
    home --> register: Register Today
    courses --> register: Enroll Now
    home --> schedule
    home --> contact
    home --> dashboard: My Learning

    register --> dashboard: After enrollment

    state auth_check <<choice>>
    dashboard --> auth_check
    auth_check --> ProfileSetup: No profile
    auth_check --> DashboardView: Has profile
    ProfileSetup --> home: Profile saved

    home --> signin: Sign In
    signin --> student_auth: Student
    signin --> staff_auth: Staff
    staff_auth --> admin: Role = Admin
    staff_auth --> educator: Role = Instructor
```

## Views

| View | Nav Label | Auth Required | Role | Purpose |
|------|-----------|---------------|------|---------|
| HomeView | Home | No | — | Hero, vendor showcase, stats, integrations |
| CoursesView | Courses | No | — | Filterable course catalog |
| ScheduleView | Schedule | No | — | Class schedule table |
| ContactView | Contact | No | — | Contact form + Google Maps |
| RegisterView | Register | Yes | Student | 3-step enrollment wizard |
| DashboardView | My Learning | Yes | Student | Progress, certificates, quick links |
| EducatorPortalView | My Portal | Yes | Instructor | Instructor's courses, students, schedule, profile |
| AdminView | Admin | Yes | Admin | Full CRUD admin console |
| ProfileSetupView | — | Yes | Student | First-time profile creation (gate) |
| ProfileEditView | — | Yes | Student | Edit existing profile |

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
        App->>U: Redirect to AdminView
    else roles includes "Instructor"
        App->>U: Redirect to EducatorPortalView
    end
```

## State Management

All state lives in the main `App` component via `useState`:

| State | Type | Source | Used by |
|-------|------|--------|---------|
| view | string | User navigation | All (conditional rendering) |
| vendors | array | GET /api/vendors | CoursesView, AdminView |
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

## Design System

- **Theme:** Dark (`#0a0f1e` background, `#f1f5f9` text)
- **Primary gradient:** `linear-gradient(135deg, #0ea5e9, #6366f1)` (cyan → indigo)
- **Success:** `#22c55e` | **Warning:** `#ef4444` | **Info:** `#0ea5e9`
- **Font:** Segoe UI, system-ui, sans-serif
- **Styling:** Inline JSX styles (no CSS files or framework)
