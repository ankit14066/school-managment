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
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-bold text-primary-700">SchoolMS</h1>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto pb-20 lg:pb-8 flex flex-col justify-between">
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
