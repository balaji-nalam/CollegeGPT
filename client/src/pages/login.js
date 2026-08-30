import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Lock, Mail, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, FileCheck2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <>
      <Head>
        <title>Login | CollegeGPT</title>
      </Head>

      <div className="login-page">
        <video
          className="login-bg-video"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>

        <div className="login-content soft-grid flex min-h-screen items-center justify-center bg-[#080c14]/5 p-4">
          <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-[#0d131f]/88 shadow-2xl backdrop-blur-xl md:grid-cols-[.9fr_1.1fr]">
            <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600/25 via-slate-900 to-cyan-500/10 p-10 md:flex">
              <div>
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-lg shadow-indigo-500/25">
                  <img src="/collegegpt-logo.png" alt="CollegeGPT logo" className="h-full w-full object-cover" />
                </div>
                <h1 className="mt-6 text-3xl font-bold text-white">Answers backed by your college.</h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">CollegeGPT searches official documents and returns answers with transparent sources.</p>
              </div>
              <div className="space-y-3 text-xs text-slate-300"><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Grounded RAG answers</p><p className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-cyan-300" /> Page-level citations</p></div>
            </div>
            <div className="p-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-indigo-400/30 bg-slate-950/70 shadow-lg shadow-indigo-500/25">
                <img src="/collegegpt-logo.png" alt="CollegeGPT logo" className="h-full w-full object-cover" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">CollegeGPT</h2>
              <p className="mt-1 text-sm text-slate-400">Your AI-powered college information assistant</p>
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
                  College Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    id="login-email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@college.edu or admin@college.edu"
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
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="login-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-11 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-200" aria-label="Toggle password visibility">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
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
                    Sign In to CollegeGPT
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-6 text-center text-xs text-slate-400">
              Need a student account?{' '}
              <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition">
                Register here
              </Link>
            </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
