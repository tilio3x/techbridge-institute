import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

function api(path) {
  return fetch(`${BASE_URL}${path}`);
}

describe('API Smoke Tests', () => {
  describe('GET endpoints return 200', () => {
    const endpoints = [
      '/api/courses',
      '/api/vendors',
      '/api/schedule',
      '/api/students',
      '/api/instructors',
      '/api/delivery-locations',
      '/api/enrollments',
      '/api/profiles',
      '/api/locations/physical',
    ];

    endpoints.forEach((endpoint) => {
      it(`GET ${endpoint}`, async () => {
        const res = await api(endpoint);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
      });
    });
  });

  describe('POST /api/contact validates input', () => {
    it('rejects empty body with 400', async () => {
      const res = await fetch(`${BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it('accepts valid inquiry', async () => {
      const res = await fetch(`${BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          subject: 'General Inquiry',
          message: 'This is an automated test inquiry.',
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Test User');
      expect(data.email).toBe('test@example.com');
      expect(data.id).toBeDefined();
    });
  });
});
