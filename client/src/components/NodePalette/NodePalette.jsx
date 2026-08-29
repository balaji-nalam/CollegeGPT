import React from 'react';
import {
  Zap,
  Clock,
  Globe,
  Mail,
  MessageSquare,
  Table,
  Sparkles,
  GitFork,
  Terminal,
  Plus
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

const paletteItems = [
  {
    category: 'Triggers',
    items: [
      {
        type: 'triggerNode',
        label: 'Manual Trigger',
        icon: Zap,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        data: { label: 'Manual Trigger', triggerType: 'manual' },
      },
      {
        type: 'triggerNode',
        label: 'Schedule Cron',
        icon: Clock,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        data: { label: 'Schedule Trigger', triggerType: 'schedule', cron: '0 * * * *' },
      },
      {
        type: 'triggerNode',
        label: 'Webhook Trigger',
        icon: Globe,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        data: { label: 'Webhook Trigger', triggerType: 'webhook' },
      },
    ],
  },
  {
    category: 'Actions & Tools',
    items: [
      {
        type: 'actionNode',
        label: 'Send Email (Gmail)',
        icon: Mail,
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/20',
        data: { label: 'Gmail Send', provider: 'gmail', action: 'send_email', to: '', subject: '', body: '' },
      },
      {
        type: 'actionNode',
        label: 'Post Slack Message',
        icon: MessageSquare,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        data: { label: 'Slack Alert', provider: 'slack', action: 'post_message', channel: '#general', message: '' },
      },
      {
        type: 'actionNode',
        label: 'Post Discord Message',
        icon: MessageSquare,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10 border-indigo-500/20',
        data: { label: 'Discord Bot', provider: 'discord', action: 'send_message', channelId: '', content: '' },
      },
      {
        type: 'actionNode',
        label: 'Append Google Sheet',
        icon: Table,
        color: 'text-green-400',
        bg: 'bg-green-500/10 border-green-500/20',
        data: { label: 'Append Row', provider: 'google-sheets', action: 'append_row', spreadsheetId: '', range: 'Sheet1!A:E' },
      },
    ],
  },
  {
    category: 'Logic & AI',
    items: [
      {
        type: 'aiNode',
        label: 'AI Reasoning Agent',
        icon: Sparkles,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/20',
        data: { label: 'AI Transformation', prompt: 'Summarize the input and extract key points.', model: 'gemini-1.5-flash' },
      },
      {
        type: 'conditionNode',
        label: 'Branch Condition',
        icon: GitFork,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/20',
        data: { label: 'Check Status', condition: 'status == "urgent"' },
      },
    ],
  },
];

export default function NodePalette() {
  const { addNode } = useWorkflowStore();

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/agentflow-node', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-[#090d16] flex flex-col h-full overflow-y-auto p-4 space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node Palette</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">Drag or click to place on canvas</p>
      </div>

      {paletteItems.map((cat) => (
        <div key={cat.category} className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">{cat.category}</p>
          <div className="space-y-1.5">
            {cat.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onClick={() => addNode(item.type, { x: 300, y: 150 + Math.random() * 100 }, item.data)}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 hover:border-slate-700 hover:bg-slate-800/80 cursor-grab active:cursor-grabbing transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${item.bg} ${item.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-200 truncate">{item.label}</span>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
