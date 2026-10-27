import auth from './auth/index.jsx';
import users from './users/index.jsx';

/**
 * Client feature registry — the ONE place client features are listed.
 */
const clientFeatures = [
  auth,
  users,
  // Phase 2: posts
  // Phase 3: points, streaks, leaderboard, dashboard
  // Phase 4: reports, settings
];

export default clientFeatures;
