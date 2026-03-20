# TechBridge Institute — Project Roadmap

## ✅ Completed

### Infrastructure & DevOps
- [x] React + Vite frontend scaffold
- [x] Express backend API (`/api/vendors`, `/api/courses`, `/api/schedule`, `/api/students`)
- [x] Azure Database for PostgreSQL (Flexible Server) provisioned
- [x] Database schema — `vendors`, `courses`, `schedule`, `students`, `enrollments`
- [x] Seed data loaded into the database
- [x] CI/CD pipeline via GitHub Actions → Azure App Service
- [x] Express server serves both API and React build in production
- [x] Environment variables (`DATABASE_URL`, `NODE_ENV`) configured on Azure
- [x] `DATABASE_URL` special character encoding fixed on Azure App Service

### Frontend Features
- [x] Home page with hero, vendor cards, integrations section
- [x] Course catalog with vendor / level / delivery filters
- [x] Class schedule table
- [x] Student registration form (3-step wizard)
- [x] Student dashboard (demo — Maria Santos)
- [x] Admin panel (overview, students, courses, schedule, integrations tabs)
- [x] Live data from PostgreSQL (vendors, courses, schedule, students)

---

## 🔄 In Progress

---

## 🗓️ Planned Features

### Authentication & Security
- [ ] Student login / logout (JWT or session-based)
- [ ] Admin login with role-based access control
- [ ] Protect admin routes from unauthenticated access
- [ ] Password reset flow

### Student Features
- [ ] Real enrollment — persist to `enrollments` table when student registers
- [ ] Student portal shows real enrolled courses from DB
- [ ] Real progress tracking per course
- [ ] Certificate download (PDF generation)
- [ ] Student profile page (edit name, email, photo)

### Admin Features
- [ ] Add / edit / delete courses from Admin panel
- [ ] Add / edit / delete students from Admin panel
- [ ] View real enrollment counts per course
- [ ] Export student list to CSV
- [ ] Dashboard stats pulled from live DB data

### Notifications
- [ ] Confirmation email on registration
- [ ] Reminder emails before course start date
- [ ] Microsoft 365 account provisioning notification

### Payments
- [ ] Course fee payment integration (Stripe or PayPal)
- [ ] Invoice generation on enrollment
- [ ] Payment status tracking

### Reporting
- [ ] Enrollment trends chart (Admin)
- [ ] Course completion rate report
- [ ] Revenue report

### Infrastructure
- [ ] Custom domain + SSL certificate
- [ ] Azure CDN for static assets
- [ ] Automated database backups verification
- [ ] Application monitoring (Azure Application Insights)
