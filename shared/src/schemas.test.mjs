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
        rollNumber: '21B91A0501',
      };
      const result = registerSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
      expect(result.data.rollNumber).toBe('21B91A0501');
    });

    it('rejects payload missing rollNumber', () => {
      const missingRoll = {
        name: 'Jane Doe',
        email: 'jane@college.edu',
        username: 'janedoe',
        password: 'Password123!',
        college: 'Engineering College',
        course: 'Computer Science',
      };
      const result = registerSchema.safeParse(missingRoll);
      expect(result.success).toBe(false);
    });
  });

  describe('submitPostSchema & LINKEDIN_URL_PATTERN', () => {
    it('accepts valid linkedin post URLs', () => {
      const validUrl = 'https://www.linkedin.com/posts/activity-1234567890';
      const result = submitPostSchema.safeParse({ url: validUrl });
      expect(result.success).toBe(true);
    });

    it('accepts valid lnkd.in shortened URLs', () => {
      const validUrl = 'https://lnkd.in/p/d2V33N_Z';
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
