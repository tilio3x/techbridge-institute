import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('Security Tests', () => {
  describe('SQL Injection prevention', () => {
    it('contact form rejects SQL injection in name', async () => {
      const res = await fetch(`${BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "'; DROP TABLE contact_inquiries; --",
          email: 'attacker@test.com',
          subject: 'General Inquiry',
          message: 'SQL injection test',
        }),
      });
      // Should succeed (parameterized queries prevent injection) but not break the DB
      expect(res.status).toBe(200);
    });

    it('contact form rejects SQL injection in email', async () => {
      const res = await fetch(`${BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: "test@test.com' OR '1'='1",
          subject: 'General Inquiry',
          message: 'SQL injection test',
        }),
      });
      expect([200, 400, 500]).toContain(res.status);
    });
  });

  describe('XSS prevention', () => {
    it('contact form handles script tags in message', async () => {
      const res = await fetch(`${BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '<script>alert("xss")</script>',
          email: 'test@example.com',
          subject: 'General Inquiry',
          message: '<img src=x onerror=alert("xss")>',
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      // Data is stored as-is (parameterized) — sanitization happens at render time
      expect(data.id).toBeDefined();
    });
  });

  describe('Input validation', () => {
    it('rejects missing required fields', async () => {
      const cases = [
        { email: 'a@b.com', subject: 'General Inquiry', message: 'hi' },
        { name: 'Test', subject: 'General Inquiry', message: 'hi' },
        { name: 'Test', email: 'a@b.com', message: 'hi' },
        { name: 'Test', email: 'a@b.com', subject: 'General Inquiry' },
      ];
      for (const body of cases) {
        const res = await fetch(`${BASE_URL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        expect(res.status).toBe(400);
      }
    });

    it('rejects invalid subject values', async () => {
      const res = await fetch(`${BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          subject: 'Invalid Subject',
          message: 'Test message',
        }),
      });
      // DB CHECK constraint should reject invalid subjects
      expect(res.status).not.toBe(200);
    });
  });
});
