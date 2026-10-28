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
const argon2 = require('argon2');
const env = require('../src/core/config/env');
const User = require('../src/features/users/User');

async function seed() {
  if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
    console.error('❌  ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);
  console.info('✅  MongoDB connected');

  const normalizedEmail = env.ADMIN_SEED_EMAIL.trim().toLowerCase();
  const normalizedUsername = (env.ADMIN_SEED_USERNAME || 'admin').trim().toLowerCase();
  const adminName = env.ADMIN_SEED_NAME || 'System Administrator';

  const passwordWithPepper = env.ADMIN_SEED_PASSWORD + (env.PASSWORD_PEPPER || '');
  const passwordHash = await argon2.hash(passwordWithPepper, {
    type: argon2.argon2id,
  });

  // Check if an admin exists by email, username, or role
  let admin = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }, { role: 'admin' }],
  });

  if (admin) {
    admin.email = normalizedEmail;
    admin.username = normalizedUsername;
    admin.name = adminName;
    admin.passwordHash = passwordHash;
    admin.role = 'admin';
    admin.status = 'active';
    await admin.save();
    console.info(`✅  Admin user updated successfully with new credentials:`);
    console.info(`    Username: ${admin.username}`);
    console.info(`    Email:    ${admin.email}`);
  } else {
    admin = await User.create({
      name: adminName,
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      role: 'admin',
      status: 'active',
    });
    console.info(`✅  Admin user created successfully:`);
    console.info(`    Username: ${admin.username}`);
    console.info(`    Email:    ${admin.email}`);
  }

  await mongoose.disconnect();
  console.info('Done.');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
