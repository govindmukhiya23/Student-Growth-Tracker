import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../core/api';
import SubmitPostModal from '../../core/SubmitPostModal.jsx';

export default function MyPostsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'pending' | 'verified' | 'rejected'

  const { data, isLoading } = useQuery({
    queryKey: ['my-posts', statusFilter],
    queryFn: () =>
      api.get(`/posts/mine?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`),
  });

  const posts = data?.posts || [];
  const counts = data?.counts || { total: 0, pending: 0, verified: 0, rejected: 0 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">My LinkedIn Submissions</h1>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              Student Activity
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Submit your daily LinkedIn posts and track their verification status
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-blue-500 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span className="text-base leading-none font-bold">+</span>
          Submit LinkedIn Post
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Total Submissions</div>
          <div className="mt-1 text-2xl font-bold text-white">{counts.total}</div>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-xs font-medium text-emerald-400">Verified Posts</div>
          <div className="mt-1 text-2xl font-bold text-emerald-300">{counts.verified}</div>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-xs font-medium text-amber-400">Under Review</div>
          <div className="mt-1 text-2xl font-bold text-amber-300">{counts.pending}</div>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-xs font-medium text-rose-400">Rejected</div>
          <div className="mt-1 text-2xl font-bold text-rose-300">{counts.rejected}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
        {[
          { label: 'All Posts', val: '' },
          { label: 'Pending', val: 'pending' },
          { label: 'Verified', val: 'verified' },
          { label: 'Rejected', val: 'rejected' },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setStatusFilter(tab.val)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === tab.val
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          <span className="animate-pulse">Loading posts…</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-xl text-slate-400 mb-3">
            📝
          </div>
          <h3 className="text-base font-semibold text-slate-200">No submissions found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {statusFilter
              ? `You don't have any posts in the "${statusFilter}" state.`
              : 'You haven’t submitted any LinkedIn posts yet. Click the button above to paste your first post URL!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
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
                  <span className="text-[11px] text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Snippet / Title */}
                {post.extractedData?.authorName && (
                  <div className="text-xs font-semibold text-indigo-300 mb-1">
                    {post.extractedData.authorName}
                  </div>
                )}

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                  {post.extractedData?.textSnippet ||
                    'Metadata extraction in progress. Awaiting administrator verification.'}
                </p>

                {/* Rejection Note */}
                {post.status === 'rejected' && post.review?.note && (
                  <div className="mb-4 rounded-xl bg-rose-950/20 border border-rose-900/40 p-3 text-[11px] text-rose-300">
                    <span className="font-semibold text-rose-200">Admin feedback: </span>
                    {post.review.note}
                  </div>
                )}
              </div>

              {/* Footer info: metrics + external link */}
              <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span title="Likes">👍 {post.metrics?.likes || 0}</span>
                  <span title="Comments">💬 {post.metrics?.comments || 0}</span>
                  <span title="Reposts">🔁 {post.metrics?.reposts || 0}</span>
                </div>

                <a
                  href={post.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  View on LinkedIn ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      <SubmitPostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
