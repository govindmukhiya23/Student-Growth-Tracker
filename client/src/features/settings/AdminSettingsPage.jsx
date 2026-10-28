import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../core/api';
import { useAuth } from '../../core/AuthContext.jsx';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    pointsPerPost: 10,
    weeklyBonusPoints: 10,
    timezone: 'Asia/Kolkata',
    requireAdminApproval: true,
  });
  const [feedback, setFeedback] = useState(null);

  // Admin Account Credentials State
  const [accountData, setAccountData] = useState({
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [accountFeedback, setAccountFeedback] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings'),
  });

  useEffect(() => {
    if (user?.username) {
      setAccountData((prev) => ({ ...prev, username: user.username }));
    }
  }, [user]);

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

  const accountMutation = useMutation({
    mutationFn: (creds) => api.patch('/admin/account', creds),
    onSuccess: (res) => {
      setAccountFeedback({ type: 'success', message: res.message || 'Admin credentials updated successfully!' });
      setAccountData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setTimeout(() => setAccountFeedback(null), 5000);
    },
    onError: (err) => {
      setAccountFeedback({ type: 'error', message: err.message || 'Failed to update admin credentials.' });
    },
  });

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    setAccountFeedback(null);

    if (accountData.newPassword) {
      if (accountData.newPassword.length < 10) {
        setAccountFeedback({ type: 'error', message: 'New password must be at least 10 characters long.' });
        return;
      }
      if (accountData.newPassword !== accountData.confirmPassword) {
        setAccountFeedback({ type: 'error', message: 'New passwords do not match.' });
        return;
      }
      if (!accountData.currentPassword) {
        setAccountFeedback({ type: 'error', message: 'Current password is required to change password.' });
        return;
      }
    }

    accountMutation.mutate({
      username: accountData.username,
      currentPassword: accountData.currentPassword || undefined,
      newPassword: accountData.newPassword || undefined,
    });
  };

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
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Platform Settings & Scoring</h1>
          <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            System Config
          </span>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
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
            className="w-full sm:w-auto justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-blue-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving Settings…' : 'Save Platform Settings'}
          </button>
        </div>
      </form>

      {/* Admin Credentials Form */}
      <div className="mt-12 pt-8 border-t border-slate-800">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Admin Account & Credentials</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Security
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Change your administrator username or update your password
          </p>
        </div>

        {accountFeedback && (
          <div
            className={`mb-6 rounded-xl p-4 text-xs flex items-center gap-2.5 border ${
              accountFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <span className="text-base font-bold">
              {accountFeedback.type === 'success' ? '✅' : '⚠️'}
            </span>
            <span>{accountFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleAccountSubmit} className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          {/* Change Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Username
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={30}
              value={accountData.username}
              onChange={(e) => setAccountData((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="e.g. admin or superadmin"
              className="w-full sm:max-w-md rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">Used to log in to the admin portal.</p>
          </div>

          <div className="border-t border-slate-800/80 pt-6">
            <h3 className="text-sm font-semibold text-white mb-1">Change Password</h3>
            <p className="text-xs text-slate-400 mb-4">Leave password fields blank if you only want to change your username.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={accountData.currentPassword}
                  onChange={(e) => setAccountData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  minLength={10}
                  value={accountData.newPassword}
                  onChange={(e) => setAccountData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Min 10 characters"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={accountData.confirmPassword}
                  onChange={(e) => setAccountData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={accountMutation.isPending}
              className="w-full sm:w-auto justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {accountMutation.isPending ? 'Updating Credentials…' : 'Update Admin Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
