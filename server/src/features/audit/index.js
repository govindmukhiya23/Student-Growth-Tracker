'use strict';

const { Router } = require('express');
const { paginationSchema } = require('@growth-tracker/shared');
const { validate } = require('../../core/middleware/validate');
const { authenticate, loadUser, requireRole } = require('../../core/middleware/auth');
const AuditLog = require('./AuditLog');
const events = require('../../core/events');

const router = Router();

router.use(authenticate, loadUser, requireRole('admin'));

/**
 * GET /api/v1/admin/audit
 * View paginated audit logs
 */
router.get('/audit', validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('actorId', 'name email username role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(),
    ]);

    res.json({
      logs,
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

function init() {
  events.on('auth.login', async payload => {
    try {
      await AuditLog.create({
        actorId: payload.userId,
        action: 'auth.login',
        targetType: 'user',
        targetId: payload.userId.toString(),
        ip: payload.ip,
        metadata: { role: payload.role },
      });
    } catch (_e) {
      // ignore
    }
  });

  events.on('user.status_changed', async payload => {
    try {
      await AuditLog.create({
        actorId: payload.adminId,
        action: 'user.status_changed',
        targetType: 'user',
        targetId: payload.userId.toString(),
        ip: payload.ip,
        metadata: {
          previousStatus: payload.previousStatus,
          newStatus: payload.newStatus,
          reason: payload.reason,
        },
      });
    } catch (_e) {
      // ignore
    }
  });

  events.on('auth.session_breach', async payload => {
    try {
      await AuditLog.create({
        actorId: payload.userId,
        action: 'auth.session_breach',
        targetType: 'session_family',
        targetId: payload.familyId,
        ip: payload.ip,
        metadata: { warning: 'Token reuse detected, revoked family' },
      });
    } catch (_e) {
      // ignore
    }
  });

  events.on('post.verified', async payload => {
    try {
      await AuditLog.create({
        actorId: payload.adminId,
        action: 'post.verified',
        targetType: 'post',
        targetId: payload.postId.toString(),
        metadata: { studentId: payload.studentId },
      });
    } catch (_e) {
      // ignore
    }
  });

  events.on('post.rejected', async payload => {
    try {
      await AuditLog.create({
        actorId: payload.adminId,
        action: 'post.rejected',
        targetType: 'post',
        targetId: payload.postId.toString(),
        metadata: { studentId: payload.studentId, reason: payload.reason },
      });
    } catch (_e) {
      // ignore
    }
  });

  events.on('post.metrics_updated', async payload => {
    try {
      await AuditLog.create({
        actorId: payload.adminId,
        action: 'post.metrics_updated',
        targetType: 'post',
        targetId: payload.postId.toString(),
        metadata: { metrics: payload.metrics },
      });
    } catch (_e) {
      // ignore
    }
  });
}

module.exports = {
  mountPath: '/admin',
  router,
  init,
};
