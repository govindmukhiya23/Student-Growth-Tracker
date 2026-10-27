import auth from './auth/index.jsx';
import users from './users/index.jsx';
import posts from './posts/index.jsx';
import leaderboard from './leaderboard/index.jsx';
import dashboard from './dashboard/index.jsx';
import reports from './reports/index.jsx';
import settings from './settings/index.jsx';

/**
 * Client feature registry — the ONE place client features are listed.
 */
const clientFeatures = [
  auth,
  users,
  posts,
  leaderboard,
  dashboard,
  reports,
  settings,
];

export default clientFeatures;
