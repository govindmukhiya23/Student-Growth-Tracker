'use strict';

/**
 * Seed script — creates the first admin account.
 * Run once: npm run seed --workspace=server
 *
 * Uses ADMIN_SEED_* variables from server/.env
 * SECURITY.md §3.3: admins are never created by public registration.
 */

// Load env first (validates all required vars)
require('../src/core/config/env');

const mongoose = require('mongoose');
const _argon2 = require('argon2');
const env = require('../src/core/config/env');

async function seed() {
  if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
    console.error('❌  ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);
  console.info('✅  MongoDB connected');

  // Dynamically require the User model (won't exist until Phase 1)
  // For Phase 0 this script is a placeholder — it will be completed in Phase 1
  // when the User model is created.
  console.info('ℹ️   Seed script ready. User model will be available after Phase 1.');
  console.info(`    Will create admin: ${env.ADMIN_SEED_EMAIL} (${env.ADMIN_SEED_USERNAME})`);

  await mongoose.disconnect();
  console.info('Done.');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
