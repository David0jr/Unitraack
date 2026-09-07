import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileNavProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  items: NavItem[];
}

export const MobileNav: React.FC<MobileNavProps> = ({ 
  activeSection, 
  setActiveSection, 
  items 
}) => {
  return (
    <nav className="lg:hidden fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-xl border border-slate-200/50 z-[100] px-4 rounded-3xl shadow-2xl shadow-navy/20">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative ${
                isActive 
                  ? 'text-primary' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${
                isActive ? 'bg-primary/10' : ''
              }`}>
                {React.cloneElement(item.icon as any, { 
                  size: 18,
                  strokeWidth: isActive ? 2.5 : 2
                })}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${
                isActive ? 'opacity-100' : 'opacity-60'
              }`}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(0,170,161,0.6)] animate-in fade-in zoom-in duration-300"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
