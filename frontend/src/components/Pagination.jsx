const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm font-bold text-slate-500">
        Page <span className="text-emerald-600">{page}</span> of <span className="text-slate-700">{pages}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="text-sm font-bold text-slate-600 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="text-sm font-bold text-slate-600 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
