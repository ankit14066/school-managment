import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const GreenSelect = ({ value, onChange, className = '', children, required = false, error = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const options = [];
  const childArray = Array.isArray(children) ? children.flat() : [children];
  childArray.forEach((child) => {
    if (!child) return;
    if (Array.isArray(child)) {
      child.forEach((c) => {
        if (c?.type === 'option') {
          options.push({ value: c.props.value, label: c.props.children });
        }
      });
    } else if (child?.type === 'option') {
      options.push({ value: child.props.value, label: child.props.children });
    }
  });

  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {required && (
        <input
          type="text"
          required
          readOnly
          value={value || ''}
          tabIndex={-1}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-4 py-3 border rounded-xl bg-white text-left flex items-center justify-between gap-2 text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${error ? 'border-rose-400' : 'border-slate-200'}`}
      >
        <span className="text-slate-700 truncate">{selected?.label || 'Select'}</span>
        <ChevronDown size={18} className={`text-slate-400 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {error && <p className="field-error">{error}</p>}

      {open && (
        <ul className="absolute z-50 mt-1.5 w-full bg-white border border-slate-100 rounded-xl shadow-lg p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setOpen(false);
              }}
              className={`px-3 py-2.5 text-base font-semibold rounded-lg cursor-pointer ${
                String(opt.value) === String(value)
                  ? 'bg-emerald-600 text-white'
                  : 'hover:bg-emerald-50 text-slate-700'
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GreenSelect;
