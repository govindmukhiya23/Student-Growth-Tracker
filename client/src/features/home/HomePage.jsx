import { Link } from 'react-router-dom';
import { useAuth } from '../../core/AuthContext.jsx';

export default function HomePage() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass-card border border-slate-800 p-6 sm:p-10 lg:p-14 mb-8 sm:mb-10 glow-indigo">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-3 sm:mb-4">
            🚀 Campus Habit Accelerator
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Build your public presence. <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">One post at a time.</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Student Growth Tracker helps students build a daily habit of sharing professional milestones on LinkedIn. Get verified by college mentors, build streaks, and climb the campus leaderboard.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto text-center rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-blue-500 transition-all"
                >
                  Join Your College Cohort
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto text-center rounded-xl glass-panel border border-slate-700 px-5 py-3 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all"
                >
                  Sign In
                </Link>
              </>
            ) : isAdmin ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/admin/students"
                  className="w-full sm:w-auto text-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                  👨‍🎓 Manage Students Directory →
                </Link>
                <Link
                  to="/admin/registrations"
                  className="w-full sm:w-auto text-center rounded-xl glass-panel border border-slate-700 px-5 py-3 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all"
                >
                  Review Approvals
                </Link>
              </div>
            ) : user?.status === 'pending' ? (
              <Link
                to="/pending"
                className="w-full sm:w-auto text-center rounded-xl bg-amber-600/20 border border-amber-500/30 px-6 py-3 text-sm font-semibold text-amber-300 hover:bg-amber-600/30 transition-all flex items-center justify-center gap-2"
              >
                View Pending Approval Status →
              </Link>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 text-xs text-emerald-300 flex items-center gap-2">
                <span>✅ Account Verified</span>
                <span className="text-slate-400">• Ready for Phase 2 Post Submission</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold mb-4">
            🔥
          </div>
          <h3 className="text-base font-semibold text-white">Daily Streaks</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Publish on LinkedIn every day to maintain your streak. One post per calendar day in your campus timezone.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold mb-4">
            🏆
          </div>
          <h3 className="text-base font-semibold text-white">Campus Leaderboard</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Earn 10 points per verified post and a 10-point bonus for completing 7 posts in a week.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold mb-4">
            🛡️
          </div>
          <h3 className="text-base font-semibold text-white">Admin Verification</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Only genuine student accounts and verified posts earn rewards. Fully audited and peer reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}
