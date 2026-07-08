const ResponsiveTable = ({ columns, data, keyField = '_id', mobileRender }) => {
  if (!data?.length) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
        <p className="text-sm font-semibold text-slate-400">No records found</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden bg-white rounded-2xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {columns.map((col) => (
                  <th key={col.key} className="text-left px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row[keyField]} className="hover:bg-primary-50/10 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5 text-sm font-medium text-slate-700">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <div key={row[keyField]} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-slate-200 transition-all">
            {mobileRender ? mobileRender(row) : (
              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between items-center py-1 text-sm border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                    <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">{col.label}</span>
                    <span className="font-semibold text-slate-700">{col.render ? col.render(row) : row[col.key]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default ResponsiveTable;
