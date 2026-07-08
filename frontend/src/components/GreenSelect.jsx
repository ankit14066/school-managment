import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const GreenSelect = ({ value, onChange, className = '', children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Children se options nikaal lo
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

  // Bahar click karo toh close ho jaye
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Main Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/30 
                   text-left flex items-center justify-between gap-2 text-sm font-semibold text-slate-700
                   focus:outline-none focus:ring-4 focus:ring-primary-500/10 
                   focus:border-primary-500 transition-all"
      >
        <span className="text-slate-700">
          {selected?.label || 'Select'}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 
                      ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown List */}
      {open && (
        <ul className="absolute z-50 mt-1.5 w-full bg-white border border-slate-100 
                       rounded-xl shadow-[0_12px_32px_rgba(15,23,42,0.08)] p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors
                ${String(opt.value) === String(value)
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-primary-50 text-slate-700'
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