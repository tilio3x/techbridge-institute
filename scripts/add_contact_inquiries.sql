CREATE TABLE IF NOT EXISTS contact_inquiries (
  id          SERIAL       PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(200) NOT NULL,
  phone       VARCHAR(30),
  subject     VARCHAR(50)  NOT NULL CHECK (subject IN ('General Inquiry', 'Enrollment', 'Partnership', 'Technical Support')),
  message     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
