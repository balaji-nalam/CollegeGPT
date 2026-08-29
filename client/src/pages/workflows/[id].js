import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Header from '../../components/AppShell/Header';
import NodePalette from '../../components/NodePalette/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import { useWorkflowStore } from '../../store/workflowStore';
import {
  Save,
  Play,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  GitBranch,
  Layers
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import WorkflowCanvas without SSR
const WorkflowCanvas = dynamic(
  () => import('../../components/WorkflowCanvas/WorkflowCanvas'),
  { ssr: false, loading: () => <div className="flex h-full w-full items-center justify-center bg-[#080c14] text-slate-500 text-sm">Loading Canvas...</div> }
);

export default function WorkflowEditor() {
  const router = useRouter();
  const { id } = router.query;

  const {
    workflow,
    loadWorkflow,
    saveWorkflow,
    triggerExecution,
    updateWorkflowMeta,
    isLoading,
    isSaving,
    isDirty,
    error,
  } = useWorkflowStore();

  const [executing, setExecuting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadWorkflow(id);
    }
  }, [id, loadWorkflow]);

  const handleSave = async () => {
    const res = await saveWorkflow();
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleRun = async () => {
    if (isDirty) {
      await handleSave();
    }

    try {
      setExecuting(true);
      const execution = await triggerExecution();
      if (execution?._id) {
        router.push(`/executions/${execution._id}`);
      }
    } catch (err) {
      console.error('Execution trigger failed', err);
      alert(err.response?.data?.message || 'Failed to start execution');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#080c14] text-slate-100">
        {/* Top Workflow Toolbar */}
        <header className="flex h-14 w-full items-center justify-between border-b border-slate-800/80 bg-[#090d16] px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/workflows"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Back to workflows"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="h-4 w-[1px] bg-slate-800" />

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workflow?.name || ''}
                onChange={(e) => updateWorkflowMeta({ name: e.target.value })}
                placeholder="Workflow Title..."
                className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-white hover:border-slate-800 focus:border-indigo-500 focus:bg-slate-900 focus:outline-none transition"
              />
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                v{workflow?.version || 1}
              </span>
              {isDirty && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved
                </span>
              )}
              {saveSuccess && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium animate-fade-in">
                  <CheckCircle2 className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save
                </>
              )}
            </button>

            <button
              onClick={handleRun}
              disabled={executing}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:opacity-95 disabled:opacity-50 transition"
            >
              {executing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Execute Workflow
                </>
              )}
            </button>
          </div>
        </header>

        {/* Studio Workspace Layout */}
        <div className="flex flex-1 overflow-hidden">
          <NodePalette />
          <div className="flex-1 relative h-full">
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center bg-[#080c14] text-slate-500 text-sm">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
                Loading Workflow Definition...
              </div>
            ) : (
              <WorkflowCanvas />
            )}
          </div>
          <NodeConfigPanel />
        </div>
      </div>
    </ProtectedRoute>
  );
}
