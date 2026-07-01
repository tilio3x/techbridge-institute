-- Link courses to instructors (nullable — existing courses won't break)
ALTER TABLE courses
  ADD COLUMN instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL;
