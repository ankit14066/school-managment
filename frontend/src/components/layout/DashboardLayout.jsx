import { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Footer from './Footer';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-xl text-slate-650 hover:bg-slate-50" aria-label="Open menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo-1.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/167/167707.png"} />
              <span className="font-extrabold text-slate-800 text-base tracking-tight">Quit Green Valley</span>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">Portal</span>
        </header>

        <header className="hidden lg:flex items-center justify-between bg-white border-b border-slate-100 px-8 py-4 sticky top-0 z-30 select-none">
          <div className="relative w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students, staff, class..."
              className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" />
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-base flex items-center justify-center uppercase">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name || 'User'}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-none mt-0.5">{user?.role || 'Guest'}</p>
              </div>
            </div>
          </div>
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
