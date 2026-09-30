import React from 'react';
import { AlertOctagon, BarChart3, History, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../../../../contexts/DashboardContext';

export const DashboardStats: React.FC = () => {
  const { stats } = useDashboard();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
      <StatCard 
        label="Casos Pendentes" 
        value={stats.pending.toString()} 
        icon={<AlertOctagon className="w-5 h-5" />}
        color="bg-rose-50 text-rose-600 border border-rose-100/80"
      />
      <StatCard 
        label="Ativos no Pátio" 
        value={stats.active.toString()} 
        icon={<BarChart3 className="w-5 h-5" />}
        color="bg-sky-50 text-sky-600 border border-sky-100/80"
      />
      <StatCard 
        label="Divergências" 
        value={stats.discrepancies.toString()} 
        icon={<AlertTriangle className="w-5 h-5" />}
        color="bg-amber-50 text-amber-600 border border-amber-100/80"
      />
      <StatCard 
        label="Movimentações (Média)" 
        value={stats.completed.toString()} 
        icon={<History className="w-5 h-5" />}
        color="bg-emerald-50 text-emerald-600 border border-emerald-100/80"
      />
    </div>
  );
};

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-xs`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl md:text-3xl font-bold text-navy tracking-tight mt-1">{value}</p>
      </div>
    </div>
  );
}
