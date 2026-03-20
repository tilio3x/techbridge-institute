-- ─── STUDENT PROFILES TABLE ──────────────────────────────────────────────────

CREATE TABLE student_profiles (
  id            SERIAL       PRIMARY KEY,
  entra_oid     VARCHAR(100) NOT NULL UNIQUE,   -- Entra External ID object ID
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  country_code  VARCHAR(5)   NOT NULL,
  country_name  VARCHAR(100) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  phone         VARCHAR(30),
  date_of_birth DATE,
  education     VARCHAR(100),
  goals         TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);
