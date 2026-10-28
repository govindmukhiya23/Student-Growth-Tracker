import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinksAdmin = [
    { to: '/admin/students', label: '👨‍🎓 Students' },
    { to: '/admin/registrations', label: 'Approvals' },
    { to: '/admin/posts', label: 'Post Queue', highlight: true },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/settings', label: 'Settings' },
  ];

  const navLinksStudent = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/posts/mine', label: 'My Submissions' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 font-bold text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105 text-sm sm:text-base">
            GT
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold tracking-tight text-white text-sm sm:text-base lg:text-lg">
                Student Growth Tracker
              </span>
              <span className="rounded-full bg-indigo-500/10 px-1.5 py-0.2 text-[10px] sm:text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block">LinkedIn habit building & leaderboards</p>
          </div>
        </Link>

        {/* Desktop Navigation (lg+) */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/leaderboard"
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              location.pathname === '/leaderboard' ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white'
            }`}
          >
            Leaderboard
          </Link>

          {user && (
            <>
              {isAdmin ? (
                <>
                  {navLinksAdmin.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        location.pathname === item.to
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/80'
                      }`}
                    >
                      {item.highlight && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>}
                      {item.label}
                    </Link>
                  ))}
                </>
              ) : (user.status === 'approved' || user.status === 'active') ? (
                <>
                  {navLinksStudent.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        location.pathname === item.to
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/80'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              ) : null}

              {/* User badge */}
              <div className="flex items-center gap-2 rounded-xl glass-card px-2.5 py-1 border border-slate-700/60">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-[11px] font-bold text-indigo-400 border border-slate-700">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-slate-200 max-w-[100px] truncate">{user.name}</div>
                  <div className="text-[9px] text-slate-400 capitalize">{user.role}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
                title="Logout"
              >
                Logout
              </button>
            </>
          )}

          {!user && (
            <div className="flex items-center gap-2">
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

        {/* Mobile / Tablet Header Controls (visible on < lg) */}
        <div className="flex lg:hidden items-center gap-2">
          {user && (
            <div className="flex items-center gap-1.5 rounded-lg glass-card px-2 py-1 border border-slate-800">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600/30 text-[10px] font-bold text-indigo-300">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-[11px] font-medium text-slate-200 max-w-[80px] sm:max-w-[120px] truncate">
                {user.name}
              </span>
            </div>
          )}

          {/* Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none transition-colors"
          >
            {mobileMenuOpen ? (
              <span className="text-lg font-bold leading-none">✕</span>
            ) : (
              <span className="text-xl leading-none">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 rounded-2xl glass-card border border-slate-800 p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-2">
            <Link
              to="/leaderboard"
              className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all flex items-center justify-between ${
                location.pathname === '/leaderboard'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span>🏆 Campus Leaderboard</span>
              <span className="text-[10px] text-slate-400">Rankings</span>
            </Link>

            {user ? (
              <>
                <div className="pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  {isAdmin ? 'Admin Management' : 'Student Menu'}
                </div>

                {isAdmin &&
                  navLinksAdmin.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all flex items-center justify-between ${
                        location.pathname === item.to
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.highlight && (
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      )}
                    </Link>
                  ))}

                {!isAdmin && (user.status === 'approved' || user.status === 'active') &&
                  navLinksStudent.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all flex items-center justify-between ${
                        location.pathname === item.to
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  ))}

                <div className="pt-3 mt-1 border-t border-slate-800 flex items-center justify-between px-1">
                  <div className="text-left">
                    <div className="text-xs font-semibold text-white">{user.name}</div>
                    <div className="text-[10px] text-slate-400">@{user.username} • {user.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="w-full text-center rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
