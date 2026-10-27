'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../../features/users/User');

/**
 * 1. authenticate — verifies Bearer JWT access token from Authorization header.
 * Attaches decoded payload (id, role) to req.auth
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });
    req.auth = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'Token invalid or expired.' });
  }
}

/**
 * 2. loadUser — reads user from the database (not relying on JWT payload alone)
 * so status changes and suspensions take effect immediately without waiting for token expiry.
 */
async function loadUser(req, res, next) {
  if (!req.auth || !req.auth.id) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const user = await User.findById(req.auth.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * 3. requireApproved — allows only approved or active users.
 * Blocks pending, rejected, and suspended students from taking student actions.
 */
function requireApproved(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  // Admins are always approved
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.status === 'pending') {
    return res.status(403).json({
      code: 'ACCOUNT_PENDING',
      message: 'Your registration is awaiting admin approval.',
      status: 'pending',
    });
  }

  if (req.user.status === 'rejected') {
    return res.status(403).json({
      code: 'ACCOUNT_REJECTED',
      message: 'Your registration was rejected by an administrator.',
      reason: req.user.rejectionReason || null,
      status: 'rejected',
    });
  }

  if (req.user.status === 'suspended') {
    return res.status(403).json({
      code: 'ACCOUNT_SUSPENDED',
      message: 'Your account has been suspended.',
      status: 'suspended',
    });
  }

  if (req.user.status !== 'approved' && req.user.status !== 'active') {
    return res.status(403).json({
      code: 'ACCOUNT_INACTIVE',
      message: 'Account is not approved.',
      status: req.user.status,
    });
  }

  next();
}

/**
 * 4. requireRole — checks role matches permitted list
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  loadUser,
  requireApproved,
  requireRole,
};
