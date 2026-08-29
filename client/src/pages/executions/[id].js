import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AppShell from '../../components/AppShell/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import { subscribeToExecution } from '../../services/socket';
import {
  ArrowLeft,
  Play,
  Pause,
  XOctagon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Bot,
  Activity,
  Shield,
  Layers,
  ChevronRight,
  Loader2,
  Terminal,
} from 'lucide-react';
import api from '../../services/api';

const AGENT_COLORS = {
  planner: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
    border: 'border-l-blue-500',
    title: 'Planner Agent',
  },
  execution: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
    border: 'border-l-emerald-500',
    title: 'Execution Agent',
  },
  validation: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
    border: 'border-l-amber-500',
    title: 'Validation Agent',
  },
  recovery: {
    badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    dot: 'bg-pink-400',
    border: 'border-l-pink-500',
    title: 'Recovery Agent',
  },
  monitoring: {
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    dot: 'bg-purple-400',
    border: 'border-l-purple-500',
    title: 'Monitoring Agent',
  },
};

export default function ExecutionDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [langGraph, setLangGraph] = useState('available');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchTimeline = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      setLoading(true);
      const res = await api.get(`/executions/${id}/timeline`);
      if (res.data?.data) {
        setExecution(res.data.data.execution);
        setLogs(res.data.data.logs || []);
        setLangGraph(res.data.data.langGraphSubstrate || 'available');
      }
    } catch (err) {
      console.error('Failed to load timeline', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [id]);

  // Real-time Socket.IO Live Streaming
  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const unsub = subscribeToExecution(id, {
      onAgentEvent: (payload) => {
        if (payload?.data) {
          setLogs((prev) => {
            const exists = prev.some((l) => l.id === payload.data.id || l._id === payload.data.id);
            if (!exists) return [...prev, payload.data];
            return prev;
          });
        }
      },
      onExecutionCompleted: (payload) => {
        setExecution((prev) => (prev ? { ...prev, status: 'COMPLETED', duration: payload.duration, outputs: payload.outputs } : prev));
      },
      onExecutionFailed: (payload) => {
        setExecution((prev) => (prev ? { ...prev, status: 'FAILED', error: payload.error } : prev));
      },
    });

    return () => unsub();
  }, [id]);

  const handlePause = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/executions/${id}/pause`);
      setExecution(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pause');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/executions/${id}/resume`);
      setExecution(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resume');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this execution run?')) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/executions/${id}/cancel`);
      setExecution(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <Link
                href="/executions"
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Run #{id ? String(id).slice(-8) : ''}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      execution?.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : execution?.status === 'FAILED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : execution?.status === 'PAUSED'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                    }`}
                  >
                    {execution?.status || 'PENDING'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Workflow: <span className="font-semibold text-slate-200">{execution?.workflowSnapshot?.name || 'Automation'}</span>
                  {' '}• v{execution?.workflowSnapshot?.version || 1}
                </p>
              </div>
            </div>

            {/* Execution Controls & Substrate */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400">
                LangGraph Substrate: <span className="text-indigo-400 font-semibold uppercase">{langGraph}</span>
              </div>

              {execution?.status === 'RUNNING' && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                >
                  <Pause className="h-3.5 w-3.5" /> Pause
                </button>
              )}

              {execution?.status === 'PAUSED' && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                >
                  <Play className="h-3.5 w-3.5" /> Resume
                </button>
              )}

              {(execution?.status === 'RUNNING' || execution?.status === 'PAUSED') && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                >
                  <XOctagon className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-3.5">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Duration</span>
              <p className="mt-1 text-sm font-bold text-white">
                {execution?.duration ? `${(execution.duration / 1000).toFixed(2)}s` : 'In Progress'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-3.5">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Retry Count</span>
              <p className="mt-1 text-sm font-bold text-white">{execution?.retryCount || 0} Retries</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-3.5">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Timeline Events</span>
              <p className="mt-1 text-sm font-bold text-indigo-400">{logs.length} Recorded</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-3.5">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Nodes Executed</span>
              <p className="mt-1 text-sm font-bold text-emerald-400">
                {execution?.workflowSnapshot?.nodes?.length || 0} Steps
              </p>
            </div>
          </div>

          {/* Main Studio: Left Timeline + Right Event Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Stream */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">5-Agent Live Execution Timeline</h3>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Streaming Live
                </span>
              </div>

              {loading ? (
                <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
                  Loading execution stream...
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-8 text-center text-xs text-slate-500">
                  Awaiting initial agent events from orchestrator...
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log, index) => {
                    const agentCfg = AGENT_COLORS[log.agent] || AGENT_COLORS.monitoring;
                    const isSelected = selectedLog?.id === log.id || selectedLog?._id === log._id;

                    return (
                      <div
                        key={log._id || log.id || index}
                        onClick={() => setSelectedLog(log)}
                        className={`cursor-pointer rounded-2xl border bg-[#0d131f] p-4 transition-all ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${agentCfg.badge}`}>
                              {log.agent}
                            </span>
                            {log.nodeId && (
                              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-800">
                                {log.nodeId}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-medium text-slate-200 leading-relaxed">
                          {log.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Inspector: Step Metadata & Output */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Event Telemetry Inspector</h3>

              <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-5 space-y-4">
                {selectedLog ? (
                  <>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Selected Agent</span>
                      <p className="text-xs font-bold text-white capitalize mt-0.5">{selectedLog.agent} Agent</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Message</span>
                      <p className="text-xs text-slate-300 mt-0.5">{selectedLog.message}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Payload Metadata</span>
                      <pre className="mt-1 max-h-72 overflow-y-auto rounded-xl bg-[#080c14] p-3 text-[11px] font-mono text-indigo-300 border border-slate-800">
                        {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Click any timeline step on the left to inspect its parameters and JSON outputs.
                  </div>
                )}
              </div>

              {/* Execution Error Banner if any */}
              {execution?.error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failure Reason</span>
                  </div>
                  <p className="mt-1 text-xs text-rose-200 leading-relaxed">
                    {typeof execution.error === 'object' ? execution.error.message : execution.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
