import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../core/api';

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'approved' | 'pending' | 'suspended' | 'rejected'
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch all students with real-time polling (every 3 seconds)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ role: 'student', limit: '100' });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      return api.get(`/admin/users?${params.toString()}`);
    },
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  // Mutation for updating student account status
  const statusMutation = useMutation({
    mutationFn: ({ userId, status, reason }) =>
      api.patch(`/admin/users/${userId}/status`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
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
    if (window.confirm('Are you sure you want to suspend this student account? All active sessions will be terminated immediately.')) {
      statusMutation.mutate({ userId, status: 'suspended' });
    }
  };

  const handleReactivate = (userId) => {
    statusMutation.mutate({ userId, status: 'approved' });
  };

  const students = data?.users || [];
  const stats = data?.stats || {
    totalStudents: students.length,
    approved: students.filter((s) => s.status === 'approved' || s.status === 'active').length,
    pending: students.filter((s) => s.status === 'pending').length,
    suspended: students.filter((s) => s.status === 'suspended').length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Registered Students</h1>
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              Admin Directory
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Realtime Sync
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Comprehensive directory of all enrolled students, roll numbers, and account statuses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/registrations"
            className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2"
          >
            <span>Review Pending Approvals</span>
            {stats.pending > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-bold border border-amber-500/30">
                {stats.pending}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Total Students
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats.totalStudents ?? students.length}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Active / Approved
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
            {stats.approved ?? 0}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            Pending Review
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
            {stats.pending ?? 0}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-rose-500/20 bg-rose-500/5">
          <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
            Suspended
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-300">
            {stats.suspended ?? 0}
          </div>
        </div>
      </div>

      {/* Controls: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll no, email, college…"
            className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          {[
            { id: '', label: 'All Students' },
            { id: 'approved', label: 'Approved' },
            { id: 'pending', label: 'Pending' },
            { id: 'suspended', label: 'Suspended' },
            { id: 'rejected', label: 'Rejected' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-2xl glass-card border border-slate-800 shadow-xl">
        {isLoading && students.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            <span className="animate-pulse">Loading registered students…</span>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-xl text-slate-400 mb-3">
              👨‍🎓
            </div>
            <h3 className="text-base font-semibold text-slate-200">No students found</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {search
                ? 'No students matched your search criteria. Try a different query.'
                : statusFilter
                ? `No students found with status "${statusFilter}".`
                : 'No student accounts have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Student ID / Roll No</th>
                  <th className="px-6 py-4">College & Course</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {students.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Student Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs border border-indigo-500/30">
                          {st.name ? st.name[0].toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{st.name}</div>
                          <div className="text-[11px] text-slate-400">
                            @{st.username} • {st.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Student ID / Roll No */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-bold text-indigo-300 tracking-wide">
                        {st.rollNumber || (st.year ? `Yr ${st.year}` : '—')}
                      </span>
                    </td>

                    {/* College & Course */}
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{st.college || '—'}</div>
                      <div className="text-[11px] text-slate-400">{st.course || '—'}</div>
                    </td>

                    {/* Registered Date */}
                    <td className="px-6 py-4 text-slate-400">
                      <div>
                        {new Date(st.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(st.createdAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Status Badge */}
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

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {st.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(st._id)}
                              disabled={statusMutation.isPending}
                              className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReject(st)}
                              disabled={statusMutation.isPending}
                              className="rounded-lg bg-rose-600/20 border border-rose-500/30 px-3 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-600/30 transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {(st.status === 'approved' || st.status === 'active') && (
                          <button
                            onClick={() => handleSuspend(st._id)}
                            disabled={statusMutation.isPending}
                            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition-all cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}

                        {st.status === 'suspended' && (
                          <button
                            onClick={() => handleReactivate(st._id)}
                            disabled={statusMutation.isPending}
                            className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-all cursor-pointer"
                          >
                            Reactivate
                          </button>
                        )}

                        {st.status === 'rejected' && (
                          <button
                            onClick={() => handleApprove(st._id)}
                            disabled={statusMutation.isPending}
                            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-emerald-600/20 hover:text-emerald-300 hover:border-emerald-500/30 transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-card border border-rose-500/30 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Reject Student Registration</h3>
            <p className="mt-1 text-xs text-slate-400">
              Rejecting <strong className="text-slate-200">{rejectModalUser.name}</strong> (@{rejectModalUser.username}). Please provide an explanation that will be shown upon their next login.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectModalUser(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={statusMutation.isPending || !rejectReason.trim()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition-all disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
