
-- ─── SCHEMA ───────────────────────────────────────────────────────────────────

CREATE TABLE vendors (
  id        VARCHAR(50)  PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  color     VARCHAR(7)   NOT NULL,
  logo      VARCHAR(10)  NOT NULL
);

CREATE TABLE courses (
  id          SERIAL       PRIMARY KEY,
  vendor_id   VARCHAR(50)  NOT NULL REFERENCES vendors(id),
  code        VARCHAR(50)  NOT NULL,
  title       VARCHAR(200) NOT NULL,
  level       VARCHAR(20)  NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  duration    VARCHAR(20)  NOT NULL,
  price       INTEGER      NOT NULL,
  seats       INTEGER      NOT NULL,
  enrolled    INTEGER      NOT NULL DEFAULT 0,
  delivery    VARCHAR(20)  NOT NULL CHECK (delivery IN ('Online', 'Hybrid', 'In-Person')),
  next_start  DATE         NOT NULL,
  description TEXT         NOT NULL,
  badge       VARCHAR(20)  DEFAULT ''
);

CREATE TABLE schedule (
  id          SERIAL       PRIMARY KEY,
  course_id   INTEGER      NOT NULL REFERENCES courses(id),
  day         VARCHAR(50)  NOT NULL,
  time        VARCHAR(30)  NOT NULL,
  instructor  VARCHAR(100) NOT NULL,
  room        VARCHAR(100) NOT NULL,
  type        VARCHAR(20)  NOT NULL
);

CREATE TABLE students (
  id      VARCHAR(20)  PRIMARY KEY,
  name    VARCHAR(100) NOT NULL,
  email   VARCHAR(150) NOT NULL UNIQUE,
  joined  DATE         NOT NULL
);

CREATE TABLE enrollments (
  student_id  VARCHAR(20) NOT NULL REFERENCES students(id),
  course_id   INTEGER     NOT NULL REFERENCES courses(id),
  progress    INTEGER     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  certified   BOOLEAN     NOT NULL DEFAULT FALSE,
  PRIMARY KEY (student_id, course_id)
);

-- ─── SEED DATA ────────────────────────────────────────────────────────────────

-- Vendors
INSERT INTO vendors (id, name, color, logo) VALUES
  ('comptia',   'CompTIA',  '#e8320a', '🔴'),
  ('microsoft', 'Microsoft','#00a4ef', '🔷'),
  ('fortinet',  'Fortinet', '#ee3124', '🛡️'),
  ('ubiquiti',  'Ubiquiti', '#0559c9', '📡'),
  ('cisco',     'Cisco',    '#1ba0d7', '🌐');

-- Courses
INSERT INTO courses (id, vendor_id, code, title, level, duration, price, seats, enrolled, delivery, next_start, description, badge) VALUES
  (1,  'comptia',   'CompTIA A+',      'IT Fundamentals & Hardware',      'Beginner',     '10 weeks', 1200, 20, 14, 'Hybrid',    '2026-04-07', 'Master PC hardware, software, networking and troubleshooting. The industry-standard entry-level IT certification.', 'Core'),
  (2,  'comptia',   'CompTIA Network+','Networking Fundamentals',          'Intermediate', '8 weeks',  1100, 18, 11, 'Online',    '2026-04-14', 'Network architecture, protocols, security and troubleshooting for IT professionals.', 'Core'),
  (3,  'comptia',   'CompTIA Security+','Cybersecurity Essentials',        'Intermediate', '10 weeks', 1300, 20, 18, 'Hybrid',    '2026-05-05', 'Threat management, cryptography, identity management and risk mitigation skills.', 'Hot'),
  (4,  'microsoft', 'AZ-900',          'Azure Cloud Fundamentals',         'Beginner',     '6 weeks',   950, 24,  9, 'Online',    '2026-04-07', 'Cloud concepts, Azure core services, pricing and support fundamentals.', 'New'),
  (5,  'microsoft', 'MS-900',          'Microsoft 365 Fundamentals',       'Beginner',     '4 weeks',   750, 24, 20, 'Hybrid',    '2026-03-31', 'M365 productivity services, security, compliance and licensing options.', ''),
  (6,  'microsoft', 'SC-900',          'Security, Compliance & Identity',  'Beginner',     '5 weeks',   850, 20,  7, 'Online',    '2026-04-21', 'Fundamentals of security, compliance and identity with Microsoft services.', ''),
  (7,  'fortinet',  'NSE 1-3',         'Network Security Awareness',       'Beginner',     '4 weeks',   800, 20, 12, 'Online',    '2026-04-07', 'Cybersecurity awareness, network infrastructure and firewall fundamentals.', ''),
  (8,  'fortinet',  'NSE 4',           'FortiGate Firewall Administration','Intermediate', '8 weeks',  1400, 16,  8, 'Hybrid',    '2026-05-12', 'FortiGate security gateway configuration, monitoring and management.', 'Hot'),
  (9,  'ubiquiti',  'UEWA',            'Enterprise Wireless Admin',        'Intermediate', '6 weeks',  1100, 16,  6, 'In-Person', '2026-04-28', 'UniFi wireless network design, deployment and enterprise management.', 'New'),
  (10, 'cisco',     'CCNA',            'Cisco Networking Associate',       'Intermediate', '12 weeks', 1600, 18, 15, 'Hybrid',    '2026-04-14', 'Routing, switching, security fundamentals and network automation with Cisco.', 'Hot'),
  (11, 'cisco',     'CCST',            'Cisco Cybersecurity Technician',   'Beginner',     '8 weeks',  1200, 20, 10, 'Online',    '2026-05-05', 'Entry-level cybersecurity skills including network defense and threat analysis.', '');

-- Schedule
INSERT INTO schedule (course_id, day, time, instructor, room, type) VALUES
  (1,  'Mon/Wed',     '09:00 – 12:00', 'Marcus Williams', 'Lab A + Teams',  'Hybrid'),
  (2,  'Tue/Thu',     '14:00 – 17:00', 'Sandra Lee',      'MS Teams',       'Online'),
  (3,  'Mon/Wed/Fri', '13:00 – 15:30', 'Darnell Jackson', 'Lab B + Teams',  'Hybrid'),
  (4,  'Tue/Thu',     '09:00 – 11:30', 'Priya Nair',      'MS Teams',       'Online'),
  (5,  'Mon/Wed',     '18:00 – 20:30', 'Chris Okafor',    'Lab A + Teams',  'Hybrid'),
  (10, 'Mon/Wed/Fri', '09:00 – 11:00', 'Elena Vasquez',   'Lab B + Teams',  'Hybrid');

-- Students
INSERT INTO students (id, name, email, joined) VALUES
  ('STU-001', 'Alex Thompson', 'a.thompson@traineeid.edu', '2026-01-15'),
  ('STU-002', 'Maria Santos',  'm.santos@traineeid.edu',   '2026-01-15'),
  ('STU-003', 'James Obi',     'j.obi@traineeid.edu',      '2026-02-01');

-- Enrollments
INSERT INTO enrollments (student_id, course_id, progress, certified) VALUES
  ('STU-001', 1,  72,  FALSE),
  ('STU-001', 2,  45,  FALSE),
  ('STU-002', 3,  100, TRUE),
  ('STU-002', 4,  88,  FALSE),
  ('STU-003', 10, 55,  FALSE);
