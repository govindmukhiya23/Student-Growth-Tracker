/**
 * Client feature registry — the ONE place client features are listed.
 *
 * Adding a feature: create client/src/features/<name>/index.jsx, then add one entry here.
 * Removing a feature: delete the folder and remove its entry here.
 *
 * Each entry shape:
 * {
 *   id: string,           — unique key, must match the server feature flag name
 *   routes: [             — React Router <Route> props
 *     { path, element, layout? }
 *   ],
 *   navItem?: {           — optional nav link
 *     label, path, icon, roles: ['student'|'admin']
 *   },
 *   dashboardWidget?: {   — optional dashboard widget component
 *     component, roles: ['student'|'admin'], order: number
 *   },
 * }
 *
 * The App router and Dashboard build themselves from this array.
 * No feature is hardcoded in the router — adding/removing touches only this file.
 */

const clientFeatures = [
  // Phase 1: auth, users
  // Phase 2: posts
  // Phase 3: points, streaks, leaderboard, dashboard
  // Phase 4: reports, settings
];

export default clientFeatures;
