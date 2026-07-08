const StatCard = ({ title, value, icon, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50/70 text-primary-600 border-primary-100/50 shadow-primary-500/10',
    green: 'bg-emerald-50/70 text-emerald-600 border-emerald-100/50 shadow-emerald-500/10',
    blue: 'bg-blue-50/70 text-blue-600 border-blue-100/50 shadow-blue-500/10',
    purple: 'bg-indigo-50/70 text-indigo-600 border-indigo-100/50 shadow-indigo-500/10',
    orange: 'bg-amber-50/70 text-amber-600 border-amber-100/50 shadow-amber-500/10',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_12px_32px_rgb(0,0,0,0.035)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
      <div className={`p-3.5 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${colors[color] || colors.primary}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
        <p className="text-2xl font-extrabold text-slate-800 mt-0.5 tracking-tight truncate">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
