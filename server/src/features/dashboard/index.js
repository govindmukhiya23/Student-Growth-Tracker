'use strict';

const { Router } = require('express');
const {
  authenticate,
  loadUser,
  requireApproved,
  requireRole,
} = require('../../core/middleware/auth');
const pointsService = require('../points/pointsService');
const streakService = require('../streaks/streakService');
const leaderboardService = require('../leaderboard/leaderboardService');
const Post = require('../posts/Post');
const User = require('../users/User');
const PointsLedger = require('../points/PointsLedger');
const { getKolkataDateString, getWeekStartDate } = require('../../core/utils/dateUtils');

const router = Router();

/**
 * GET /api/v1/dashboard/student
 * Student overview: score, streak, 7-day progress, rank, recent activity
 */
router.get('/student', authenticate, loadUser, requireApproved, async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const today = getKolkataDateString();
    const currentWeekStart = getWeekStartDate(today);

    // Calculate week day dates (Monday to Sunday)
    const weekDays = [];
    const monday = new Date(currentWeekStart + 'T00:00:00Z');
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      weekDays.push({
        dayName: dayLabels[i],
        dateStr: d.toISOString().split('T')[0],
      });
    }

    const [points, streak, rank, weekPosts, recentPosts] = await Promise.all([
      pointsService.getStudentPointsTotal(studentId),
      streakService.getStudentStreak(studentId),
      leaderboardService.getStudentRank(studentId),
      PointsLedger.distinct('date', {
        studentId,
        weekStart: currentWeekStart,
        type: 'post_verified',
      }),
      Post.find({ studentId })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const activeDaysSet = new Set(weekPosts);
    const weeklyProgress = weekDays.map(wd => ({
      ...wd,
      posted: activeDaysSet.has(wd.dateStr),
      isToday: wd.dateStr === today,
    }));

    res.json({
      points,
      streak: {
        current: streak.currentStreak || 0,
        longest: streak.longestStreak || 0,
        lastActiveDate: streak.lastActiveDate,
      },
      rank: rank || '—',
      weeklyProgress,
      weeklyProgressCount: activeDaysSet.size,
      recentPosts,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/dashboard
 * Administrative overview metrics
 */
router.get('/admin', authenticate, loadUser, requireRole('admin'), async (_req, res, next) => {
  try {
    const [
      totalStudents,
      pendingRegistrations,
      totalPosts,
      pendingPosts,
      verifiedPosts,
      rejectedPosts,
      pointsAggregate,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', status: { $in: ['approved', 'active'] } }),
      User.countDocuments({ role: 'student', status: 'pending' }),
      Post.countDocuments(),
      Post.countDocuments({ status: { $in: ['pending', 'needs_review'] } }),
      Post.countDocuments({ status: 'verified' }),
      Post.countDocuments({ status: 'rejected' }),
      PointsLedger.aggregate([{ $group: { _id: null, total: { $sum: '$points' } } }]),
    ]);

    res.json({
      students: {
        totalApproved: totalStudents,
        pendingApproval: pendingRegistrations,
      },
      posts: {
        total: totalPosts,
        pendingReview: pendingPosts,
        verified: verifiedPosts,
        rejected: rejectedPosts,
      },
      points: {
        totalAwarded: pointsAggregate[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = {
  mountPath: '/dashboard',
  router,
};
