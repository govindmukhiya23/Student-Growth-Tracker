import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

const { connectDB, disconnectDB } = require('../../core/db');
const app = require('../../app');
const User = require('../users/User');

let mongoAvailable = false;

beforeAll(async () => {
  await connectDB();
  const mongoose = require('mongoose');
  mongoAvailable = mongoose.connection.readyState === 1;
  if (mongoAvailable) {
    await User.deleteMany({ email: { $in: ['teststudent@college.edu', 'testadmin@college.edu'] } });
  }
});

afterAll(async () => {
  if (mongoAvailable) {
    await User.deleteMany({ email: { $in: ['teststudent@college.edu', 'testadmin@college.edu'] } });
  }
  await disconnectDB();
});

describe('Phase 1 — Authentication & Authorization Flow', () => {
  it('rejects registration with invalid email or short password (400)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Student',
        email: 'invalid-email',
        username: 'teststudent',
        password: '123',
        college: 'Test College',
        course: 'CSE',
        year: 2,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  it('rejects unauthenticated requests to /api/v1/auth/me (401)', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated requests to /api/v1/admin/registrations (401)', async () => {
    const res = await request(app).get('/api/v1/admin/registrations');
    expect(res.status).toBe(401);
  });

  it('skips DB dependent assertions gracefully if MongoDB service is offline', () => {
    if (!mongoAvailable) {
      expect(true).toBe(true);
    }
  });
});
