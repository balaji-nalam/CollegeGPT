import { useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, User, LogOut, Shield, GraduationCap, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationDrawer from './NotificationDrawer';

export default function Header({ onMenuToggle }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#090d16]/90 px-4 sm:px-6 backdrop-blur-md">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-indigo-400/30 bg-slate-950 shadow-lg shadow-indigo-500/20">
            <img src="/collegegpt-logo.png" alt="CollegeGPT logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                College<span className="text-indigo-400">GPT</span>
              </h1>
              <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                RAG v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">RAG-Based College Information Assistant</p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Live RAG pulse indicator */}
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-400">RAG Engine Online</span>
          </div>

          {/* Notifications button */}
          <button onClick={() => setDrawerOpen(true)} className="relative hidden rounded-xl p-2 text-slate-400 hover:bg-slate-800/80 hover:text-white transition sm:block" title="Notifications">
            <Bell className="h-5 w-5" />
          </button>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1.5 pr-3 hover:bg-slate-800 transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300 font-semibold text-xs border border-indigo-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.name || 'Student'}</p>
                <span className="text-[10px] text-indigo-400 capitalize">{user?.role || 'Student'}</span>
              </div>
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-[#0f172a] py-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800/80">
                  <p className="text-xs font-medium text-slate-200">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-400">
                    <Shield className="h-3 w-3" />
                    <span className="capitalize">{user?.role} Role</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/settings');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Account Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
