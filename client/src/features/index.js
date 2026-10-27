import auth from './auth/index.jsx';
import users from './users/index.jsx';
import posts from './posts/index.jsx';

/**
 * Client feature registry — the ONE place client features are listed.
 */
const clientFeatures = [
  auth,
  users,
  posts,
  // Phase 3: points, streaks, leaderboard, dashboard
  // Phase 4: reports, settings
];

export default clientFeatures;
