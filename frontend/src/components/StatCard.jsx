const StatCard = ({ title, value, icon, color = 'green', badge }) => {
  const colors = {
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    pink: 'bg-pink-50 text-pink-600 border-pink-100',
    yellow: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${colors[color] || colors.green}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide truncate leading-none mb-1.5">{title}</p>
        <p className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight truncate">{value}</p>
        {badge && (
          <div className="mt-2">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
