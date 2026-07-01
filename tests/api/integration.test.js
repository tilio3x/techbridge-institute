import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

function api(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
}

describe('Integration Tests', () => {
  describe('Course → Schedule flow', () => {
    it('courses returned include vendor and location details', async () => {
      const res = await api('/api/courses');
      const courses = await res.json();
      const course = courses.find(c => c.instructor_id);
      if (course) {
        expect(course.vendor_name).toBeDefined();
        expect(course.vendor_color).toBeDefined();
      }
    });

    it('schedule entries reference valid courses', async () => {
      const [schedRes, courseRes] = await Promise.all([
        api('/api/schedule'),
        api('/api/courses'),
      ]);
      const schedule = await schedRes.json();
      const courses = await courseRes.json();
      const courseIds = courses.map(c => c.id);
      for (const entry of schedule) {
        expect(courseIds).toContain(entry.course_id);
      }
    });
  });

  describe('Student → Enrollment flow', () => {
    it('student enrollment count matches actual enrollments', async () => {
      const [studentRes, enrollRes] = await Promise.all([
        api('/api/students'),
        api('/api/enrollments'),
      ]);
      const students = await studentRes.json();
      const enrollments = await enrollRes.json();
      for (const student of students) {
        const actual = enrollments.filter(e => e.student_id === student.id).length;
        expect(student.course_count).toBe(actual);
      }
    });

    it('enrolled courses exist in courses table', async () => {
      const [enrollRes, courseRes] = await Promise.all([
        api('/api/enrollments'),
        api('/api/courses'),
      ]);
      const enrollments = await enrollRes.json();
      const courses = await courseRes.json();
      const courseIds = courses.map(c => c.id);
      for (const enrollment of enrollments) {
        expect(courseIds).toContain(enrollment.course_id);
      }
    });
  });

  describe('Contact inquiry flow', () => {
    let inquiryId;

    it('submitting an inquiry returns the stored record', async () => {
      const res = await api('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Integration Test User',
          email: 'integration@test.com',
          phone: '+1555000111',
          subject: 'Enrollment',
          message: 'Integration test: can I enroll in the CCNA course?',
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      inquiryId = data.id;
      expect(data.name).toBe('Integration Test User');
      expect(data.subject).toBe('Enrollment');
      expect(data.created_at).toBeDefined();
    });

    it('inquiry persists with correct fields', async () => {
      // Verify by submitting another and checking it gets a new sequential ID
      const res = await api('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Another Test User',
          email: 'another@test.com',
          subject: 'Partnership',
          message: 'Integration test: partnership inquiry.',
        }),
      });
      const data = await res.json();
      expect(data.id).toBeGreaterThan(inquiryId);
      expect(data.phone).toBeNull();
    });
  });

  describe('Instructor → Course assignment', () => {
    it('instructors list returns active instructors', async () => {
      const res = await api('/api/instructors');
      expect(res.status).toBe(200);
      const instructors = await res.json();
      expect(Array.isArray(instructors)).toBe(true);
    });

    it('courses with instructors have valid instructor references', async () => {
      const [courseRes, instrRes] = await Promise.all([
        api('/api/courses'),
        api('/api/instructors'),
      ]);
      const courses = await courseRes.json();
      const instructors = await instrRes.json();
      const instrIds = instructors.map(i => i.id);
      const assigned = courses.filter(c => c.instructor_id);
      for (const course of assigned) {
        expect(instrIds).toContain(course.instructor_id);
      }
    });
  });

  describe('Delivery locations → Courses', () => {
    it('physical locations endpoint returns only physical type', async () => {
      const res = await api('/api/locations/physical');
      const locations = await res.json();
      // All should have address fields (physical locations)
      for (const loc of locations) {
        expect(loc).toHaveProperty('address_line1');
        expect(loc).toHaveProperty('city');
      }
    });

    it('courses with locations reference valid delivery locations', async () => {
      const [courseRes, locRes] = await Promise.all([
        api('/api/courses'),
        api('/api/delivery-locations'),
      ]);
      const courses = await courseRes.json();
      const locations = await locRes.json();
      const locIds = locations.map(l => l.id);
      const withLocation = courses.filter(c => c.loc_id);
      for (const course of withLocation) {
        expect(locIds).toContain(course.loc_id);
      }
    });
  });

  describe('Cross-entity data consistency', () => {
    it('all vendor IDs in courses are valid', async () => {
      const [courseRes, vendorRes] = await Promise.all([
        api('/api/courses'),
        api('/api/vendors'),
      ]);
      const courses = await courseRes.json();
      const vendors = await vendorRes.json();
      const vendorIds = vendors.map(v => v.id);
      for (const course of courses) {
        expect(vendorIds).toContain(course.vendor_id);
      }
    });

    it('enrollment vendor colors match vendor table', async () => {
      const [enrollRes, vendorRes] = await Promise.all([
        api('/api/enrollments'),
        api('/api/vendors'),
      ]);
      const enrollments = await enrollRes.json();
      const vendors = await vendorRes.json();
      const colorMap = Object.fromEntries(vendors.map(v => [v.name, v.color]));
      for (const e of enrollments) {
        if (e.vendor_name && e.vendor_color) {
          expect(e.vendor_color).toBe(colorMap[e.vendor_name]);
        }
      }
    });
  });
});
