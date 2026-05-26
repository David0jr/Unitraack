import { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Download, Loader2, Building2 } from 'lucide-react';
import { dashboardService } from '../../requests/api/dashboardService';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface ThirdPartyStat {
  id: string;
  full_name: string;
  role: string;
  theme_color: string | null;
  cnpj: string | null;
  totalVisits: number;
  equipmentInPlanta: number;
  totalMovements: number;
}

export default function ThirdPartiesReport() {
  const [data, setData] = useState<ThirdPartyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getThirdPartyStats();
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch third party stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    try {
      setExporting(true);
      const imgData = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: '#F8FAFC',
        cacheBust: true,
      });
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('relatorio-terceirizadas.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4">
        <Building2 className="w-12 h-12 text-slate-300" />
        <p>Nenhuma empresa terceirizada encontrada.</p>
      </div>
    );
  }

  // Prepara os dados limitando às 10 empresas mais ativas
  const chartData = data.slice(0, 10).map(d => ({
    name: (d.full_name || 'Desconhecido').split(' ')[0], // Primeiro nome da empresa para caber no gráfico
    fullName: d.full_name,
    Requisições: d.totalVisits,
    'Equipamentos (Planta)': d.equipmentInPlanta,
    Movimentações: d.totalMovements,
    color: d.theme_color || '#94a3b8'
  }));

  const COLORS = chartData.map(d => d.color);

  return (
    <div className="space-y-8 flex flex-col pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-navy via-[#0A1A2F] to-navy/90 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-navy/20 overflow-hidden relative group">
        {/* Decorative subtle glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
             <Building2 className="w-6 h-6 text-primary" />
             Comparativo de Terceirizadas
          </h2>
          <p className="text-sm text-slate-300 mt-1 font-medium tracking-wide">Relatório consolidado de atividade e equipamentos</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="relative z-10 mt-6 sm:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-emerald-400 text-navy font-black rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {exporting ? 'GERANDO PDF...' : 'EXPORTAR PDF'}
        </button>
      </div>

      <div 
        ref={reportRef} 
        className="bg-gradient-to-b from-[#F8FAFC] to-slate-100/50 space-y-8 overflow-visible relative rounded-3xl"
        style={{ padding: '24px' }}
      >
        <div className="text-center mb-8 hidden pdf-only">
          <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Relatório Analítico <span className="text-primary">•</span> Usina Lins</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Comparativo Operacional de Terceirizadas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico 1: Atividade (Requisições vs Movimentações) */}
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:border-primary/20 transition-colors duration-500 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-sm font-black text-navy uppercase mb-8 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
               Volume de Atividade (Top 10)
            </h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorMov" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 20px', fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                  <Bar dataKey="Requisições" fill="url(#colorReq)" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="Movimentações" fill="url(#colorMov)" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Equipamentos na Planta (Pie Chart) */}
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:border-primary/20 transition-colors duration-500 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-primary opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-sm font-black text-navy uppercase mb-8 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
               Equipamentos dentro da Planta
            </h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.filter(d => d['Equipamentos (Planta)'] > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="Equipamentos (Planta)"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                    stroke="none"
                    cornerRadius={6}
                  >
                    {chartData.filter(d => d['Equipamentos (Planta)'] > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 20px', fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 800 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabela de Dados Completa */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden group hover:border-primary/20 transition-colors duration-500">
          <div className="p-8 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-white flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-black text-navy uppercase tracking-wide">Dados Consolidados (Todas as Empresas)</h3>
          </div>
          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-sm text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-6 py-3 font-bold text-[10px] text-slate-400 uppercase tracking-widest bg-transparent">Empresa</th>
                  <th className="px-6 py-3 font-bold text-[10px] text-slate-400 uppercase tracking-widest bg-transparent">CNPJ</th>
                  <th className="px-6 py-3 font-bold text-[10px] text-slate-400 uppercase tracking-widest bg-transparent text-center">Total Requisições</th>
                  <th className="px-6 py-3 font-bold text-[10px] text-slate-400 uppercase tracking-widest bg-transparent text-center">Eq. na Planta</th>
                  <th className="px-6 py-3 font-bold text-[10px] text-slate-400 uppercase tracking-widest bg-transparent text-center">Total Movimentações</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="bg-slate-50/50 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 transition-all duration-300 rounded-xl group/row">
                    <td className="px-6 py-4 font-black text-navy flex items-center gap-4 rounded-l-xl border-l-4 border-transparent group-hover/row:border-primary transition-colors">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-white border border-slate-100">
                         <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: row.theme_color || '#94a3b8' }} />
                      </div>
                      {row.full_name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium font-mono text-xs">{row.cnpj || 'Não informado'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-black text-xs shadow-sm">
                        {row.totalVisits}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-black text-xs shadow-sm">
                        {row.equipmentInPlanta}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center rounded-r-xl">
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-black text-xs shadow-sm">
                        {row.totalMovements}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
