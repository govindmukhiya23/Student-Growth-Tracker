import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 py-3 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 font-bold text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            GT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white sm:text-lg">
                Student Growth Tracker
              </span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">LinkedIn habit building & leaderboards</p>
          </div>
        </Link>

        {/* Navigation / User Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/leaderboard"
                className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-2.5 py-1.5"
              >
                Leaderboard
              </Link>

              {isAdmin ? (
                <>
                  <Link
                    to="/admin/students"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      location.pathname === '/admin/students' || location.pathname === '/admin'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/80'
                    }`}
                  >
                    <span>👨‍🎓 Students</span>
                  </Link>
                  <Link
                    to="/admin/registrations"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      location.pathname === '/admin/registrations'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/80'
                    }`}
                  >
                    Approvals
                  </Link>
                  <Link
                    to="/admin/posts"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      location.pathname === '/admin/posts'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                    Post Queue
                  </Link>
                  <Link
                    to="/admin/reports"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      location.pathname === '/admin/reports'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/80'
                    }`}
                  >
                    Reports
                  </Link>
                  <Link
                    to="/admin/settings"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      location.pathname === '/admin/settings'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/80'
                    }`}
                  >
                    Settings
                  </Link>
                </>
              ) : (user.status === 'approved' || user.status === 'active') ? (
                <>
                  <Link
                    to="/dashboard"
                    className="rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors border border-indigo-500/30 flex items-center gap-1.5"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/posts/mine"
                    className="rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700/80 transition-colors border border-slate-700/80 flex items-center gap-1.5"
                  >
                    My Submissions
                  </Link>
                </>
              ) : null}

              {/* User badge */}
              <div className="flex items-center gap-2.5 rounded-xl glass-card px-3 py-1.5 border border-slate-700/60">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-indigo-400 border border-slate-700">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-slate-200">{user.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold uppercase ${
                        user.status === 'approved' || user.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : user.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
                title="Logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/leaderboard"
                className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
              >
                Leaderboard
              </Link>
              <Link
                to="/login"
                className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-blue-700 transition-all hover:shadow-indigo-500/30"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
