'use strict';

// Load .env only outside production — NEVER in production (use hosting provider env vars)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),

  PASSWORD_PEPPER: z.string().min(32, 'PASSWORD_PEPPER must be at least 32 characters').optional(),

  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  CLIENT_ORIGIN: z.string().url('CLIENT_ORIGIN must be a valid URL'),

  // Seed admin — only needed once, so optional after first run
  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().min(10).optional(),
  ADMIN_SEED_NAME: z.string().min(2).optional(),
  ADMIN_SEED_USERNAME: z.string().min(3).optional(),
});

let env;
try {
  env = schema.parse(process.env);
} catch (err) {
  console.error('❌  Server refuses to start: invalid or missing environment variables.');
  if (err.errors) {
    err.errors.forEach(e => console.error(`   ${e.path.join('.')}: ${e.message}`));
  }
  process.exit(1);
}

module.exports = env;
