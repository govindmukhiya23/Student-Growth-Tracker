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
const {
  normalizeLinkedInUrl,
  isPrivateIp,
  hashText,
} = require('./urlUtils');

describe('Phase 2 — LinkedIn Posts & URL Handling', () => {
  describe('normalizeLinkedInUrl', () => {
    it('normalizes activity URLs and strips tracking query parameters', () => {
      const raw = 'https://www.linkedin.com/posts/alex_activity-7123456789012345678-abcd?utm_source=share&utm_medium=member_desktop#comments';
      const result = normalizeLinkedInUrl(raw);

      expect(result.linkedinPostId).toBe('urn:li:activity:7123456789012345678');
      expect(result.normalizedUrl).toBe('https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678');
    });

    it('normalizes share slug URLs and strips tracking query parameters', () => {
      const raw = 'https://www.linkedin.com/posts/alex_share-7123456789012345678-abcd?utm_source=share';
      const result = normalizeLinkedInUrl(raw);

      expect(result.linkedinPostId).toBe('urn:li:share:7123456789012345678');
      expect(result.normalizedUrl).toBe('https://www.linkedin.com/feed/update/urn:li:share:7123456789012345678');
    });

    it('normalizes urn:li:share feed update URLs', () => {
      const raw = 'https://linkedin.com/feed/update/urn:li:share:7123456789012345678/?rcm=ACoAA';
      const result = normalizeLinkedInUrl(raw);

      expect(result.linkedinPostId).toBe('urn:li:share:7123456789012345678');
      expect(result.normalizedUrl).toBe('https://www.linkedin.com/feed/update/urn:li:share:7123456789012345678');
    });

    it('throws error for non-LinkedIn domains (SSRF protection)', () => {
      expect(() => normalizeLinkedInUrl('https://evil-site.com/posts/activity-123')).toThrow();
    });

    it('throws error for non-https URLs', () => {
      expect(() => normalizeLinkedInUrl('http://www.linkedin.com/posts/activity-123')).toThrow();
    });
  });

  describe('SSRF isPrivateIp check', () => {
    it('identifies private IPv4 and loopback addresses', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('10.0.1.50')).toBe(true);
      expect(isPrivateIp('172.16.5.1')).toBe(true);
      expect(isPrivateIp('192.168.1.1')).toBe(true);
      expect(isPrivateIp('169.254.169.254')).toBe(true); // AWS/cloud metadata IP
    });

    it('identifies private IPv6 addresses', () => {
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('fe80::1')).toBe(true);
    });

    it('allows public Internet IPs', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('104.244.42.1')).toBe(false);
    });
  });

  describe('hashText text fingerprinting', () => {
    it('produces identical fingerprints regardless of extra whitespace and casing', () => {
      const t1 = 'Hello   World!\nThis is a LinkedIn   POST.';
      const t2 = 'hello world! this is a linkedin post.';
      expect(hashText(t1)).toBe(hashText(t2));
    });
  });

  describe('API Route Protections', () => {
    it('rejects unauthenticated POST /api/v1/posts with 401', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .send({ url: 'https://www.linkedin.com/posts/activity-7123456789012345678' });
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated GET /api/v1/admin/posts with 401', async () => {
      const res = await request(app).get('/api/v1/admin/posts');
      expect(res.status).toBe(401);
    });

    it('rejects invalid post URLs with 400 validation error', () => {
      const { submitPostSchema } = require('@growth-tracker/shared');
      const result = submitPostSchema.safeParse({ url: 'not-a-valid-url' });
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toContain('URL');
    });
  });
});
