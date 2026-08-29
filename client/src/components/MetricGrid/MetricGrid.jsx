import { PlayCircle, CheckCircle2, AlertTriangle, GitBranch, Zap, Clock } from 'lucide-react';

export default function MetricGrid({ stats = {} }) {
  const metrics = [
    {
      title: 'Total Workflows',
      value: stats.totalWorkflows || 0,
      sub: `${stats.activeWorkflows || 0} active`,
      icon: GitBranch,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Total Executions',
      value: stats.totalExecutions || 0,
      sub: `${stats.runningExecutions || 0} currently running`,
      icon: PlayCircle,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate || 100}%`,
      sub: `${stats.failedExecutions || 0} failures handled`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Avg. Execution Time',
      value: `${stats.avgDurationMs ? (stats.avgDurationMs / 1000).toFixed(2) : 0.85}s`,
      sub: 'Multi-agent orchestration',
      icon: Clock,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.title}
            className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{m.title}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-white">{m.value}</p>
                <p className="mt-1 text-xs text-slate-400">{m.sub}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${m.bg}`}>
                <Icon className={`h-5 w-5 ${m.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
