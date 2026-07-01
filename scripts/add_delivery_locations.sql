-- ─── DELIVERY LOCATIONS TABLE ────────────────────────────────────────────────

CREATE TABLE delivery_locations (
  id                SERIAL        PRIMARY KEY,
  name              VARCHAR(150)  NOT NULL,                -- e.g. "Bamako Training Centre – Lab A"
  type              VARCHAR(20)   NOT NULL DEFAULT 'Physical'
                    CHECK (type IN ('Physical', 'Online', 'Hybrid')),
  -- Address
  address_line1     VARCHAR(200),
  address_line2     VARCHAR(200),
  city              VARCHAR(100),
  state_province    VARCHAR(100),
  country_code      VARCHAR(5),                            -- ISO 3166-1 alpha-2, e.g. 'ML', 'FR', 'US'
  country_name      VARCHAR(100),
  postal_code       VARCHAR(20),
  -- Room details
  room_number       VARCHAR(50),                           -- e.g. "Lab A", "Room 204", "B2-017"
  floor             VARCHAR(20),                           -- e.g. "Ground", "2nd"
  building          VARCHAR(100),                          -- e.g. "West Wing", "ICT Block"
  capacity          INTEGER,                               -- max number of seats/participants
  -- Online / hybrid details
  platform          VARCHAR(100),                          -- e.g. "Microsoft Teams", "Zoom", "Moodle"
  meeting_url       VARCHAR(500),                          -- standing room/meeting link if applicable
  -- Facilities
  facilities        TEXT[],                                -- e.g. ARRAY['Projector','Whiteboard','Lab PCs','Video Conferencing','AC']
  timezone          VARCHAR(60)   NOT NULL DEFAULT 'UTC',  -- IANA tz, e.g. 'Africa/Bamako', 'Europe/Paris'
  -- Venue contact
  contact_name      VARCHAR(100),
  contact_email     VARCHAR(150),
  contact_phone     VARCHAR(30),
  -- Meta
  notes             TEXT,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_locations_country ON delivery_locations (country_code);
CREATE INDEX idx_delivery_locations_active  ON delivery_locations (is_active);

CREATE TRIGGER delivery_locations_updated_at
  BEFORE UPDATE ON delivery_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── LINK TO COURSES ──────────────────────────────────────────────────────────
-- Primary delivery location for a course (nullable — existing courses unaffected)
ALTER TABLE courses
  ADD COLUMN delivery_location_id INTEGER REFERENCES delivery_locations(id) ON DELETE SET NULL;

-- ─── LINK TO SCHEDULE ────────────────────────────────────────────────────────
-- Each session slot can override the course-level location (e.g. lab rotations)
ALTER TABLE schedule
  ADD COLUMN delivery_location_id INTEGER REFERENCES delivery_locations(id) ON DELETE SET NULL;
