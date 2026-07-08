const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    admin: 'bg-indigo-50 text-indigo-700 border border-indigo-100/50',
    teacher: 'bg-sky-50 text-sky-700 border border-sky-100/50',
    student: 'bg-emerald-50 text-emerald-700 border border-emerald-100/50',
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-100/50',
    inactive: 'bg-red-50 text-red-700 border border-red-100/50',
    parent: 'bg-amber-50 text-amber-700 border border-amber-100/50',
    present: 'bg-emerald-50 text-emerald-700 border border-emerald-100/50',
    absent: 'bg-red-50 text-red-700 border border-red-100/50',
    late: 'bg-yellow-50 text-yellow-700 border border-yellow-200/50',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${variants[variant] || variants.default}`}
    >
      {children}
    </span>
  );
};

export default Badge;
