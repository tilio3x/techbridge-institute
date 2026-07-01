import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

function api(path) {
  return fetch(`${BASE_URL}${path}`);
}

describe('Regression Tests', () => {
  describe('Course operations', () => {
    it('GET /api/courses returns courses with vendor details', async () => {
      const res = await api('/api/courses');
      const courses = await res.json();
      expect(courses.length).toBeGreaterThan(0);
      const course = courses[0];
      expect(course).toHaveProperty('title');
      expect(course).toHaveProperty('vendor_name');
      expect(course).toHaveProperty('vendor_color');
    });

    it('GET /api/vendors returns all vendors', async () => {
      const res = await api('/api/vendors');
      const vendors = await res.json();
      expect(vendors.length).toBe(5);
      const names = vendors.map(v => v.name);
      expect(names).toContain('CompTIA');
      expect(names).toContain('Microsoft');
      expect(names).toContain('Cisco');
    });
  });

  describe('Student operations', () => {
    it('GET /api/students returns students with enrollment count', async () => {
      const res = await api('/api/students');
      const students = await res.json();
      expect(students.length).toBeGreaterThan(0);
      expect(students[0]).toHaveProperty('course_count');
    });
  });

  describe('Schedule operations', () => {
    it('GET /api/schedule returns schedule with course info', async () => {
      const res = await api('/api/schedule');
      const schedule = await res.json();
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule[0]).toHaveProperty('code');
      expect(schedule[0]).toHaveProperty('title');
    });
  });

  describe('Delivery locations', () => {
    it('GET /api/delivery-locations returns locations', async () => {
      const res = await api('/api/delivery-locations');
      const locations = await res.json();
      expect(Array.isArray(locations)).toBe(true);
    });

    it('GET /api/locations/physical returns only active physical locations', async () => {
      const res = await api('/api/locations/physical');
      const locations = await res.json();
      expect(Array.isArray(locations)).toBe(true);
    });
  });

  describe('Enrollment operations', () => {
    it('GET /api/enrollments returns enrollments with details', async () => {
      const res = await api('/api/enrollments');
      const enrollments = await res.json();
      expect(enrollments.length).toBeGreaterThan(0);
      expect(enrollments[0]).toHaveProperty('student_name');
      expect(enrollments[0]).toHaveProperty('code');
      expect(enrollments[0]).toHaveProperty('vendor_name');
    });
  });
});
