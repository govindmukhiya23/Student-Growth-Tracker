'use strict';

/**
 * Feature registry — the ONE place features are listed.
 *
 * Adding a feature: create server/src/features/<name>/index.js, then add one line here.
 * Removing a feature: delete the folder and remove its line here.
 *
 * Each feature module must export:
 *   - router (Express Router) — optional, mounted at /api/v1/<name>
 *   - init(app) — optional, called once after all features are registered
 *                 (used to attach event listeners, start background jobs, etc.)
 */

const features = [
  require('./health'),
  require('./auth'),
  require('./users'),
  require('./notifications'),
  require('./audit'),
  require('./posts'),
  require('./points'),
  require('./streaks'),
  require('./leaderboard'),
  require('./dashboard'),
  require('./reports'),
  require('./settings'),
];

module.exports = features;
