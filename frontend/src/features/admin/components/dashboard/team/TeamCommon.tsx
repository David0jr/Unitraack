import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
        active 
          ? 'bg-white text-navy shadow-sm border border-slate-100' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
      }`}
    >
      {icon}
      {label}
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
        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-navy font-bold text-xs cursor-pointer flex items-center justify-between hover:border-primary/30 transition-all select-none"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className={`absolute ${direction === 'up' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'} left-0 right-0 bg-white border border-slate-100 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto`}>
          {options.map((opt: any, i: number) => {
            if (opt.type === 'group') {
              return (
                <div key={i} className="py-1">
                  <div className="px-5 pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/50">
                    {opt.label}
                  </div>
                  {opt.items.map((item: any) => (
                    <div 
                      key={item.value}
                      onClick={() => { onChange(item.value); setIsOpen(false); }}
                      className={`px-5 py-2.5 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all ${value === item.value ? 'text-primary bg-primary/5' : 'text-slate-600'}`}
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
                className={`px-5 py-3 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all ${value === opt.value ? 'text-primary bg-primary/5' : 'text-slate-600'} ${i === 0 ? 'rounded-t-2xl' : ''} ${i === options.length - 1 ? 'rounded-b-2xl' : ''}`}
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
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
      <input 
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-navy placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-xs"
      />
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-navy/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden border border-white/20">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-black text-navy uppercase tracking-tighter italic">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-navy">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

