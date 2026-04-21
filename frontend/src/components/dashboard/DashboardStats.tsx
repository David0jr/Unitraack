import React from 'react';
import { AlertOctagon, BarChart3, ShieldAlert, History } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';

export const DashboardStats: React.FC = () => {
  const { stats } = useDashboard();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
      <StatCard 
        label="Casos Pendentes" 
        value={stats.pending.toString()} 
        icon={<AlertOctagon className="w-6 h-6" />}
        color="bg-red-50 text-red-600"
      />
      <StatCard 
        label="Ativos no Pátio" 
        value={stats.active.toString()} 
        icon={<BarChart3 className="w-6 h-6" />}
        color="bg-blue-50 text-blue-600"
      />
      <StatCard 
        label="Sensores Offline" 
        value="0" 
        icon={<ShieldAlert className="w-6 h-6" />}
        color="bg-slate-50 text-slate-400"
      />
      <StatCard 
        label="Movimentações (Média)" 
        value={stats.completed.toString()} 
        icon={<History className="w-6 h-6" />}
        color="bg-emerald-50 text-emerald-600"
      />
    </div>
  );
};

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl hover:shadow-navy/5 transition-all">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-navy">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 ${color}`}>
        {icon}
      </div>
    </div>
  );
}
