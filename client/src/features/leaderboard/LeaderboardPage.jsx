import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../core/api';

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'month' | 'week'
  const [college, setCollege] = useState('');
  const [year, setYear] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', timeframe, college, year],
    queryFn: () => {
      const params = new URLSearchParams({ timeframe });
      if (college) params.set('college', college);
      if (year) params.set('year', year);
      return api.get(`/leaderboard?${params.toString()}`);
    },
  });

  const list = data?.leaderboard || [];
  const topThree = list.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Campus Leaderboard</h1>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-amber-400 border border-amber-500/20">
              Rankings & Streaks
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Top students building their professional presence and LinkedIn posting streaks
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800 self-start sm:self-auto w-full sm:w-auto justify-center">
          {[
            { label: 'All Time', val: 'all' },
            { label: 'This Month', val: 'month' },
            { label: 'This Week', val: 'week' },
          ].map((t) => (
            <button
              key={t.val}
              onClick={() => setTimeframe(t.val)}
              className={`flex-1 sm:flex-none text-center rounded-lg px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                timeframe === t.val
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {topThree.map((st, i) => {
            const medalColors = [
              'border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-slate-900/60 shadow-amber-500/10',
              'border-slate-300/40 bg-gradient-to-b from-slate-300/10 to-slate-900/60',
              'border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-slate-900/60',
            ];
            const badges = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];

            return (
              <div
                key={st.studentId}
                className={`glass-card rounded-2xl p-6 border shadow-xl flex flex-col justify-between ${medalColors[i]}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white tracking-wider">{badges[i]}</span>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      🔥 {st.currentStreak}d Streak
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{st.name}</h3>
                  <p className="text-xs text-slate-400">
                    @{st.username} • {st.college || 'Campus'} (Yr {st.year})
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Points</div>
                    <div className="text-2xl font-black text-white">{st.totalPoints}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Best Streak</div>
                    <div className="text-sm font-bold text-indigo-300">{st.longestStreak} days</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="overflow-hidden rounded-2xl glass-card border border-slate-800 shadow-xl">
        <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="Filter by college…"
            className="rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Years</option>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            <span className="animate-pulse">Loading rankings…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No rankings available for the selected filters.
          </div>
        ) : (
          <div className="table-responsive-container">
            <div className="block sm:hidden text-center text-[10px] text-slate-500 py-1.5 bg-slate-900/60 border-b border-slate-800">
              ← Swipe horizontally to see full rankings →
            </div>
            <table className="w-full min-w-[620px] text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">Rank</th>
                  <th className="px-4 sm:px-6 py-3.5">Student</th>
                  <th className="px-4 sm:px-6 py-3.5">College & Year</th>
                  <th className="px-4 sm:px-6 py-3.5">Current Streak</th>
                  <th className="px-4 sm:px-6 py-3.5">Best Streak</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {list.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          st.rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : st.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : st.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {st.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{st.name}</div>
                      <div className="text-[11px] text-slate-400">@{st.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{st.college || '—'}</div>
                      <div className="text-[11px] text-slate-400">
                        {st.course} • Yr {st.year}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                        🔥 {st.currentStreak}d
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{st.longestStreak} days</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-white">{st.totalPoints}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
