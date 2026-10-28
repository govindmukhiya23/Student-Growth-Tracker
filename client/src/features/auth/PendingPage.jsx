import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/AuthContext.jsx';

export default function PendingPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await refreshUser();
    setChecking(false);
    if (user?.status === 'approved' || user?.status === 'active') {
      navigate('/');
    } else if (user?.status === 'rejected') {
      navigate('/rejected');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-md glass-card rounded-2xl p-5 sm:p-8 text-center shadow-2xl border border-slate-800">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-2xl sm:text-3xl mb-5">
          ⏳
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Registration Under Review</h1>
        <p className="mt-2 text-sm text-slate-300">
          Hello <span className="font-semibold text-white">{user?.name || 'Student'}</span>! Your registration is currently waiting for approval from your college administrator.
        </p>

        <div className="mt-6 rounded-xl bg-slate-900/60 border border-slate-800 p-4 text-xs text-slate-400 text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Username:</span>
            <span className="font-mono text-slate-300">{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">College:</span>
            <span className="text-slate-300">{user?.college || 'Not specified'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-semibold text-amber-400 capitalize">{user?.status}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-blue-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {checking ? 'Checking Status…' : 'Check Approval Status'}
          </button>
          <button
            onClick={logout}
            className="w-full rounded-xl border border-slate-700/80 bg-slate-800/40 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
