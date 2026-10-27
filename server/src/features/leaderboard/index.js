'use strict';

const { Router } = require('express');
const { getLeaderboard } = require('./leaderboardService');

const router = Router();

/**
 * GET /api/v1/leaderboard
 * Public ranking of students by verified post points and streaks
 */
router.get('/', async (req, res, next) => {
  try {
    const { college, course, year, timeframe = 'all', page = 1, limit = 50 } = req.query;

    const leaderboard = await getLeaderboard({
      college,
      course,
      year: year ? Number(year) : undefined,
      timeframe,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 100),
    });

    res.json({
      leaderboard,
      timeframe,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = {
  mountPath: '/leaderboard',
  router,
};
