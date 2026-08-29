import React from 'react';
import { X, Trash2, Sliders, Info, Sparkles } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodeConfigPanel() {
  const { nodes, selectedNodeId, selectNode, updateNodeData, deleteNode } = useWorkflowStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) return null;

  const { data, type } = selectedNode;

  const handleChange = (field, value) => {
    updateNodeData(selectedNode.id, { [field]: value });
  };

  return (
    <div className="w-80 flex-shrink-0 border-l border-slate-800/80 bg-[#090d16] flex flex-col h-full overflow-y-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Node Inspector</h3>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Common Node Label */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Node Title
        </label>
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition"
        />
      </div>

      {/* Type Specific Fields */}
      {type === 'triggerNode' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Trigger Type
            </label>
            <select
              value={data.triggerType || 'manual'}
              onChange={(e) => handleChange('triggerType', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition"
            >
              <option value="manual">Manual On-Demand</option>
              <option value="schedule">Schedule (Cron)</option>
              <option value="webhook">HTTP Webhook</option>
              <option value="event">Third-Party Event</option>
            </select>
          </div>

          {data.triggerType === 'schedule' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Cron Expression
              </label>
              <input
                type="text"
                value={data.cron || '0 * * * *'}
                onChange={(e) => handleChange('cron', e.target.value)}
                placeholder="0 * * * *"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono transition"
              />
              <p className="mt-1 text-[10px] text-slate-500">Every hour: `0 * * * *`</p>
            </div>
          )}
        </div>
      )}

      {type === 'actionNode' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Provider
            </label>
            <input
              type="text"
              disabled
              value={data.provider || 'custom'}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-indigo-400 uppercase font-semibold"
            />
          </div>

          {data.provider === 'gmail' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Recipient (To)
                </label>
                <input
                  type="text"
                  value={data.to || ''}
                  onChange={(e) => handleChange('to', e.target.value)}
                  placeholder="user@example.com or {{node_1.output.email}}"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={data.subject || ''}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  placeholder="Automated notification"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email Body
                </label>
                <textarea
                  rows={4}
                  value={data.body || ''}
                  onChange={(e) => handleChange('body', e.target.value)}
                  placeholder="Hello, here is the automation result: {{node_1.output.summary}}"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition font-sans"
                />
              </div>
            </>
          )}

          {data.provider === 'slack' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Slack Channel
                </label>
                <input
                  type="text"
                  value={data.channel || '#general'}
                  onChange={(e) => handleChange('channel', e.target.value)}
                  placeholder="#general or C01234567"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Message Payload
                </label>
                <textarea
                  rows={4}
                  value={data.message || ''}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder=":rocket: Alert from Agentflow: {{node_1.output.text}}"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </>
          )}

          {data.provider === 'discord' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Discord Channel ID
                </label>
                <input
                  type="text"
                  value={data.channelId || ''}
                  onChange={(e) => handleChange('channelId', e.target.value)}
                  placeholder="123456789012345678"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Content
                </label>
                <textarea
                  rows={4}
                  value={data.content || ''}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="Bot announcement: {{node_1.output.result}}"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </>
          )}

          {data.provider === 'google-sheets' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={data.spreadsheetId || ''}
                  onChange={(e) => handleChange('spreadsheetId', e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Sheet Range
                </label>
                <input
                  type="text"
                  value={data.range || 'Sheet1!A:E'}
                  onChange={(e) => handleChange('range', e.target.value)}
                  placeholder="Sheet1!A:E"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition font-mono"
                />
              </div>
            </>
          )}
        </div>
      )}

      {type === 'aiNode' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              AI Prompt / Instruction
            </label>
            <textarea
              rows={4}
              value={data.prompt || ''}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="Analyze and format this lead: {{trigger.output.leadData}}"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Model
            </label>
            <select
              value={data.model || 'gemini-1.5-flash'}
              onChange={(e) => handleChange('model', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none transition"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Complex Reasoning)</option>
              <option value="openai/gpt-4o-mini">OpenRouter / GPT-4o Mini</option>
              <option value="anthropic/claude-3.5-sonnet">OpenRouter / Claude 3.5 Sonnet</option>
            </select>
          </div>
        </div>
      )}

      {type === 'conditionNode' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Condition Expression
            </label>
            <input
              type="text"
              value={data.condition || ''}
              onChange={(e) => handleChange('condition', e.target.value)}
              placeholder="data.status == 'approved'"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none transition font-mono"
            />
          </div>
        </div>
      )}

      {/* Interpolation Syntax Info Helper */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
          <Info className="h-3.5 w-3.5" />
          <span>Dynamic Variables</span>
        </div>
        <p>Reference previous node data with:</p>
        <code className="block bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">
          {'{{node_id.output.property}}'}
        </code>
      </div>

      {/* Delete Node Button */}
      <div className="border-t border-slate-800 pt-4">
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
        >
          <Trash2 className="h-4 w-4" />
          Delete Node
        </button>
      </div>
    </div>
  );
}
