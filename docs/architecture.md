# Architecture Overview

TechBridge Institute is an IT vocational training platform built as a React SPA with an Express API backend, PostgreSQL database, and Azure cloud services.

## System Architecture

```mermaid
graph TB
    subgraph Client["Browser"]
        SPA["React SPA<br/>Vite + React 18"]
        MSAL["MSAL.js<br/>Auth Library"]
    end

    subgraph Azure["Azure Cloud"]
        subgraph AppService["Azure App Service"]
            Express["Express API<br/>Node.js 24"]
            Static["Static File Server<br/>dist/"]
        end
        ACS["Azure Communication<br/>Services (Email)"]
        EntraCIAM["Entra External ID<br/>Student Auth"]
        EntraStaff["Entra ID<br/>Staff Auth<br/>(tidisoft.com)"]
        PG["Azure PostgreSQL<br/>Flexible Server"]
    end

    SPA -->|"API calls"| Express
    SPA -->|"Static assets"| Static
    MSAL -->|"Student login"| EntraCIAM
    MSAL -->|"Staff login"| EntraStaff
    Express -->|"SQL queries"| PG
    Express -->|"Send emails"| ACS
    Express -->|"Graph API"| EntraCIAM
    Express -->|"Graph API"| EntraStaff
```

## Request Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant E as Express API
    participant DB as PostgreSQL
    participant ACS as Email Service
    participant Entra as Entra ID

    B->>E: GET /api/courses
    E->>DB: SELECT courses with joins
    DB-->>E: Course rows
    E-->>B: JSON response

    B->>E: POST /api/enrollments
    E->>DB: INSERT enrollment
    E->>DB: UPDATE course enrolled count
    E->>ACS: Send confirmation email (async)
    ACS-->>B: Email delivered
    E-->>B: { success: true }

    B->>Entra: Login popup (MSAL)
    Entra-->>B: ID token + claims
    B->>E: POST /api/profile (with entra_oid)
    E->>DB: UPSERT student profile
    E->>Entra: Update display name (Graph API)
    E->>ACS: Send welcome email (if new)
    E-->>B: Profile data
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite 7 | SPA with inline styles |
| Backend | Express 5 (Node.js 24) | REST API |
| Database | PostgreSQL (pg) | Relational data store |
| Auth | MSAL.js + Entra ID | Student CIAM + Staff corporate |
| Email | Azure Communication Services | Transactional emails |
| CI/CD | GitHub Actions | Build, test, deploy |
| Hosting | Azure App Service | Production + staging slots |
| Domain | techbridge.academy | GoDaddy DNS → Azure |

## Key Design Decisions

- **Monolithic SPA**: All views in a single `App.jsx` — simple to deploy, trades off code organization
- **No routing library**: Client-side navigation via `useState("view")` — lightweight, no URL sync
- **Inline styles**: No CSS framework — consistent dark theme, but harder to maintain at scale
- **Dual auth tenants**: Student CIAM (Entra External ID) separate from staff corporate (tidisoft.com Entra ID)
- **Fire-and-forget emails**: Email sends are async and don't block API responses
- **Soft deletes**: Instructors and locations use status/is_active flags instead of hard deletes
