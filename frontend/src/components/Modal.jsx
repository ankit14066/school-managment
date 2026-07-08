const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />

      <aside
        className={`fixed inset-y-0 right-0 w-full ${widths[size]} bg-white border-l border-slate-100 shadow-xl flex flex-col z-10`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 text-slate-700">
          {children}
        </div>
      </aside>
    </div>
  );
};

export default Modal;
