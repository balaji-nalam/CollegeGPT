import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Clock, Globe, Bell } from 'lucide-react';

const triggerIcons = {
  manual: Zap,
  schedule: Clock,
  webhook: Globe,
  event: Bell,
};

function TriggerNode({ data, selected }) {
  const triggerType = data.triggerType || 'manual';
  const Icon = triggerIcons[triggerType] || Zap;

  return (
    <div
      className={`relative min-w-[200px] rounded-2xl border bg-[#0d131f] p-4 shadow-xl transition-all ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-500/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Trigger</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs font-semibold text-slate-100 truncate">{data.label || 'Workflow Trigger'}</p>
        </div>
      </div>

      {data.description && (
        <p className="mt-2 text-[11px] text-slate-400 leading-snug truncate">{data.description}</p>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="!h-3 !w-3 !bg-amber-400 !border-2 !border-[#0d131f]"
      />
    </div>
  );
}

export default memo(TriggerNode);
