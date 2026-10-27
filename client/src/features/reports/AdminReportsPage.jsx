import { useState } from 'react';
import api from '../../core/api';

export default function AdminReportsPage() {
  const [college, setCollege] = useState('');
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (college) params.set('college', college);
      if (status) params.set('status', status);

      const token = api.getAccessToken();
      const res = await fetch(`/api/v1/admin/reports/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Export failed with HTTP status ${res.status}`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `student-growth-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err.message || 'Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">Student Growth Analytics & Reports</h1>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            Export Engine
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Generate sanitized CSV reports of student participation, streaks, and verified post totals
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* Export Configuration Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl mb-8">
        <h2 className="text-base font-bold text-white mb-4">Export Filters</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              College Filter (Optional)
            </label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. Engineering College"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Student Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Statuses (Approved, Pending, Suspended)</option>
              <option value="approved">Approved / Active Only</option>
              <option value="pending">Pending Approval</option>
              <option value="suspended">Suspended Accounts</option>
              <option value="rejected">Rejected Accounts</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Output: <span className="text-white font-mono">.csv</span> with UTF-8 encoding
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {downloading ? 'Preparing CSV…' : '📥 Download CSV Report'}
          </button>
        </div>
      </div>

      {/* Security & Compliance Banner */}
      <div className="rounded-2xl bg-indigo-950/20 border border-indigo-900/40 p-5 text-xs text-indigo-300 leading-relaxed flex items-start gap-3">
        <span className="text-lg">🛡️</span>
        <div>
          <div className="font-semibold text-indigo-200">Anti-Formula Injection Protection (SECURITY.md §176)</div>
          <p className="mt-0.5 text-indigo-300/80">
            All user-submitted strings are automatically sanitized to neutralize spreadsheet formula injection vulnerabilities. Any cell starting with =, +, -, @, or tab characters is prefixed with an apostrophe.
          </p>
        </div>
      </div>
    </div>
  );
}
