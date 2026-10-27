'use strict';

/**
 * Feature flags — toggled here, propagated to clients via GET /api/v1/features.
 * Removing a feature: delete its folder and its line here. No other changes needed.
 */
const features = {
  auth: true,
  posts: true,
  points: true,
  streaks: true,
  leaderboard: true,
  dashboard: true,
  notifications: true,
  audit: true,
  reports: true,
  settings: true,
};

module.exports = features;
