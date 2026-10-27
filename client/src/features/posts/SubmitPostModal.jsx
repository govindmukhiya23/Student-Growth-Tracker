import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../core/api';

const LINKEDIN_URL_PATTERN =
  /^https:\/\/(www\.)?linkedin\.com\/(posts\/[^/?#]+|feed\/update\/urn:li:[^/?#]+)/i;

export default function SubmitPostModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [clientError, setClientError] = useState(null);
  const [serverError, setServerError] = useState(null);

  const submitMutation = useMutation({
    mutationFn: (postUrl) => api.post('/posts', { url: postUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      setUrl('');
      setServerError(null);
      setClientError(null);
      onClose();
    },
    onError: (err) => {
      setServerError(err.message || 'Failed to submit post.');
    },
  });

  if (!isOpen) return null;

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    setServerError(null);

    if (val.trim() && !LINKEDIN_URL_PATTERN.test(val.trim())) {
      setClientError(
        'Please enter a valid LinkedIn post URL (e.g. https://www.linkedin.com/posts/… or /feed/update/…)'
      );
    } else {
      setClientError(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!LINKEDIN_URL_PATTERN.test(url.trim())) {
      setClientError('Invalid LinkedIn post URL format.');
      return;
    }

    submitMutation.mutate(url.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl glass-card p-6 shadow-2xl border border-slate-700/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold">
              +
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Submit LinkedIn Post</h3>
              <p className="text-xs text-slate-400">Share your milestone to maintain your daily streak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-semibold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {serverError && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <span className="text-base font-bold">⚠️</span>
            <div>
              <div className="font-semibold text-rose-200">Submission Error</div>
              <p className="mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {clientError && (
          <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
            {clientError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              LinkedIn Post URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={handleUrlChange}
              placeholder="https://www.linkedin.com/posts/username_slug-activity-1234567890123456789"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Only one post per calendar day counts toward points & streaks.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending || !!clientError || !url.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitMutation.isPending ? 'Verifying URL…' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
