import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../components/AppShell/AppShell';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import MetricGrid from '../components/MetricGrid/MetricGrid';
import { Sparkles, GitBranch, PlayCircle, ArrowRight, Bot, Activity, Plus } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
    runningExecutions: 0,
    successRate: 100,
    failedExecutions: 0,
    avgDurationMs: 850,
  });
  const [recentWorkflows, setRecentWorkflows] = useState([]);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [dashRes, wfRes, execRes] = await Promise.allSettled([
          api.get('/workflows/dashboard'),
          api.get('/workflows?limit=5'),
          api.get('/executions?limit=5'),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.data?.data) {
          setStats(dashRes.value.data.data);
        }
        if (wfRes.status === 'fulfilled' && wfRes.value.data?.data?.workflows) {
          setRecentWorkflows(wfRes.value.data.data.workflows);
        }
        if (execRes.status === 'fulfilled' && execRes.value.data?.data?.executions) {
          setRecentExecutions(execRes.value.data.data.executions);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Top Banner / Welcome */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Operations Console</h1>
              <p className="mt-1 text-sm text-slate-400">
                Multi-agent swarm telemetry, workflow orchestration, and active execution status.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/workflows/builder')}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:opacity-95 transition"
              >
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </button>
              <button
                onClick={() => router.push('/workflows')}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                <Plus className="h-4 w-4" />
                New Workflow
              </button>
            </div>
          </div>

          {/* Metric Grid */}
          <MetricGrid stats={stats} />

          {/* Grid of Workflows & Executions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Workflows */}
            <div className="rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-semibold text-white">Active Workflows</h3>
                </div>
                <button
                  onClick={() => router.push('/workflows')}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {recentWorkflows.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No workflows created yet. Click "Generate with AI" to build your first automation.
                  </div>
                ) : (
                  recentWorkflows.map((wf) => (
                    <div
                      key={wf._id}
                      onClick={() => router.push(`/workflows/${wf._id}`)}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3 hover:border-slate-700 hover:bg-slate-900 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{wf.name}</p>
                        <p className="text-xs text-slate-500">
                          {wf.nodes?.length || 0} nodes • v{wf.version || 1}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          wf.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {wf.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Agent Activity Feed */}
            <div className="rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-400" />
                  <h3 className="font-semibold text-white">Agentic Execution Pipeline</h3>
                </div>
                <button
                  onClick={() => router.push('/executions')}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Live Runs <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {recentExecutions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No executions triggered yet. Trigger a workflow run to view real-time agent telemetry.
                  </div>
                ) : (
                  recentExecutions.map((exec) => (
                    <div
                      key={exec._id}
                      onClick={() => router.push(`/executions/${exec._id}`)}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3 hover:border-slate-700 hover:bg-slate-900 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">Run #{exec._id.slice(-6)}</p>
                        <p className="text-xs text-slate-500">
                          {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s duration` : 'Running...'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          exec.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : exec.status === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                        }`}
                      >
                        {exec.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
