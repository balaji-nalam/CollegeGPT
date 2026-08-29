import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../../components/AppShell/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
  RefreshCw,
  Search,
  ArrowRight,
  Bot,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

export default function ExecutionsList() {
  const router = useRouter();
  const [executions, setExecutions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/executions?${params.toString()}`);
      if (res.data?.data) {
        setExecutions(res.data.data.executions);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      console.error('Failed to load executions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-400">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-indigo-400 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" /> Running
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
            <PauseCircle className="h-3 w-3" /> Paused
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1 rounded-full bg-slate-800 text-slate-400 px-2.5 py-0.5 text-[10px] font-bold uppercase">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-slate-800 text-slate-400 px-2.5 py-0.5 text-[10px] font-bold uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Execution Telemetry</h1>
              <p className="mt-1 text-sm text-slate-400">
                Audit trail and live execution runs across the 5-agent orchestration engine ({total} total runs).
              </p>
            </div>
            <button
              onClick={fetchExecutions}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Runs
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0d131f] p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter by Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none transition"
              >
                <option value="">All Statuses</option>
                <option value="RUNNING">Running</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table of Executions */}
          {loading ? (
            <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
              Loading execution logs...
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-[#0d131f]/40 py-16 text-center">
              <PlayCircle className="h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-200">No executions found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Trigger an execution from the Workflows studio to view multi-agent timeline telemetry.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d131f] shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Execution ID</th>
                    <th className="px-6 py-4">Workflow Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {executions.map((exec) => (
                    <tr
                      key={exec._id}
                      onClick={() => router.push(`/executions/${exec._id}`)}
                      className="cursor-pointer hover:bg-slate-900/50 transition"
                    >
                      <td className="px-6 py-4 font-mono text-indigo-400">
                        #{exec._id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        {exec.workflowSnapshot?.name || 'Automation Run'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(exec.status)}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : 'Active'}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(exec.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                          Timeline <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
