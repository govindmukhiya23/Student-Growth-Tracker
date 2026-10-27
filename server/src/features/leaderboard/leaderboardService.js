'use strict';

const mongoose = require('mongoose');
const PointsLedger = require('../points/PointsLedger');
const { getKolkataDateString, getWeekStartDate } = require('../../core/utils/dateUtils');

/**
 * Returns ranked student leaderboard with privacy protection
 */
async function getLeaderboard({ college, course, year, timeframe = 'all', page = 1, limit = 50 }) {
  if (mongoose.connection.readyState !== 1) {
    return [];
  }
  const matchFilter = {};
  const today = getKolkataDateString();

  if (timeframe === 'week') {
    const weekStart = getWeekStartDate(today);
    matchFilter.weekStart = weekStart;
  } else if (timeframe === 'month') {
    const monthPrefix = today.slice(0, 7); // YYYY-MM
    matchFilter.date = new RegExp(`^${monthPrefix}`);
  }

  // Aggregate points by student
  const pipeline = [
    { $match: matchFilter },
    {
      $group: {
        _id: '$studentId',
        totalPoints: { $sum: '$points' },
      },
    },
    // Join with Users to filter by role, college, course, year
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    // Only active/approved students
    {
      $match: {
        'user.role': 'student',
        'user.status': { $in: ['approved', 'active'] },
        ...(college ? { 'user.college': college } : {}),
        ...(course ? { 'user.course': course } : {}),
        ...(year ? { 'user.year': Number(year) } : {}),
      },
    },
    // Join with Streaks
    {
      $lookup: {
        from: 'streaks',
        localField: '_id',
        foreignField: 'studentId',
        as: 'streak',
      },
    },
    {
      $addFields: {
        streakDoc: { $arrayElemAt: ['$streak', 0] },
      },
    },
    {
      $project: {
        _id: 1,
        studentId: '$_id',
        name: '$user.name',
        username: '$user.username',
        college: '$user.college',
        course: '$user.course',
        year: '$user.year',
        totalPoints: 1,
        currentStreak: { $ifNull: ['$streakDoc.currentStreak', 0] },
        longestStreak: { $ifNull: ['$streakDoc.longestStreak', 0] },
      },
    },
    // Sort descending by points, then longest streak
    {
      $sort: {
        totalPoints: -1,
        longestStreak: -1,
        currentStreak: -1,
        name: 1,
      },
    },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];

  const results = await PointsLedger.aggregate(pipeline);

  // Add 1-indexed rank
  const ranked = results.map((item, idx) => ({
    rank: (page - 1) * limit + idx + 1,
    ...item,
  }));

  return ranked;
}

/**
 * Gets student's rank on the leaderboard
 */
async function getStudentRank(studentId) {
  const allRanked = await getLeaderboard({ timeframe: 'all', limit: 1000, page: 1 });
  const found = allRanked.find(r => r.studentId.toString() === studentId.toString());
  return found ? found.rank : null;
}

module.exports = {
  getLeaderboard,
  getStudentRank,
};
