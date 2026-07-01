-- ─── INSTRUCTORS TABLE ───────────────────────────────────────────────────────

CREATE TABLE instructors (
  id                SERIAL        PRIMARY KEY,
  first_name        VARCHAR(100)  NOT NULL,
  last_name         VARCHAR(100)  NOT NULL,
  email             VARCHAR(150)  NOT NULL UNIQUE,
  phone             VARCHAR(30),
  title             VARCHAR(100),                          -- e.g. "Senior Instructor", "Lead Trainer"
  bio               TEXT,                                  -- short public-facing biography
  specializations   TEXT[],                                -- e.g. ARRAY['Azure','CompTIA','Security']
  certifications    TEXT[],                                -- e.g. ARRAY['AZ-104','Security+','CCNA']
  employment_type   VARCHAR(20)   NOT NULL DEFAULT 'Full-time'
                    CHECK (employment_type IN ('Full-time', 'Part-time', 'Contractor')),
  status            VARCHAR(20)   NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active', 'Inactive', 'On Leave')),
  hire_date         DATE,
  photo_url         VARCHAR(300),                          -- profile photo (Azure Blob or external URL)
  linkedin_url      VARCHAR(300),
  available_days    TEXT[],                                -- e.g. ARRAY['Monday','Wednesday','Friday']
  available_hours   VARCHAR(50),                           -- e.g. '09:00–17:00' or '09:00–12:00, 14:00–17:00'
  availability_note TEXT,                                  -- free-text override e.g. 'Evenings only during Ramadan'
  entra_oid         VARCHAR(100)  UNIQUE,                  -- links instructor to Entra External ID account
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by status (e.g. listing only active instructors)
CREATE INDEX idx_instructors_status ON instructors (status);

-- Trigger to auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instructors_updated_at
  BEFORE UPDATE ON instructors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
