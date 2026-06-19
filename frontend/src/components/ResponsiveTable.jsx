const ResponsiveTable = ({ columns, data, keyField = '_id', mobileRender }) => {
  if (!data?.length) {
    return <div className="text-center py-8 text-gray-500">No records found</div>;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={row[keyField]} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div key={row[keyField]} className="card p-4">
            {mobileRender ? mobileRender(row) : columns.map((col) => (
              <div key={col.key} className="flex justify-between py-1 text-sm">
                <span className="text-gray-500">{col.label}</span>
                <span className="font-medium">{col.render ? col.render(row) : row[col.key]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default ResponsiveTable;
