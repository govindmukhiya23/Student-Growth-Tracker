'use strict';

const { Router } = require('express');
const { authenticate, loadUser, requireRole } = require('../../core/middleware/auth');
const streakService = require('./streakService');
const { getKolkataDateString } = require('../../core/utils/dateUtils');
const events = require('../../core/events');
const Post = require('../posts/Post');

const router = Router();

/**
 * POST /api/v1/admin/streaks/:studentId/exception
 * Admin grants an audited streak exception
 */
router.post(
  '/streaks/:studentId/exception',
  authenticate,
  loadUser,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { studentId } = req.params;
      const { date, reason } = req.body;

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Valid date in YYYY-MM-DD format is required.' });
      }

      const streak = await streakService.grantAdminException(
        studentId,
        date,
        req.user._id,
        reason
      );

      res.json({
        message: 'Streak exception granted successfully.',
        streak,
      });
    } catch (err) {
      next(err);
    }
  }
);

function init() {
  events.on('post.verified', async payload => {
    try {
      const post = await Post.findById(payload.postId);
      if (post) {
        const publishDate = post.extractedData?.publishedAt || post.createdAt;
        const dateStr = getKolkataDateString(publishDate);
        await streakService.recordVerifiedPostDate(payload.studentId, dateStr);
      }
    } catch (err) {
      console.error('Error recording streak date on post.verified:', err.message);
    }
  });

  events.on('post.rejected', async payload => {
    try {
      if (payload.previousStatus === 'verified') {
        const post = await Post.findById(payload.postId);
        if (post) {
          const publishDate = post.extractedData?.publishedAt || post.createdAt;
          const dateStr = getKolkataDateString(publishDate);
          await streakService.removeVerifiedPostDate(payload.studentId, dateStr);
        }
      }
    } catch (err) {
      console.error('Error updating streak on post.rejected:', err.message);
    }
  });
}

module.exports = {
  mountPath: '/admin',
  router,
  init,
};
