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
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white 
                   text-left flex items-center justify-between gap-2
                   focus:outline-none focus:ring-2 focus:ring-green-500 
                   focus:border-transparent transition-shadow"
      >
        <span className="text-sm text-gray-700">
          {selected?.label || 'Select'}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform duration-200 
                      ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown List */}
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 
                       rounded-lg shadow-lg overflow-hidden">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors
                ${String(opt.value) === String(value)
                  ? 'bg-green-700 text-white'        // selected = green
                  : 'hover:bg-green-50 text-gray-700' // hover = light green
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