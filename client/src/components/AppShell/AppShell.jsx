import Header from './Header';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function AppShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060b14] text-slate-100 selection:bg-indigo-500/40">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,140,255,0.18),transparent_20%),radial-gradient(circle_at_top_right,rgba(94,234,212,0.12),transparent_18%)]" />
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(6,11,20,0.7),rgba(6,11,20,0.98))] p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
