import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growth-tracker-test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough-00000000';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-11111111';
process.env.COOKIE_SECRET = 'test-cookie-secret-that-is-long-enough-22222222222';
process.env.PASSWORD_PEPPER = 'test-password-pepper-long-enough-333333333333333';
process.env.RESEND_API_KEY = 're_test_placeholder';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const app = require('../../app');
const { sanitizeCsvCell, toCsv } = require('./csvUtils');

describe('Phase 4 — Reports & Anti-Formula Injection', () => {
  describe('sanitizeCsvCell (SECURITY.md §176)', () => {
    it('neutralizes cells starting with = by prefixing single quote', () => {
      const sanitized = sanitizeCsvCell('=1+1');
      expect(sanitized).toBe("\"'=1+1\"");
    });

    it('neutralizes cells starting with + by prefixing single quote', () => {
      const sanitized = sanitizeCsvCell('+cmd');
      expect(sanitized).toBe("\"'+cmd\"");
    });

    it('neutralizes cells starting with - by prefixing single quote', () => {
      const sanitized = sanitizeCsvCell('-123');
      expect(sanitized).toBe("\"'-123\"");
    });

    it('neutralizes cells starting with @ by prefixing single quote', () => {
      const sanitized = sanitizeCsvCell('@SUM');
      expect(sanitized).toBe("\"'@SUM\"");
    });

    it('escapes embedded double quotes properly', () => {
      const sanitized = sanitizeCsvCell('Hello "World"');
      expect(sanitized).toBe('"Hello ""World"""');
    });

    it('handles null and undefined values safely', () => {
      expect(sanitizeCsvCell(null)).toBe('""');
      expect(sanitizeCsvCell(undefined)).toBe('""');
    });
  });

  describe('toCsv', () => {
    it('converts objects to sanitized CSV format with CRLF line endings', () => {
      const headers = [
        { key: 'name', label: 'Name' },
        { key: 'score', label: 'Score' },
      ];
      const rows = [
        { name: 'Alice', score: 50 },
        { name: '=Malicious', score: 100 },
      ];

      const csv = toCsv(headers, rows);
      expect(csv).toContain('"Name","Score"');
      expect(csv).toContain('"Alice","50"');
      expect(csv).toContain("\"'=Malicious\",\"100\"");
      expect(csv).toContain('\r\n');
    });
  });

  describe('Admin Access Restrictions', () => {
    it('requires admin authentication on GET /api/v1/admin/reports/export (401)', async () => {
      const res = await request(app).get('/api/v1/admin/reports/export');
      expect(res.status).toBe(401);
    });

    it('requires admin authentication on GET /api/v1/admin/settings (401)', async () => {
      const res = await request(app).get('/api/v1/admin/settings');
      expect(res.status).toBe(401);
    });
  });
});
