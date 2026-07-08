import { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Footer from './Footer';

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.015)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-50 active:scale-95 transition-all" aria-label="Open menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo-1.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-extrabold text-slate-800 text-sm tracking-tight">Green Valley</span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">Portal</span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto pb-24 lg:pb-8 flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default DashboardLayout;
