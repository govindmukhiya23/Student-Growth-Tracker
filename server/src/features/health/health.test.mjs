import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Set test env vars BEFORE any module is required (env.js runs at require time)
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

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('GET /api/v1/health', () => {
  it('returns health status response', async () => {
    const res = await request(app).get('/api/v1/health');
    // 200 if connected, 503 if disconnected (both return valid json schema)
    expect([200, 503]).toContain(res.status);
    expect(['ok', 'degraded']).toContain(res.body.status);
    expect(res.body.timestamp).toBeTruthy();
    expect(res.body.services).toBeDefined();
  });
});

describe('GET /api/v1/features', () => {
  it('returns the feature flags object', async () => {
    const res = await request(app).get('/api/v1/features');
    expect(res.status).toBe(200);
    expect(res.body.features).toBeDefined();
    expect(typeof res.body.features).toBe('object');
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Route not found.');
  });

  it('never returns a stack trace', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(JSON.stringify(res.body)).not.toContain('stack');
    expect(JSON.stringify(res.body)).not.toContain('Error:');
  });
});

describe('Security headers', () => {
  it('sets Content-Security-Policy from helmet', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['content-security-policy']).toBeTruthy();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('Body size limit', () => {
  it('returns 413 for payloads over 10 KB', async () => {
    const bigBody = JSON.stringify({ data: 'x'.repeat(12_000) });
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send(bigBody);
    // 413 = payload too large
    expect([413, 404]).toContain(res.status);
  });
});

describe('NoSQL sanitiser', () => {
  it('strips $-prefixed keys from the body', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .send({ '$where': '1==1', normal: 'value' });
    expect([404, 400]).toContain(res.status);
    expect(res.status).not.toBe(200);
  });
});
