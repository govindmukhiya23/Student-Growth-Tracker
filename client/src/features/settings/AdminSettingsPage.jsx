import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../core/api';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    pointsPerPost: 10,
    weeklyBonusPoints: 10,
    timezone: 'Asia/Kolkata',
    requireAdminApproval: true,
  });
  const [feedback, setFeedback] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings'),
  });

  useEffect(() => {
    if (data?.settings) {
      setFormData({
        pointsPerPost: data.settings.pointsPerPost ?? 10,
        weeklyBonusPoints: data.settings.weeklyBonusPoints ?? 10,
        timezone: data.settings.timezone || 'Asia/Kolkata',
        requireAdminApproval: data.settings.requireAdminApproval ?? true,
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (newSettings) => api.patch('/admin/settings', newSettings),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setFeedback({ type: 'success', message: res.message || 'Settings saved successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to update settings.' });
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      pointsPerPost: Number(formData.pointsPerPost),
      weeklyBonusPoints: Number(formData.weeklyBonusPoints),
      timezone: formData.timezone,
      requireAdminApproval: formData.requireAdminApproval,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings & Scoring</h1>
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            System Config
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Configure point reward rates, campus timezone, and student approval policies
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-6 rounded-xl p-4 text-xs flex items-center gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scoring Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4">Point Scoring Policy</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Points Per Verified Post
              </label>
              <input
                type="number"
                name="pointsPerPost"
                required
                min={1}
                max={100}
                value={formData.pointsPerPost}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">Default: 10 points. Daily cap applies (1 post/day).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Weekly 7-Day Habit Bonus Points
              </label>
              <input
                type="number"
                name="weeklyBonusPoints"
                required
                min={0}
                max={100}
                value={formData.weeklyBonusPoints}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">Bonus awarded when student posts all 7 days in a calendar week.</p>
            </div>
          </div>
        </div>

        {/* Platform Policy Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4">Timezone & Approval Policy</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Campus Timezone
              </label>
              <input
                type="text"
                name="timezone"
                required
                value={formData.timezone}
                onChange={handleChange}
                placeholder="Asia/Kolkata"
                className="w-full sm:max-w-md rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">Used for streak day roll-over and calendar week calculations.</p>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <input
                type="checkbox"
                id="requireAdminApproval"
                name="requireAdminApproval"
                checked={formData.requireAdminApproval}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="requireAdminApproval" className="text-xs text-slate-300 cursor-pointer">
                Require Administrator Approval for new student registrations
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || updateMutation.isPending}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-blue-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving Settings…' : 'Save Platform Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
