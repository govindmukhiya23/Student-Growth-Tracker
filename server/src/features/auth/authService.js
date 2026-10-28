'use strict';

const crypto = require('node:crypto');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const env = require('../../core/config/env');
const User = require('../users/User');
const Session = require('./Session');
const events = require('../../core/events');

// Precomputed dummy hash for timing attack mitigation when user doesn't exist
let dummyHash = null;
(async () => {
  try {
    dummyHash = await argon2.hash('DummyPasswordTimingProtection123!', {
      type: argon2.argon2id,
    });
  } catch (_e) {
    // handled gracefully
  }
})();

function hashWithPepper(password) {
  return password + (env.PASSWORD_PEPPER || '');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates short-lived 15m JWT access token
 */
function createAccessToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: '15m',
      algorithm: 'HS256',
    }
  );
}

/**
 * Creates a new refresh token and session in DB
 */
async function createSession(userId, req, familyId = null) {
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(refreshToken);
  const famId = familyId || crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await Session.create({
    userId,
    familyId: famId,
    tokenHash,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip || '',
    expiresAt,
  });

  return { refreshToken, expiresAt };
}

/**
 * Register a new student
 */
async function register(userData, req) {
  const normalizedEmail = userData.email.trim().toLowerCase();
  const normalizedUsername = userData.username.trim().toLowerCase();
  const normalizedRoll = userData.rollNumber ? userData.rollNumber.trim().toUpperCase() : null;

  // Enforce single account per student across email, username, and roll number
  const duplicateConditions = [
    { email: normalizedEmail },
    { username: normalizedUsername },
  ];
  if (normalizedRoll) {
    duplicateConditions.push({ rollNumber: normalizedRoll });
  }

  const existing = await User.findOne({ $or: duplicateConditions });

  if (existing) {
    let duplicateField = 'Email address';
    if (existing.email === normalizedEmail) {
      duplicateField = 'Email address';
    } else if (existing.username === normalizedUsername) {
      duplicateField = 'Username';
    } else if (normalizedRoll && existing.rollNumber === normalizedRoll) {
      duplicateField = 'Student ID / Roll No';
    }
    const err = new Error(
      `An account with this ${duplicateField} already exists. Each student can only create one account.`
    );
    err.status = 409;
    throw err;
  }

  const passwordHash = await argon2.hash(hashWithPepper(userData.password), {
    type: argon2.argon2id,
  });

  let user;
  try {
    user = await User.create({
      name: userData.name.trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      role: 'student',
      status: 'pending',
      college: userData.college.trim(),
      course: userData.course.trim(),
      rollNumber: normalizedRoll || undefined,
      year: userData.year || 1,
    });
  } catch (err) {
    if (err.code === 11000) {
      let duplicateField = 'details';
      if (err.keyPattern?.email) duplicateField = 'Email address';
      else if (err.keyPattern?.username) duplicateField = 'Username';
      else if (err.keyPattern?.rollNumber) duplicateField = 'Student ID / Roll No';
      const duplicateErr = new Error(
        `An account with this ${duplicateField} already exists. Each student can only create one account.`
      );
      duplicateErr.status = 409;
      throw duplicateErr;
    }
    throw err;
  }

  events.emit('user.registered', {
    userId: user._id,
    email: user.email,
    username: user.username,
    name: user.name,
    ip: req.ip,
  });

  return {
    success: true,
    message: 'Registration successful! Your account is pending admin approval before you can post.',
  };
}

/**
 * Authenticate user login
 */
async function login(username, password, req) {
  const normalized = username.trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ username: normalized }, { email: normalized }],
  }).select('+passwordHash');

  if (!user) {
    if (dummyHash) {
      await argon2.verify(dummyHash, hashWithPepper(password));
    }
    events.emit('auth.failed_login', { identifier: normalized, ip: req.ip, reason: 'user_not_found' });
    const err = new Error('Invalid username or password.');
    err.status = 401;
    throw err;
  }

  // Account lock check
  if (user.lockUntil && user.lockUntil > new Date()) {
    const err = new Error('Account is temporarily locked. Please try again later.');
    err.status = 429;
    throw err;
  }

  const validPassword = await argon2.verify(user.passwordHash, hashWithPepper(password));
  if (!validPassword) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
    }
    await user.save();
    events.emit('auth.failed_login', { identifier: normalized, userId: user._id, ip: req.ip, reason: 'invalid_password' });
    const err = new Error('Invalid username or password.');
    err.status = 401;
    throw err;
  }

  // Successful login reset attempts
  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  // Status checks
  if (user.status === 'suspended') {
    const err = new Error('Your account has been suspended. Please contact your college administrator.');
    err.status = 403;
    throw err;
  }

  // Pending and rejected users can still retrieve their status via login/me
  const accessToken = createAccessToken(user);
  const { refreshToken, expiresAt } = await createSession(user._id, req);

  events.emit('auth.login', { userId: user._id, role: user.role, ip: req.ip });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
    refreshExpiresAt: expiresAt,
  };
}

/**
 * Rotate refresh token
 */
async function refresh(oldRefreshToken, req) {
  if (!oldRefreshToken) {
    const err = new Error('Refresh token missing.');
    err.status = 401;
    throw err;
  }

  const tokenHash = hashToken(oldRefreshToken);
  const session = await Session.findOne({ tokenHash });

  if (!session) {
    const err = new Error('Invalid session.');
    err.status = 401;
    throw err;
  }

  // Token reuse detection (SECURITY.md §64)
  if (session.isRevoked) {
    // Revoke the entire token family!
    await Session.updateMany({ familyId: session.familyId }, { isRevoked: true });
    events.emit('auth.session_breach', {
      userId: session.userId,
      familyId: session.familyId,
      ip: req.ip,
    });
    const err = new Error('Session expired or revoked.');
    err.status = 401;
    throw err;
  }

  // Mark current session token revoked / rotated
  session.isRevoked = true;
  await session.save();

  const user = await User.findById(session.userId);
  if (!user || user.status === 'suspended') {
    const err = new Error('User inactive or suspended.');
    err.status = 403;
    throw err;
  }

  // Issue new access token & new refresh token in same family
  const accessToken = createAccessToken(user);
  const { refreshToken, expiresAt } = await createSession(user._id, req, session.familyId);

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
    refreshExpiresAt: expiresAt,
  };
}

/**
 * Logout and invalidate session
 */
async function logout(refreshToken) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await Session.updateOne({ tokenHash }, { isRevoked: true });
  }
}

/**
 * Revoke all sessions for a user (on password change, suspension, etc.)
 */
async function revokeAllUserSessions(userId) {
  await Session.updateMany({ userId }, { isRevoked: true });
}

module.exports = {
  createAccessToken,
  createSession,
  register,
  login,
  refresh,
  logout,
  revokeAllUserSessions,
};
