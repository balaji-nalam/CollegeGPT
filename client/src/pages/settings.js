import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell/AppShell';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { Shield, Key, Lock, CheckCircle2, User, Server, Cpu, AlertCircle } from 'lucide-react';
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
      <AppShell>
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System & Profile Settings</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage operator credentials, encryption status, and integration health checks.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-6 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Operator Profile</h2>
                <p className="text-xs text-slate-400">Authenticated user identity and role assignment</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Name</p>
                <p className="mt-1 text-sm font-semibold text-slate-200">{user?.name || 'Operator'}</p>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Email Address</p>
                <p className="mt-1 text-sm font-semibold text-slate-200">{user?.email || 'operator@agentflow.io'}</p>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Access Role</p>
                <div className="mt-1 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-300 capitalize">{user?.role || 'operator'}</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Security Password Hash</p>
                <p className="mt-1 text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Bcrypt Cost Factor 12
                </p>
              </div>
            </div>
          </div>

          {/* Encryption & Security Diagnostics */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-6 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Credential Encryption at Rest</h2>
                <p className="text-xs text-slate-400">AES-256-GCM application-level cryptographic key verification</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-200">Encryption Engine</p>
                  <p className="text-xs text-slate-500">AES-256-GCM with dynamic initialization vector (IV) & auth tags</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Active & Enforcing
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

          {/* AI Providers & Services Health */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-6 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">AI Engine & Fallback Status</h2>
                <p className="text-xs text-slate-400">Multi-tier LLM generation fallback pipeline</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Primary Tier</p>
                <p className="mt-1 text-sm font-semibold text-white">OpenRouter API</p>
                <span className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${health?.integrations?.openrouter ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {health?.integrations?.openrouter ? 'Configured' : 'Offline / Fallback Ready'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Secondary Tier</p>
                <p className="mt-1 text-sm font-semibold text-white">Google Gemini</p>
                <span className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${health?.integrations?.gemini ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {health?.integrations?.gemini ? 'Configured' : 'Offline / Fallback Ready'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 font-medium">Tertiary Tier</p>
                <p className="mt-1 text-sm font-semibold text-white">Deterministic Rule Engine</p>
                <span className="mt-2 inline-block rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Always Active (Zero-Dep)
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
