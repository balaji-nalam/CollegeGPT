import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles, Bot, CheckCircle2, AlertCircle } from 'lucide-react';

function AINode({ data, selected }) {
  const status = data.executionStatus;

  return (
    <div
      className={`relative min-w-[210px] rounded-2xl border bg-[#0d131f] p-4 shadow-xl transition-all ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-purple-500/20'
          : status === 'running'
          ? 'border-purple-400 ring-2 ring-purple-400/40 animate-pulse'
          : status === 'completed'
          ? 'border-emerald-500/80'
          : status === 'failed'
          ? 'border-rose-500/80'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!h-3 !w-3 !bg-purple-400 !border-2 !border-[#0d131f]"
      />

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">AI Agent</span>
            {status === 'running' && (
              <span className="flex items-center gap-1 text-[10px] text-purple-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                Thinking
              </span>
            )}
            {status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            {status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-rose-400" />}
          </div>
          <p className="text-xs font-semibold text-slate-100 truncate">{data.label || 'AI Transformation'}</p>
        </div>
      </div>

      {data.prompt && (
        <div className="mt-2.5 rounded-lg bg-slate-900/60 p-2 text-[11px] text-slate-300 line-clamp-2 border border-slate-800/80">
          "{data.prompt}"
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="!h-3 !w-3 !bg-purple-400 !border-2 !border-[#0d131f]"
      />
    </div>
  );
}

export default memo(AINode);
