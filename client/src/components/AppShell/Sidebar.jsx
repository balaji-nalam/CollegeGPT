import React from 'react';
import { useRouter } from 'next/router';
import {
  MessageSquare,
  FileText,
  Settings,
  Bot,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar() {
  const router = useRouter();
  const { user } = useAuthStore();

  const navigation = [
    { name: 'Academic Chat', href: '/', icon: MessageSquare },
  ];

  if (user?.role === 'admin') {
    navigation.push({
      name: 'Knowledge Ingestion',
      href: '/admin/documents',
      icon: FileText,
      badge: 'Admin',
    });
  }

  navigation.push({ name: 'Settings', href: '/settings', icon: Settings });

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-[#090d16] flex flex-col justify-between p-4">
      <div className="space-y-6">
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            CollegeGPT Portal
          </p>
          {navigation.map((item) => {
            const isActive =
              router.pathname === item.href ||
              (item.href !== '/' && router.pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* RAG Engine Status Badge */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200">Grounded RAG Engine</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              pgvector • Top-5 Retrieval
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
