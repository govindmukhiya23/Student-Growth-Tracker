'use strict';

const { Router } = require('express');
const { updateUserStatusSchema, paginationSchema } = require('@growth-tracker/shared');
const { validate } = require('../../core/middleware/validate');
const { authenticate, loadUser, requireRole } = require('../../core/middleware/auth');
const User = require('./User');
const authService = require('../auth/authService');
const events = require('../../core/events');

const argon2 = require('argon2');
const env = require('../../core/config/env');

const router = Router();

// All admin user routes require authentication and admin role
router.use(authenticate, loadUser, requireRole('admin'));

/**
 * PATCH /api/v1/admin/account
 * Update admin's own username and/or password
 */
router.patch('/account', async (req, res, next) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password.' });
      }
      if (newPassword.length < 10) {
        return res.status(400).json({ message: 'New password must be at least 10 characters long.' });
      }
      const pepperedCurrent = currentPassword + (env.PASSWORD_PEPPER || '');
      const valid = await argon2.verify(user.passwordHash, pepperedCurrent);
      if (!valid) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
      const pepperedNew = newPassword + (env.PASSWORD_PEPPER || '');
      user.passwordHash = await argon2.hash(pepperedNew, {
        type: argon2.argon2id,
      });
    }

    // Username change
    if (username && username.trim().toLowerCase() !== user.username) {
      const normalizedUsername = username.trim().toLowerCase();
      if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
        return res.status(400).json({ message: 'Username must be between 3 and 30 characters.' });
      }
      const existing = await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ message: 'This username is already taken.' });
      }
      user.username = normalizedUsername;
    }

    await user.save();

    res.json({
      message: 'Admin account credentials updated successfully.',
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/registrations
 * List students with status: 'pending' (or filter by status/query)
 */
router.get('/registrations', validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const query = { role: 'student', status: 'pending' };

    if (req.query.college) {
      query.college = req.query.college;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      registrations: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/users
 * List all users with optional status, role, and search filters
 */
router.get('/users', validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { username: searchRegex },
        { rollNumber: searchRegex },
        { college: searchRegex },
        { course: searchRegex },
      ];
    }

    const [users, total, stats] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
      Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'student', status: { $in: ['approved', 'active'] } }),
        User.countDocuments({ role: 'student', status: 'pending' }),
        User.countDocuments({ role: 'student', status: 'suspended' }),
        User.countDocuments({ role: 'student', status: 'rejected' }),
      ]).then(([totalStudents, approved, pending, suspended, rejected]) => ({
        totalStudents,
        approved,
        pending,
        suspended,
        rejected,
      })),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
      stats,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/admin/users/:id/status
 * Approve, reject, suspend, or reactivate a user
 */
router.patch('/users/:id/status', validate(updateUserStatusSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const previousStatus = user.status;
    user.status = status;
    if (status === 'rejected') {
      user.rejectionReason = reason || 'Your application did not meet our verification criteria.';
    } else if (status === 'approved' || status === 'active') {
      user.rejectionReason = null;
    }

    await user.save();

    // If suspended or rejected, invalidate all active sessions immediately (SECURITY.md §3.2)
    if (status === 'suspended' || status === 'rejected') {
      await authService.revokeAllUserSessions(user._id);
    }

    events.emit('user.status_changed', {
      userId: user._id,
      previousStatus,
      newStatus: status,
      reason,
      adminId: req.user._id,
      ip: req.ip,
    });

    res.json({
      message: `User status updated to ${status}.`,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = {
  mountPath: '/admin',
  router,
};
