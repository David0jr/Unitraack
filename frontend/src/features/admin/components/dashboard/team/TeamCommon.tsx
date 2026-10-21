import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

export function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
        active 
          ? 'bg-white text-navy font-semibold shadow-xs border border-slate-200/80' 
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
      }`}
    >
      <span className={active ? 'text-primary' : 'text-slate-400'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export function CustomSelect({ value, onChange, options, placeholder, direction = 'down' }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let selectedLabel = placeholder;
  for (const group of options) {
    if (group.type === 'option' && group.value === value) {
      selectedLabel = group.label;
    } else if (group.type === 'group') {
      const found = group.items.find((i: any) => i.value === value);
      if (found) selectedLabel = found.label;
    }
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl text-slate-800 font-medium text-xs cursor-pointer flex items-center justify-between hover:border-primary/50 transition-all select-none shadow-xs"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </div>

      {isOpen && (
        <div className={`absolute ${direction === 'up' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'} left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto custom-scrollbar`}>
          {options.map((opt: any, i: number) => {
            if (opt.type === 'group') {
              return (
                <div key={i} className="py-1">
                  <div className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/80">
                    {opt.label}
                  </div>
                  {opt.items.map((item: any) => (
                    <div 
                      key={item.value}
                      onClick={() => { onChange(item.value); setIsOpen(false); }}
                      className={`px-4 py-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${value === item.value ? 'text-primary font-semibold bg-primary/5' : 'text-slate-700'}`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div 
                key={opt.value || i}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-2.5 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${value === opt.value ? 'text-primary font-semibold bg-primary/5' : 'text-slate-700'}`}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function InputGroup({ id, label, placeholder, value, onChange, type = 'text', required = true }: any) {
  return (
    <div className="space-y-1.5 w-full">
      <label htmlFor={id} className="text-xs font-medium text-slate-700 ml-0.5 block">{label}</label>
      <input 
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-normal text-xs shadow-xs"
      />
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-navy/40 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      ></div>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden border border-slate-200/80">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200/70 rounded-lg transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
