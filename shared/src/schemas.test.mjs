import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  registerSchema,
  loginSchema,
  submitPostSchema,
  LINKEDIN_URL_PATTERN,
} = require('./index.js');

describe('Shared Schemas', () => {
  describe('registerSchema', () => {
    it('validates a valid student payload', () => {
      const validStudent = {
        name: 'Jane Doe',
        email: 'jane@college.edu',
        username: 'janedoe',
        password: 'Password123!',
        college: 'Engineering College',
        course: 'Computer Science',
        year: 2,
      };
      const result = registerSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it('rejects short password or invalid email', () => {
      const invalid = {
        name: 'Jane',
        email: 'not-an-email',
        username: 'jd',
        password: '123',
        college: 'EC',
        course: 'CS',
        year: 2,
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('submitPostSchema & LINKEDIN_URL_PATTERN', () => {
    it('accepts valid linkedin post URLs', () => {
      const validUrl = 'https://www.linkedin.com/posts/activity-1234567890';
      const result = submitPostSchema.safeParse({ url: validUrl });
      expect(result.success).toBe(true);
    });

    it('rejects non-linkedin URLs', () => {
      const invalidUrl = 'https://malicious-site.com/fake-post';
      const result = submitPostSchema.safeParse({ url: invalidUrl });
      expect(result.success).toBe(false);
    });
  });
});
