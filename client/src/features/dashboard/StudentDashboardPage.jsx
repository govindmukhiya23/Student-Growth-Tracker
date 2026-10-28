import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../core/api';
import SubmitPostModal from '../../core/SubmitPostModal.jsx';

export default function StudentDashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/dashboard/student'),
  });

  const points = data?.points || 0;
  const streak = data?.streak || { current: 0, longest: 0 };
  const rank = data?.rank || '—';
  const weeklyProgress = data?.weeklyProgress || [];
  const weeklyCount = data?.weeklyProgressCount || 0;
  const recentPosts = data?.recentPosts || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Student Growth Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Track your daily LinkedIn posting habit, streak momentum, and campus standing
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-blue-500 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="text-base font-bold leading-none">+</span>
          Submit Today&apos;s Post
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Streak Flame Card */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-amber-500/30 glow-indigo relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">Active Streak</span>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white">{streak.current} <span className="text-base sm:text-lg font-semibold text-slate-400">Days</span></div>
          <p className="mt-2 text-xs text-slate-400">
            Personal record: <span className="text-amber-300 font-semibold">{streak.longest} consecutive days</span>
          </p>
        </div>

        {/* Total Points */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-indigo-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-indigo-400 uppercase tracking-wider">Growth Points</span>
            <span className="text-2xl">⭐</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white">{points}</div>
          <p className="mt-2 text-xs text-slate-400">
            10 pts per verified post + 10 pts weekly bonus
          </p>
        </div>

        {/* Campus Rank */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-cyan-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-cyan-400 uppercase tracking-wider">Campus Standing</span>
            <span className="text-2xl">🏆</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white">
            {rank !== '—' ? `#${rank}` : 'Unranked'}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            <Link to="/leaderboard" className="text-cyan-400 hover:underline">
              View full leaderboard →
            </Link>
          </p>
        </div>
      </div>

      {/* Weekly Habit Tracker (Mon-Sun) */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 mb-6 sm:mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex flex-wrap items-center gap-2">
              Weekly Habit Streak
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                {weeklyCount}/7 Days Completed
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Complete all 7 days in a calendar week to claim your +10 bonus points!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-3">
          {weeklyProgress.map((day) => (
            <div
              key={day.dateStr}
              className={`rounded-xl sm:rounded-2xl p-1.5 sm:p-4 text-center border transition-all ${
                day.posted
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : day.isToday
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white ring-1 ring-indigo-500'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] sm:text-xs font-bold uppercase truncate">{day.dayName}</div>
              <div className="text-sm sm:text-2xl mt-0.5 sm:mt-1 font-extrabold">
                {day.posted ? '✓' : day.isToday ? '⏳' : '—'}
              </div>
              <div className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 text-slate-400 truncate">
                {day.dateStr.slice(5)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Recent Submissions</h2>
          <Link to="/posts/mine" className="text-xs font-semibold text-indigo-400 hover:underline">
            View All Submissions →
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading activity…</div>
        ) : recentPosts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No posts submitted yet. Share a LinkedIn post to start your streak!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recentPosts.map((post) => (
              <div key={post._id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {post.extractedData?.ogImage && (
                    <img
                      src={post.extractedData.ogImage}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700/60 shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          post.status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : post.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {post.status}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">
                      {post.extractedData?.textSnippet || post.originalUrl}
                    </p>
                  </div>
                </div>

                <a
                  href={post.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 shrink-0"
                >
                  View ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <SubmitPostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
