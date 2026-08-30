import React from 'react';
import { useRouter } from 'next/router';
import {
  MessageSquare,
  FileText,
  Settings,
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  Plus,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const router = useRouter();
  const { user } = useAuthStore();

  const navigation = [
    { name: 'Academic Chat', href: '/', icon: MessageSquare },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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

  const go = (href) => { router.push(href); onClose(); };

  return (
    <>
      {mobileOpen && <button onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden" aria-label="Close navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-shrink-0 flex-col justify-between border-r border-slate-800/80 bg-[#090d16]/95 p-4 shadow-2xl backdrop-blur-xl transition-transform lg:static lg:w-64 lg:translate-x-0 lg:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between lg:hidden">
          <span className="font-semibold text-white">Navigation</span><button onClick={onClose} className="p-2 text-slate-400"><X className="h-5 w-5" /></button>
        </div>
        <button onClick={() => go('/')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500">
          <Plus className="h-4 w-4" /> New Consultation
        </button>
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
                onClick={() => go(item.href)}
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
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200">Grounded RAG Engine</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              pgvector • Top-5 Retrieval
            </p>
          </div>
        </div>
        <button onClick={() => go('/settings')} className="mt-3 flex w-full items-center gap-2 border-t border-slate-800 pt-3 text-xs text-slate-400 transition hover:text-white"><Settings className="h-3.5 w-3.5" /> Account & settings</button>
      </div>
      </aside>
    </>
  );
}
