'use strict';

const { Router } = require('express');
const { updateUserStatusSchema, paginationSchema } = require('@growth-tracker/shared');
const { validate } = require('../../core/middleware/validate');
const { authenticate, loadUser, requireRole } = require('../../core/middleware/auth');
const User = require('./User');
const authService = require('../auth/authService');
const events = require('../../core/events');

const router = Router();

// All admin user routes require authentication and admin role
router.use(authenticate, loadUser, requireRole('admin'));

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
