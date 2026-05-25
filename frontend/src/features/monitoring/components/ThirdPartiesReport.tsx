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
    <div className="space-y-6 h-full flex flex-col pb-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-navy uppercase tracking-tight">Comparativo de Terceirizadas</h2>
          <p className="text-sm text-slate-500">Relatório consolidado de atividade e equipamentos</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'GERANDO PDF...' : 'EXPORTAR PDF'}
        </button>
      </div>

      <div 
        ref={reportRef} 
        className="flex-1 bg-[#F8FAFC] space-y-6 overflow-visible"
        style={{ padding: '20px' }} // Padding for the PDF export to not cut edges
      >
        <div className="text-center mb-6 hidden pdf-only">
          {/* Este cabeçalho só faz sentido no PDF, no frontend normal ele fica oculto pela classe global ou inline */}
          <h1 className="text-2xl font-bold text-navy uppercase">Relatório Analítico - Usina Lins</h1>
          <p className="text-slate-500">Comparativo Operacional de Terceirizadas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Atividade (Requisições vs Movimentações) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-navy uppercase mb-6 text-center">Volume de Atividade (Top 10)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Requisições" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Movimentações" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Equipamentos na Planta (Pie Chart) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-navy uppercase mb-6 text-center">Equipamentos dentro da Planta</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.filter(d => d['Equipamentos (Planta)'] > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="Equipamentos (Planta)"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {chartData.filter(d => d['Equipamentos (Planta)'] > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabela de Dados Completa */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-bold text-navy uppercase">Dados Consolidados (Todas)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-medium">Empresa</th>
                  <th className="px-6 py-4 font-medium">CNPJ</th>
                  <th className="px-6 py-4 font-medium text-center">Total Requisições</th>
                  <th className="px-6 py-4 font-medium text-center">Eq. na Planta</th>
                  <th className="px-6 py-4 font-medium text-center">Total Movimentações</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-navy flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.theme_color || '#94a3b8' }} />
                      {row.full_name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{row.cnpj || 'N/A'}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">{row.totalVisits}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{row.equipmentInPlanta}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">{row.totalMovements}</td>
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
