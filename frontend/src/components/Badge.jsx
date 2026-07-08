const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-50 text-slate-600 border-slate-200/60',
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-100/60',
    teacher: 'bg-sky-50 text-sky-700 border-sky-100/60',
    student: 'bg-emerald-50 text-emerald-700 border-emerald-100/60',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100/60',
    inactive: 'bg-rose-50 text-rose-700 border-rose-100/60',
    parent: 'bg-amber-50 text-amber-700 border-amber-100/60',
    present: 'bg-emerald-50 text-emerald-700 border-emerald-100/60',
    absent: 'bg-rose-50 text-rose-700 border-rose-100/60',
    late: 'bg-amber-50 text-amber-700 border-amber-200/60',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wide border ${variants[variant] || variants.default}`}
    >
      {children}
    </span>
  );
};

export default Badge;
