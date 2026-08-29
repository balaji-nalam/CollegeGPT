import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../../components/AppShell/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import {
  GitBranch,
  Plus,
  Search,
  Sparkles,
  Copy,
  Trash2,
  Play,
  Clock,
  MoreVertical,
  Layers,
  Tag,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

export default function WorkflowsList() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedTag) params.append('tag', selectedTag);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await api.get(`/workflows?${params.toString()}`);
      if (res.data?.data) {
        setWorkflows(res.data.data.workflows);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      console.error('Failed to load workflows', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchWorkflows();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedTag, selectedStatus]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    try {
      setIsCreating(true);
      const res = await api.post('/workflows', {
        name: newWorkflowName.trim(),
        description: 'Autonomous multi-agent workflow',
        tags: ['custom'],
      });
      setShowCreateModal(false);
      setNewWorkflowName('');
      router.push(`/workflows/${res.data.data._id}`);
    } catch (err) {
      console.error('Failed to create workflow', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    try {
      await api.post(`/workflows/${id}/duplicate`);
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to duplicate workflow', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to delete workflow', err);
    }
  };

  const handleExecute = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/workflows/${id}/execute`);
      router.push(`/executions/${res.data.data._id}`);
    } catch (err) {
      console.error('Failed to trigger run', err);
      alert(err.response?.data?.message || 'Failed to start execution');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Workflows</h1>
              <p className="mt-1 text-sm text-slate-400">
                Manage, edit, and orchestrate visual multi-agent automation graphs ({total} total).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/workflows/builder')}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:opacity-95 transition"
              >
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
              >
                <Plus className="h-4 w-4" />
                Create Workflow
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-[#0d131f] p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search workflows by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none transition"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Workflows List */}
          {loading ? (
            <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
              Loading workflows...
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-[#0d131f]/40 py-16 text-center">
              <GitBranch className="h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-200">No workflows found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Get started by creating a new graph or describe your desired automation with the AI builder.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => router.push('/workflows/builder')}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition"
                >
                  Generate with AI
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  Create Manually
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflows.map((wf) => (
                <div
                  key={wf._id}
                  onClick={() => router.push(`/workflows/${wf._id}`)}
                  className="group relative cursor-pointer rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition">
                          <GitBranch className="h-4 w-4" />
                        </div>
                        <div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              wf.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {wf.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleExecute(e, wf._id)}
                          title="Execute Run"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-600/20 hover:text-indigo-400 transition"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDuplicate(e, wf._id)}
                          title="Duplicate Workflow"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, wf._id)}
                          title="Delete Workflow"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                      {wf.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {wf.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {wf.nodes?.length || 0} nodes • v{wf.version || 1}
                    </span>
                    <span>
                      {new Date(wf.updatedAt || wf.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d131f] p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-white">Create New Workflow</h2>
              <p className="mt-1 text-xs text-slate-400">Initialize a blank canvas automation graph.</p>

              <form onSubmit={handleCreate} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Workflow Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Qualification & Slack Sync"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition"
                  >
                    {isCreating ? 'Creating...' : 'Create Canvas'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
