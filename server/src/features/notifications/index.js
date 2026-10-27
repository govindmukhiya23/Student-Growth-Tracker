'use strict';

const { Router } = require('express');
const { authenticate, loadUser } = require('../../core/middleware/auth');
const Notification = require('./Notification');
const events = require('../../core/events');

const router = Router();

router.use(authenticate, loadUser);

/**
 * GET /api/v1/notifications
 * Get user's notifications (last 50)
 */
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

function init() {
  events.on('user.status_changed', async payload => {
    try {
      let title = 'Account Status Update';
      let message = `Your account status is now: ${payload.newStatus}.`;
      let type = 'info';

      if (payload.newStatus === 'approved') {
        title = 'Account Approved! 🎉';
        message = 'Your registration was approved! You can now start submitting your LinkedIn posts.';
        type = 'success';
      } else if (payload.newStatus === 'rejected') {
        title = 'Account Application Rejected';
        message = payload.reason
          ? `Your application was rejected: ${payload.reason}`
          : 'Your application was rejected by an administrator.';
        type = 'error';
      } else if (payload.newStatus === 'suspended') {
        title = 'Account Suspended';
        message = 'Your account has been suspended by an administrator.';
        type = 'warning';
      }

      await Notification.create({
        userId: payload.userId,
        title,
        message,
        type,
      });
    } catch (_e) {
      // ignore
    }
  });

  events.on('post.verified', async payload => {
    try {
      await Notification.create({
        userId: payload.studentId,
        title: 'Post Verified! ✨',
        message: 'Your submitted LinkedIn post was verified by an administrator.',
        type: 'success',
      });
    } catch (_e) {
      // ignore
    }
  });

  events.on('post.rejected', async payload => {
    try {
      await Notification.create({
        userId: payload.studentId,
        title: 'Post Review Update',
        message: payload.reason
          ? `Your submitted post was rejected: ${payload.reason}`
          : 'Your submitted post did not meet our verification criteria.',
        type: 'error',
      });
    } catch (_e) {
      // ignore
    }
  });
}

module.exports = {
  mountPath: '/notifications',
  router,
  init,
};
