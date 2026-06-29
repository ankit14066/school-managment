import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 pt-4 pb-2 border-t border-gray-200/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
        <span className="font-semibold text-gray-600">
          © {currentYear} Quit Green Valley Convent School.
        </span>
        <span className="hidden sm:inline text-gray-300">•</span>
        <span>All rights reserved.</span>
      </div>
      {/* <div className="flex items-center gap-1 text-gray-400">
        <span>Powered by</span>
        <span className="font-medium text-green-700/80 transition-colors hover:text-green-700">SchoolMS</span>
      </div> */}
    </footer>
  );
};

export default Footer;
