# Database Schema

PostgreSQL hosted on Azure. Connection via `DATABASE_URL` environment variable with SSL enabled.

## Entity Relationship Diagram

```mermaid
erDiagram
    vendors ||--o{ courses : "has"
    courses ||--o{ schedule : "has"
    courses ||--o{ enrollments : "has"
    students ||--o{ enrollments : "enrolled in"
    instructors ||--o| courses : "teaches"
    delivery_locations ||--o| courses : "hosted at"
    delivery_locations ||--o| schedule : "held at"

    vendors {
        varchar id PK "comptia, microsoft, etc."
        varchar name
        varchar color "hex color"
        varchar logo "emoji"
    }

    courses {
        serial id PK
        varchar vendor_id FK
        varchar code "CompTIA A+"
        varchar title
        varchar level "Beginner|Intermediate|Advanced"
        varchar duration "10 weeks"
        integer price
        integer seats
        integer enrolled "default 0"
        varchar delivery "Online|Hybrid|In-Person"
        date next_start
        text description
        varchar badge "Hot|New|Core"
        integer instructor_id FK
        integer delivery_location_id FK
    }

    instructors {
        serial id PK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar phone
        varchar title
        text bio
        text_arr specializations
        text_arr certifications
        varchar employment_type "Full-time|Part-time|Contractor"
        varchar status "Active|Inactive|On Leave"
        date hire_date
        varchar entra_oid UK "Entra staff account"
        timestamptz created_at
        timestamptz updated_at
    }

    delivery_locations {
        serial id PK
        varchar name
        varchar type "Physical|Online|Hybrid"
        varchar address_line1
        varchar city
        varchar country_code
        varchar country_name
        integer capacity
        varchar platform
        varchar timezone "IANA timezone"
        varchar contact_name
        varchar contact_email
        boolean is_active "default true"
        timestamptz created_at
    }

    schedule {
        serial id PK
        integer course_id FK
        varchar day "Mon/Wed"
        varchar time "09:00 - 12:00"
        varchar instructor
        varchar room
        varchar type "Online|Hybrid|In-Person"
        integer delivery_location_id FK
    }

    students {
        varchar id PK "STU-001"
        varchar name
        varchar email UK
        date joined
    }

    enrollments {
        varchar student_id PK_FK
        integer course_id PK_FK
        integer progress "0-100"
        boolean certified "default false"
    }

    student_profiles {
        serial id PK
        varchar entra_oid UK "Entra External ID"
        varchar first_name
        varchar last_name
        varchar email
        varchar country_code
        varchar country_name
        varchar city
        varchar phone
        date date_of_birth
        varchar education
        text goals
        timestamptz created_at
        timestamptz updated_at
    }

    contact_inquiries {
        serial id PK
        varchar name
        varchar email
        varchar phone
        varchar subject "General|Enrollment|Partnership|Support"
        text message
        timestamptz created_at
    }
```

## Tables Summary

| Table | Records | Purpose |
|-------|---------|---------|
| vendors | 5 | CompTIA, Microsoft, Fortinet, Ubiquiti, Cisco |
| courses | 11 | IT certification courses |
| schedule | 6 | Class schedule entries |
| students | 3 | Legacy student records |
| enrollments | 5 | Student-course enrollments with progress |
| instructors | dynamic | Teaching staff with Entra accounts |
| delivery_locations | dynamic | Physical/online training venues |
| student_profiles | dynamic | Entra-linked student profiles |
| contact_inquiries | dynamic | Contact form submissions |

## Migrations

Run migrations via: `node scripts/run_migration.mjs scripts/<filename>.sql`

| File | Table | Notes |
|------|-------|-------|
| techbridgedatasql.sql | vendors, courses, schedule, students, enrollments | Main schema + seed data |
| add_instructors.sql | instructors | With indexes and updated_at trigger |
| add_delivery_locations.sql | delivery_locations | With indexes and updated_at trigger |
| add_instructor_to_courses.sql | courses | Adds instructor_id and delivery_location_id columns |
| add_student_profiles.sql | student_profiles | Entra-linked profiles |
| add_contact_inquiries.sql | contact_inquiries | Contact form storage |

## Indexes

- `idx_instructors_status` on instructors(status)
- `idx_delivery_locations_country` on delivery_locations(country_code)
- `idx_delivery_locations_active` on delivery_locations(is_active)
