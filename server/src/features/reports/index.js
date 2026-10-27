'use strict';

const { Router } = require('express');
const { authenticate, loadUser, requireRole } = require('../../core/middleware/auth');
const User = require('../users/User');
const Streak = require('../streaks/Streak');
const PointsLedger = require('../points/PointsLedger');
const Post = require('../posts/Post');
const { toCsv } = require('./csvUtils');
const { getKolkataDateString } = require('../../core/utils/dateUtils');
const events = require('../../core/events');

const router = Router();

router.use(authenticate, loadUser, requireRole('admin'));

const CSV_HEADERS = [
  { key: 'name', label: 'Student Name' },
  { key: 'email', label: 'Email' },
  { key: 'username', label: 'Username' },
  { key: 'college', label: 'College' },
  { key: 'course', label: 'Course' },
  { key: 'year', label: 'Year' },
  { key: 'status', label: 'Account Status' },
  { key: 'currentStreak', label: 'Current Streak (Days)' },
  { key: 'longestStreak', label: 'Longest Streak (Days)' },
  { key: 'totalPoints', label: 'Growth Points' },
  { key: 'totalPosts', label: 'Total Posts' },
  { key: 'verifiedPosts', label: 'Verified Posts' },
  { key: 'registeredAt', label: 'Registration Date' },
];

/**
 * GET /api/v1/admin/reports/export
 * Generates downloadable CSV report of all students with formula injection mitigation
 */
router.get('/reports/export', async (req, res, next) => {
  try {
    const query = { role: 'student' };
    if (req.query.college) query.college = req.query.college;
    if (req.query.status) query.status = req.query.status;

    const students = await User.find(query).sort({ createdAt: -1 });

    const studentIds = students.map(s => s._id);

    // Fetch related aggregates in parallel
    const [streaks, pointsAgg, postsAgg] = await Promise.all([
      Streak.find({ studentId: { $in: studentIds } }),
      PointsLedger.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        { $group: { _id: '$studentId', total: { $sum: '$points' } } },
      ]),
      Post.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        {
          $group: {
            _id: '$studentId',
            total: { $sum: 1 },
            verified: {
              $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const streakMap = new Map(streaks.map(s => [s.studentId.toString(), s]));
    const pointsMap = new Map(pointsAgg.map(p => [p._id.toString(), p.total]));
    const postMap = new Map(postsAgg.map(p => [p._id.toString(), p]));

    const rows = students.map(st => {
      const sId = st._id.toString();
      const stStreak = streakMap.get(sId);
      const stPost = postMap.get(sId);

      return {
        name: st.name,
        email: st.email,
        username: st.username,
        college: st.college || '',
        course: st.course || '',
        year: st.year || 1,
        status: st.status,
        currentStreak: stStreak?.currentStreak || 0,
        longestStreak: stStreak?.longestStreak || 0,
        totalPoints: pointsMap.get(sId) || 0,
        totalPosts: stPost?.total || 0,
        verifiedPosts: stPost?.verified || 0,
        registeredAt: st.createdAt ? st.createdAt.toISOString().split('T')[0] : '',
      };
    });

    const csvOutput = toCsv(CSV_HEADERS, rows);
    const dateTag = getKolkataDateString();
    const filename = `student-growth-report-${dateTag}.csv`;

    events.emit('reports.exported', {
      adminId: req.user._id,
      studentCount: rows.length,
      ip: req.ip,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvOutput);
  } catch (err) {
    next(err);
  }
});

module.exports = {
  mountPath: '/admin',
  router,
};
