import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Zap, Lock, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
    return () => clearError();
  }, [isAuthenticated, router, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    const res = await login(formData.email, formData.password);
    if (res.success) {
      router.push('/dashboard');
    }
  };

  // Demo account quick fill
  const handleQuickDemo = (role) => {
    if (role === 'admin') {
      setFormData({ email: 'admin@agentflow.io', password: 'password123' });
    } else {
      setFormData({ email: 'operator@agentflow.io', password: 'password123' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080c14] p-4">
      {/* Background glow aesthetics */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d131f]/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 shadow-lg shadow-indigo-500/25">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Operator Console</h2>
          <p className="mt-1 text-sm text-slate-400">Sign in to orchestrate multi-agent workflows</p>
        </div>

        {/* Error Alert */}
        {(localError || error) && (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {localError || error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                name="email"
                id="login-email"
                value={formData.email}
                onChange={handleChange}
                placeholder="operator@agentflow.io"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                name="password"
                id="login-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            id="login-submit-btn"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus:outline-none disabled:opacity-50 transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-fill */}
        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="text-center text-[11px] font-medium text-slate-500 mb-2">Instant Demo Autofill</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('operator')}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Fill Operator
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 py-1.5 text-xs text-indigo-300 hover:bg-indigo-950/40 hover:text-indigo-200 transition"
            >
              Fill Admin
            </button>
          </div>
        </div>

        {/* Register link */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Need a new operator account?{' '}
          <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
