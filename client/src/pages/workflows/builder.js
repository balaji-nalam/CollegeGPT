import { useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import AppShell from '../../components/AppShell/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import { useWorkflowStore } from '../../store/workflowStore';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  GitBranch,
  Layers,
  Wand2,
  Bot,
  Zap
} from 'lucide-react';
import api from '../../services/api';

const WorkflowCanvas = dynamic(
  () => import('../../components/WorkflowCanvas/WorkflowCanvas'),
  { ssr: false, loading: () => <div className="flex h-full w-full items-center justify-center text-slate-500 text-sm">Loading Canvas...</div> }
);

const SAMPLE_PROMPTS = [
  'When a new lead is captured in Google Sheets, qualify with AI, post alert to Slack sales channel, and email the client.',
  'Monitor API errors, analyze stack trace with AI, and broadcast urgent alert to Discord ops channel and Slack war room.',
  'On customer support ticket submission, run AI sentiment analysis and auto-draft resolution email via Gmail.',
];

export default function WorkflowBuilder() {
  const router = useRouter();
  const { setWorkflow } = useWorkflowStore();

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedGraph, setGeneratedGraph] = useState(null);
  const [providerUsed, setProviderUsed] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async (targetPrompt) => {
    const p = targetPrompt || prompt;
    if (!p.trim()) return;

    try {
      setGenerating(true);
      const res = await api.post('/workflows/generate', { prompt: p.trim() });
      if (res.data?.data) {
        const graph = res.data.data;
        setGeneratedGraph(graph);
        setProviderUsed(graph.provider);
        // Load into workflow store for interactive canvas preview
        setWorkflow(graph);
      }
    } catch (err) {
      console.error('Generation failed', err);
      alert(err.response?.data?.message || 'Workflow generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndOpen = async () => {
    if (!generatedGraph) return;

    try {
      setSaving(true);
      const res = await api.post('/workflows', {
        name: generatedGraph.name || 'AI Generated Automation',
        description: generatedGraph.description || `Generated from: "${prompt}"`,
        triggerConfig: generatedGraph.triggerConfig || { type: 'manual' },
        nodes: generatedGraph.nodes || [],
        edges: generatedGraph.edges || [],
        tags: generatedGraph.tags || ['ai-generated'],
      });

      router.push(`/workflows/${res.data.data._id}`);
    } catch (err) {
      console.error('Save failed', err);
      alert(err.response?.data?.message || 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">AI Workflow Synthesizer</h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Describe your desired automation in plain English and let the AI compile the full execution graph.
              </p>
            </div>

            {generatedGraph && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Synthesized via <span className="capitalize font-semibold text-white">{providerUsed}</span>
                </span>
                <button
                  onClick={handleSaveAndOpen}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 disabled:opacity-50 transition"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving to Studio...
                    </>
                  ) : (
                    <>
                      Open in Studio Canvas
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Prompt Input Panel */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <textarea
                  rows={2}
                  placeholder="Describe your automation... (e.g. When lead enters Google Sheets, summarize with AI and send alert to Slack and Gmail)"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition resize-none font-sans"
                />
              </div>

              <button
                onClick={() => handleGenerate()}
                disabled={generating || !prompt.trim()}
                className="flex sm:flex-col items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-3 sm:py-0 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Generate Graph</span>
                  </>
                )}
              </button>
            </div>

            {/* Prompt Suggestion Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Try Examples:</span>
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleGenerate(p);
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition line-clamp-1"
                >
                  "{p.slice(0, 48)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Graph Preview Canvas Panel */}
          <div className="flex-1 rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl bg-[#080c14]">
            {!generatedGraph && !generating && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#080c14]/90 p-6 text-center backdrop-blur-[2px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-3">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">Interactive Canvas Awaiting Prompt</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Enter an automation prompt above or click an example to synthesize a multi-node workflow graph.
                </p>
              </div>
            )}

            {generating && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#080c14]/80 p-6 text-center backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                <h3 className="text-sm font-semibold text-slate-200">Synthesizing Automation Graph...</h3>
                <p className="mt-1 text-xs text-slate-500">Resolving node positions, edge connections, and tool bindings</p>
              </div>
            )}

            <WorkflowCanvas />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
