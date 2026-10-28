import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    college: '',
    course: '',
    rollNumber: '',
    year: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await register(formData);
      setSuccessMsg(
        res.message || 'Registration submitted! Your application is now pending admin approval.'
      );
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setError(err.errors.map((e) => e.message).join(' • '));
      } else {
        setError(err.message || 'Registration failed. Please check your information.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-lg glass-card rounded-2xl p-5 sm:p-8 shadow-2xl border border-slate-800">
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Student Registration</h1>
          <p className="mt-1 text-sm text-slate-400">
            Join your college habit cohort and start sharing your LinkedIn growth
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <span className="text-base font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs text-emerald-300 flex items-start gap-2.5">
            <span className="text-base font-bold">🎉</span>
            <div>
              <div className="font-semibold text-emerald-200">Registration Received</div>
              <p className="mt-0.5">{successMsg}</p>
              <p className="mt-2 text-[11px] text-emerald-400">Redirecting to login…</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Johnson"
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. alexj"
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              College Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@college.edu"
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password (min 10 characters)
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={10}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                College
              </label>
              <input
                type="text"
                name="college"
                required
                value={formData.college}
                onChange={handleChange}
                placeholder="College name"
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Course / Major
              </label>
              <input
                type="text"
                name="course"
                required
                value={formData.course}
                onChange={handleChange}
                placeholder="e.g. CS / B.Tech"
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Student ID / Roll No
              </label>
              <input
                type="text"
                name="rollNumber"
                required
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="e.g. 21B91A0501"
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Submitting Registration…' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
