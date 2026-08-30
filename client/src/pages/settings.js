import { useState, useEffect } from 'react';
import Head from 'next/head';
import AppShell from '../components/AppShell/AppShell';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { Shield, Lock, CheckCircle2, User, Database, Cpu, Building, GraduationCap } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const { user } = useAuthStore();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch (err) {
        console.error('Health check failed', err);
      }
    }
    loadHealth();
  }, []);

  return (
    <ProtectedRoute>
      <Head>
        <title>Settings | CollegeGPT</title>
      </Head>

      <AppShell>
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System & Profile Settings</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your CollegeGPT account profile, security credentials, and AI engine status.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-6 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Account Profile</h2>
                <p className="text-xs text-slate-400">Authenticated student / administrative identity</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Full Name</p>
                <p className="mt-1 text-sm font-semibold text-slate-200">{user?.name || 'Student'}</p>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">College Email Address</p>
                <p className="mt-1 text-sm font-semibold text-slate-200">{user?.email || 'student@college.edu'}</p>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Academic Department</p>
                <div className="mt-1 flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-slate-200">{user?.department || 'General'}</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Account Access Role</p>
                <div className="mt-1 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-300 capitalize">{user?.role || 'student'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Diagnostics */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-6 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Security & Access Control</h2>
                <p className="text-xs text-slate-400">Application-level authentication & token enforcement</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-200">Password Encryption</p>
                  <p className="text-xs text-slate-500">Bcrypt adaptive hashing with cost factor 12</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-200">JWT Authentication Signing</p>
                  <p className="text-xs text-slate-500">HMAC-SHA256 bearer tokens with 7-day expiration</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* RAG Engine & AI Health */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-6 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">CollegeGPT RAG Engine</h2>
                <p className="text-xs text-slate-400">Vector database retrieval & LLM generation status</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Vector Database</p>
                <p className="mt-1 text-sm font-semibold text-white">Supabase PostgreSQL</p>
                <span className="mt-2 inline-block rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  pgvector (768-dim)
                </span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Embedding Model</p>
                <p className="mt-1 text-sm font-semibold text-white">Google text-embedding-004</p>
                <span className="mt-2 inline-block rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                  Cosine Distance
                </span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">AI Generation Engine</p>
                <p className="mt-1 text-sm font-semibold text-white">Gemini 1.5 Flash</p>
                <span className="mt-2 inline-block rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Grounded with Citations
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
