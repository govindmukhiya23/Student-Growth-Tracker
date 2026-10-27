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
const { calculateStreaks } = require('./streakService');
const {
  getKolkataDateString,
  getDaysDifference,
  getWeekStartDate,
} = require('../../core/utils/dateUtils');

describe('Phase 3 — Scoring, Streaks & Leaderboard Engine', () => {
  describe('dateUtils (Asia/Kolkata)', () => {
    it('formats today as YYYY-MM-DD', () => {
      const today = getKolkataDateString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('calculates calendar day differences accurately', () => {
      expect(getDaysDifference('2026-10-25', '2026-10-26')).toBe(1);
      expect(getDaysDifference('2026-10-20', '2026-10-25')).toBe(5);
      expect(getDaysDifference('2026-10-25', '2026-10-25')).toBe(0);
    });

    it('determines the Monday for any given date in a week', () => {
      // 2026-10-27 is a Tuesday, Monday was 2026-10-26
      expect(getWeekStartDate('2026-10-27')).toBe('2026-10-26');
      // 2026-10-26 is a Monday
      expect(getWeekStartDate('2026-10-26')).toBe('2026-10-26');
    });
  });

  describe('Streak Engine calculateStreaks', () => {
    it('calculates consecutive days correctly and detects active streak', () => {
      const today = getKolkataDateString();
      // Mock 3 consecutive days ending today
      const d0 = new Date();
      const d1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const d2 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const dates = [
        getKolkataDateString(d2),
        getKolkataDateString(d1),
        today,
      ];

      const res = calculateStreaks(dates);
      expect(res.currentStreak).toBe(3);
      expect(res.longestStreak).toBe(3);
      expect(res.lastActiveDate).toBe(today);
    });

    it('bridges gap with an admin exception', () => {
      const today = getKolkataDateString();
      const twoDaysAgo = getKolkataDateString(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
      const yesterday = getKolkataDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

      // Student posted 2 days ago and today, but missed yesterday
      const dates = [twoDaysAgo, today];
      // Admin granted exception for yesterday
      const exceptions = [{ date: yesterday }];

      const res = calculateStreaks(dates, exceptions);
      expect(res.currentStreak).toBe(3);
    });

    it('sets currentStreak to 0 if last active date was more than 1 day ago', () => {
      const fiveDaysAgo = getKolkataDateString(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));
      const fourDaysAgo = getKolkataDateString(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000));

      const res = calculateStreaks([fiveDaysAgo, fourDaysAgo]);
      expect(res.currentStreak).toBe(0);
      expect(res.longestStreak).toBe(2);
    });
  });

  describe('Leaderboard & Dashboard Endpoints', () => {
    it('GET /api/v1/leaderboard returns 200 and schema', async () => {
      const res = await request(app).get('/api/v1/leaderboard');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.leaderboard)).toBe(true);
      expect(res.body.timeframe).toBe('all');
    });

    it('GET /api/v1/dashboard/student requires auth (401)', async () => {
      const res = await request(app).get('/api/v1/dashboard/student');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/admin/streaks/:id/exception requires admin auth (401)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/streaks/507f1f77bcf86cd799439011/exception')
        .send({ date: '2026-10-27', reason: 'Medical absence' });
      expect(res.status).toBe(401);
    });
  });
});
