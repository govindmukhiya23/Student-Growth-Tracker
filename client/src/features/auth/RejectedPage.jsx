import { useAuth } from '../../core/AuthContext.jsx';

export default function RejectedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-md glass-card rounded-2xl p-5 sm:p-8 text-center shadow-2xl border border-rose-900/40">
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-2xl sm:text-3xl mb-5">
          ❌
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Registration Rejected</h1>
        <p className="mt-2 text-sm text-slate-300">
          We regret to inform you that your student account application could not be approved.
        </p>

        <div className="mt-6 rounded-xl bg-rose-950/20 border border-rose-900/50 p-4 text-xs text-rose-300 text-left">
          <div className="font-semibold text-rose-200 mb-1">Reason provided by administrator:</div>
          <p className="italic">
            &ldquo;{user?.rejectionReason || 'Application details did not match active student enrollment records.'}&rdquo;
          </p>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          If you believe this is an error, please reach out directly to your campus program coordinator.
        </p>

        <div className="mt-6">
          <button
            onClick={logout}
            className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
