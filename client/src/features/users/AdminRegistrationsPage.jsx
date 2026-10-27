import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../core/api';

export default function AdminRegistrationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [search, setSearch] = useState('');
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch pending registrations
  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['admin-registrations'],
    queryFn: () => api.get('/admin/registrations?limit=50'),
  });

  // Fetch all users
  const { data: allUsersData, isLoading: loadingAll } = useQuery({
    queryKey: ['admin-all-users', search],
    queryFn: () => api.get(`/admin/users?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`),
    enabled: activeTab === 'all',
  });

  // Mutation for updating status
  const statusMutation = useMutation({
    mutationFn: ({ userId, status, reason }) =>
      api.patch(`/admin/users/${userId}/status`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      setRejectModalUser(null);
      setRejectReason('');
    },
  });

  const handleApprove = (userId) => {
    statusMutation.mutate({ userId, status: 'approved' });
  };

  const handleOpenReject = (user) => {
    setRejectModalUser(user);
    setRejectReason('Student enrollment details could not be verified with college records.');
  };

  const handleConfirmReject = () => {
    if (!rejectModalUser) return;
    statusMutation.mutate({
      userId: rejectModalUser._id,
      status: 'rejected',
      reason: rejectReason,
    });
  };

  const handleSuspend = (userId) => {
    if (window.confirm('Are you sure you want to suspend this account? All active sessions will be terminated immediately.')) {
      statusMutation.mutate({ userId, status: 'suspended' });
    }
  };

  const handleReactivate = (userId) => {
    statusMutation.mutate({ userId, status: 'approved' });
  };

  const pendingList = pendingData?.registrations || [];
  const allList = allUsersData?.users || [];
  const displayList = activeTab === 'pending' ? pendingList : allList;
  const isLoading = activeTab === 'pending' ? loadingPending : loadingAll;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Student Approvals & Management</h1>
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              Admin Control
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Review student registrations, grant posting privileges, or manage existing accounts
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('pending')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Queue ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Accounts
          </button>
        </div>
      </div>

      {/* Search bar for 'all' tab */}
      {activeTab === 'all' && (
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, username, or email…"
            className="w-full sm:max-w-md rounded-xl bg-slate-900/80 border border-slate-700/80 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Main Table / Grid */}
      <div className="overflow-hidden rounded-2xl glass-card border border-slate-800 shadow-xl">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            <span className="animate-pulse">Loading registrations…</span>
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-xl text-slate-400 mb-3">
              ✓
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              {activeTab === 'pending' ? 'All caught up!' : 'No accounts found'}
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {activeTab === 'pending'
                ? 'There are currently no pending student registrations waiting for review.'
                : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">College & Course</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">Registered</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {displayList.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{st.name}</div>
                      <div className="text-[11px] text-slate-400">
                        @{st.username} • {st.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{st.college || '—'}</div>
                      <div className="text-[11px] text-slate-400">{st.course || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300">
                        Yr {st.year}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(st.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          st.status === 'approved' || st.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : st.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {st.role === 'admin' ? (
                        <span className="text-slate-500 text-[11px]">Admin account</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {st.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(st._id)}
                                disabled={statusMutation.isPending}
                                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenReject(st)}
                                disabled={statusMutation.isPending}
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {st.status === 'approved' && (
                            <button
                              onClick={() => handleSuspend(st._id)}
                              disabled={statusMutation.isPending}
                              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          {(st.status === 'suspended' || st.status === 'rejected') && (
                            <button
                              onClick={() => handleReactivate(st._id)}
                              disabled={statusMutation.isPending}
                              className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl glass-card p-6 shadow-2xl border border-rose-500/30">
            <h3 className="text-lg font-bold text-white">Reject Application</h3>
            <p className="mt-1 text-xs text-slate-300">
              Rejecting <span className="font-semibold text-white">{rejectModalUser.name}</span> (@{rejectModalUser.username}). Please provide a reason to display to the student.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRejectModalUser(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={statusMutation.isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-600/30 cursor-pointer"
              >
                {statusMutation.isPending ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
