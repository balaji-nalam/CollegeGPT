import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, MessageSquare, Table, Terminal, CheckCircle2, Play, AlertCircle } from 'lucide-react';

const providerConfig = {
  gmail: { icon: Mail, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', tag: 'Gmail' },
  slack: { icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', tag: 'Slack' },
  discord: { icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', tag: 'Discord' },
  'google-sheets': { icon: Table, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', tag: 'Google Sheets' },
  custom: { icon: Terminal, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', tag: 'Action' },
};

function ActionNode({ data, selected }) {
  const provider = data.provider || 'custom';
  const cfg = providerConfig[provider] || providerConfig.custom;
  const Icon = cfg.icon;
  const status = data.executionStatus; // 'running', 'completed', 'failed', null

  return (
    <div
      className={`relative min-w-[210px] rounded-2xl border bg-[#0d131f] p-4 shadow-xl transition-all ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-500/20'
          : status === 'running'
          ? 'border-indigo-400 ring-2 ring-indigo-400/40 animate-pulse'
          : status === 'completed'
          ? 'border-emerald-500/80'
          : status === 'failed'
          ? 'border-rose-500/80'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!h-3 !w-3 !bg-indigo-400 !border-2 !border-[#0d131f]"
      />

      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${cfg.bg} ${cfg.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{cfg.tag}</span>
            {status === 'running' && (
              <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                Active
              </span>
            )}
            {status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            {status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-rose-400" />}
          </div>
          <p className="text-xs font-semibold text-slate-100 truncate">{data.label || 'Tool Action'}</p>
        </div>
      </div>

      {data.action && (
        <div className="mt-2.5 rounded-lg bg-slate-900/60 px-2 py-1 text-[10px] font-mono text-slate-400 truncate border border-slate-800/80">
          action: {data.action}
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="!h-3 !w-3 !bg-indigo-400 !border-2 !border-[#0d131f]"
      />
    </div>
  );
}

export default memo(ActionNode);
