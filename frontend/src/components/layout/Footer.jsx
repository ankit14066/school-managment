import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10 pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
          © {currentYear} Quit Green Valley Convent School
        </span>
        <span className="hidden sm:inline text-slate-200">•</span>
        <span className="hidden sm:block text-xs font-bold text-slate-300">All rights reserved.</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-slate-400">Powered by</span>
        <span className="text-xs font-extrabold text-emerald-600">SchoolMS Portal</span>
      </div>
    </footer>
  );
};

export default Footer;
