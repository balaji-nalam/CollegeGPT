import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitFork } from 'lucide-react';

function ConditionNode({ data, selected }) {
  return (
    <div
      className={`relative min-w-[200px] rounded-2xl border bg-[#0d131f] p-4 shadow-xl transition-all ${
        selected
          ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-cyan-500/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!h-3 !w-3 !bg-cyan-400 !border-2 !border-[#0d131f]"
      />

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <GitFork className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Condition</span>
          <p className="text-xs font-semibold text-slate-100 truncate">{data.label || 'Branch Logic'}</p>
        </div>
      </div>

      {data.condition && (
        <div className="mt-2.5 rounded-lg bg-slate-900/60 px-2 py-1 text-[10px] font-mono text-cyan-300 truncate border border-slate-800/80">
          if: {data.condition}
        </div>
      )}

      {/* True / False handles */}
      <div className="mt-3 flex justify-between text-[10px] font-semibold text-slate-500 px-1">
        <span>True</span>
        <span>False</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '25%' }}
        className="!h-3 !w-3 !bg-emerald-400 !border-2 !border-[#0d131f]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '75%' }}
        className="!h-3 !w-3 !bg-rose-400 !border-2 !border-[#0d131f]"
      />
    </div>
  );
}

export default memo(ConditionNode);
