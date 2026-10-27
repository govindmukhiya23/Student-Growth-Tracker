import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../core/api';

export default function AdminVerificationQueuePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'needs_review' | 'verified' | 'rejected' | ''
  const [rejectModalPost, setRejectModalPost] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [metricsModalPost, setMetricsModalPost] = useState(null);
  const [metricsData, setMetricsData] = useState({ likes: 0, comments: 0, reposts: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-posts-queue', statusFilter],
    queryFn: () =>
      api.get(`/admin/posts?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`),
  });

  // Review mutation (verify or reject)
  const reviewMutation = useMutation({
    mutationFn: ({ postId, action, note }) =>
      api.patch(`/admin/posts/${postId}/review`, { action, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts-queue'] });
      setRejectModalPost(null);
      setRejectNote('');
    },
  });

  // Metrics mutation
  const metricsMutation = useMutation({
    mutationFn: ({ postId, metrics }) =>
      api.patch(`/admin/posts/${postId}/metrics`, metrics),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts-queue'] });
      setMetricsModalPost(null);
    },
  });

  const handleVerify = (postId) => {
    reviewMutation.mutate({ postId, action: 'verify' });
  };

  const handleOpenReject = (post) => {
    setRejectModalPost(post);
    setRejectNote('Post does not contain relevant professional or learning milestones.');
  };

  const handleConfirmReject = () => {
    if (!rejectModalPost) return;
    reviewMutation.mutate({
      postId: rejectModalPost._id,
      action: 'reject',
      note: rejectNote,
    });
  };

  const handleOpenMetrics = (post) => {
    setMetricsModalPost(post);
    setMetricsData({
      likes: post.metrics?.likes || 0,
      comments: post.metrics?.comments || 0,
      reposts: post.metrics?.reposts || 0,
    });
  };

  const handleConfirmMetrics = (e) => {
    e.preventDefault();
    if (!metricsModalPost) return;
    metricsMutation.mutate({
      postId: metricsModalPost._id,
      metrics: metricsData,
    });
  };

  const posts = data?.posts || [];
  const queueCounts = data?.queueCounts || { total: 0, pending: 0, needsReview: 0 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Post Verification Queue</h1>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              Admin Review
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Verify submitted student LinkedIn posts to award daily streak credits and points
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl glass-card px-4 py-2 border border-amber-500/30 text-xs">
            <span className="text-slate-400">Pending: </span>
            <span className="font-bold text-amber-300">{queueCounts.pending}</span>
          </div>
          <div className="rounded-xl glass-card px-4 py-2 border border-cyan-500/30 text-xs">
            <span className="text-slate-400">Needs Review: </span>
            <span className="font-bold text-cyan-300">{queueCounts.needsReview}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
        {[
          { label: 'Pending Review', val: 'pending' },
          { label: 'Needs Review', val: 'needs_review' },
          { label: 'Verified', val: 'verified' },
          { label: 'Rejected', val: 'rejected' },
          { label: 'All Submissions', val: '' },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setStatusFilter(tab.val)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === tab.val
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue Cards */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          <span className="animate-pulse">Loading verification queue…</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-xl text-slate-400 mb-3">
            ✓
          </div>
          <h3 className="text-base font-semibold text-slate-200">No posts in this queue</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter
              ? `No posts found with status "${statusFilter}".`
              : 'The verification queue is empty.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            >
              {/* Left: Student & Content Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className="font-semibold text-white text-sm">
                    {post.studentId?.name || 'Unknown Student'}
                  </span>
                  <span className="text-xs text-slate-400">
                    @{post.studentId?.username} • {post.studentId?.college || 'College'} (Yr {post.studentId?.year})
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      post.status === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : post.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : post.status === 'needs_review'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {post.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Snippet / Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                  {post.extractedData?.textSnippet || 'No snippet preview available.'}
                </p>

                {/* Footer details: link, metrics, date */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <a
                    href={post.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                  >
                    Open Post on LinkedIn ↗
                  </a>
                  <span>•</span>
                  <span>👍 {post.metrics?.likes || 0}</span>
                  <span>💬 {post.metrics?.comments || 0}</span>
                  <span>🔁 {post.metrics?.reposts || 0}</span>
                  <span>•</span>
                  <span className="text-slate-500">
                    Submitted{' '}
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Right: Review Actions */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => handleOpenMetrics(post)}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Edit Metrics
                </button>

                {post.status !== 'verified' && (
                  <button
                    onClick={() => handleVerify(post._id)}
                    disabled={reviewMutation.isPending}
                    className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    Verify
                  </button>
                )}

                {post.status !== 'rejected' && (
                  <button
                    onClick={() => handleOpenReject(post)}
                    disabled={reviewMutation.isPending}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl glass-card p-6 shadow-2xl border border-rose-500/30">
            <h3 className="text-base font-bold text-white">Reject LinkedIn Post</h3>
            <p className="mt-1 text-xs text-slate-300">
              Provide feedback for the student explaining why this post is rejected.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Feedback Note</label>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRejectModalPost(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={reviewMutation.isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-600/30 cursor-pointer"
              >
                {reviewMutation.isPending ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metrics Modal */}
      {metricsModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl glass-card p-6 shadow-2xl border border-slate-700">
            <h3 className="text-base font-bold text-white">Update Post Engagement Metrics</h3>
            <p className="mt-1 text-xs text-slate-400">
              Enter or correct likes, comments, and reposts verified on LinkedIn.
            </p>

            <form onSubmit={handleConfirmMetrics} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Likes 👍</label>
                <input
                  type="number"
                  min="0"
                  value={metricsData.likes}
                  onChange={(e) => setMetricsData((prev) => ({ ...prev, likes: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Comments 💬</label>
                <input
                  type="number"
                  min="0"
                  value={metricsData.comments}
                  onChange={(e) => setMetricsData((prev) => ({ ...prev, comments: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reposts 🔁</label>
                <input
                  type="number"
                  min="0"
                  value={metricsData.reposts}
                  onChange={(e) => setMetricsData((prev) => ({ ...prev, reposts: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMetricsModalPost(null)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={metricsMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  {metricsMutation.isPending ? 'Saving…' : 'Save Metrics'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
