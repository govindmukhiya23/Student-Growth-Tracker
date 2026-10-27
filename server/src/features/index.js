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
  // Phase 1: require('./auth'),
  // Phase 1: require('./users'),
  // Phase 1: require('./notifications'),
  // Phase 1: require('./audit'),
  // Phase 2: require('./posts'),
  // Phase 3: require('./points'),
  // Phase 3: require('./streaks'),
  // Phase 3: require('./leaderboard'),
  // Phase 3: require('./dashboard'),
  // Phase 4: require('./reports'),
  // Phase 4: require('./settings'),
];

module.exports = features;
