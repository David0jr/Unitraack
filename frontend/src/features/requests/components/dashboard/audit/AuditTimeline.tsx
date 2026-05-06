import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Package, 
  ShieldCheck, 
  ArrowRight,
  MapPin,
  ChevronLeft,
  History,
  Search,
  XCircle,
  FileDown,
  Activity,
  UserCheck
} from 'lucide-react';

interface AuditMovement {
  id: string;
  from_sector: { name: string };
  to_sector: { name: string };
  actor: { full_name: string };
  moved_at: string;
}

interface AuditMaterial {
  id: string;
  name: string;
  brand: string;
  model: string;
  movements: AuditMovement[];
}

interface AuditRequest {
  id: string;
  created_at: string;
  entry_date: string;
  gate_checked_at?: string;
  gate_checked_by_profile?: { full_name: string; role: string };
  exit_at: string | null;
  status: string;
  profile: { full_name: string; role: string };
  sector?: { name: string };
  materials: AuditMaterial[];
}

interface AuditTimelineProps {
  auditData: AuditRequest[];
  profileName: string;
  onBack: () => void;
}

export function AuditTimeline({ auditData, profileName, onBack }: AuditTimelineProps) {
  const [filterType, setFilterType] = useState<'all' | 'active' | 'finished'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text('Relatório de Auditoria e Rastreabilidade', 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Empresa: ${profileName}`, 14, 35);
    doc.text(`Emitido em: ${new Date().toLocaleString()}`, 14, 40);
    doc.text(`Filtros Aplicados: ${filterType === 'all' ? 'Todos' : filterType === 'active' ? 'Ativas' : 'Finalizadas'} | Data: ${dateFilter || 'Sem filtro'} | Busca: ${searchText || 'Sem filtro'}`, 14, 45);

    // Summary Table
    autoTable(doc, {
      startY: 55,
      head: [['Métrica de Auditoria', 'Valor']],
      body: [
        ['Total de Contratos/Entradas Analisados', auditData.length.toString()],
        ['Tempo Médio de Permanência (Visitas Finalizadas)', calculateAverageStay(auditData)],
        ['Total de Ativos/Materiais Registrados', auditData.reduce((acc, curr) => acc + (curr.materials?.length || 0), 0).toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    // Access History Table
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Histórico de Acessos (Entradas e Saídas)', 14, (doc as any).lastAutoTable.finalY + 15);

    const entriesBody = filteredData.map(req => {
      const movements = (req.materials || []).flatMap(m => m.movements || []);
      const firstMovement = [...movements].sort((a, b) => 
        new Date(a.moved_at).getTime() - new Date(b.moved_at).getTime()
      )[0];

      const entryTime = firstMovement ? firstMovement.moved_at : (req.gate_checked_at || req.created_at);

      return [
        new Date(entryTime).toLocaleString(),
        req.exit_at ? new Date(req.exit_at).toLocaleString() : 'Ativo na Planta',
        calculateDuration(entryTime, req.exit_at),
        req.gate_checked_by_profile?.full_name.split(' (')[0] || 'Portaria'
      ];
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Data/Hora Entrada', 'Data/Hora Saída', 'Permanência', 'Confirmado por']],
      body: entriesBody,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 10 },
      styles: { fontSize: 8 }
    });

    // Detailed Internal Movements
    doc.setFontSize(14);
    doc.text('Rastreabilidade de Movimentações Internas', 14, (doc as any).lastAutoTable.finalY + 15);

    const movementsBody: any[] = [];
    filteredData.forEach(req => {
      (req.materials || []).forEach(mat => {
        (mat.movements || []).forEach(move => {
          movementsBody.push([
            mat.name,
            mat.brand + ' ' + mat.model,
            move.from_sector?.name || 'Portaria',
            move.to_sector?.name || req.sector?.name || 'Planta',
            new Date(move.moved_at).toLocaleString(),
            move.actor.full_name.split(' (')[0]
          ]);
        });
      });
    });

    if (movementsBody.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Material', 'Marca/Modelo', 'Origem', 'Destino', 'Data/Hora', 'Responsável']],
        body: movementsBody,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 10 },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 }
        }
      });
    }

    doc.save(`Relatorio_Auditoria_${profileName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredData = useMemo(() => {
    return auditData.filter(request => {
      if (filterType === 'active' && request.exit_at) return false;
      if (filterType === 'finished' && !request.exit_at) return false;

      if (dateFilter) {
        const reqDate = new Date(request.gate_checked_at || request.created_at).toISOString().split('T')[0];
        if (reqDate !== dateFilter) return false;
      }

      if (searchText) {
        const hasMaterial = (request.materials || []).some((m: any) => 
          m.name.toLowerCase().includes(searchText.toLowerCase()) ||
          m.model.toLowerCase().includes(searchText.toLowerCase()) ||
          m.brand.toLowerCase().includes(searchText.toLowerCase())
        );
        if (!hasMaterial) return false;
      }

      return true;
    });
  }, [auditData, filterType, dateFilter, searchText]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center justify-between">
         <button 
           onClick={onBack}
           className="group flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-navy hover:bg-navy hover:text-white transition-all uppercase tracking-widest shadow-sm"
         >
           <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
           Voltar para Pesquisa
         </button>
         
         <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-navy uppercase tracking-widest">Logs em Tempo Real</span>
            </div>
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-3 bg-navy text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#002880] active:scale-95 transition-all shadow-xl shadow-navy/20"
            >
              <FileDown className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Exportar PDF Industrial</span>
            </button>
         </div>
      </div>

      {/* Header do Perfil Auditoria */}
      <div className="bg-[#001540] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
         <div className="absolute right-[-5%] top-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
         
         <div className="flex flex-col md:flex-row md:items-center gap-10 relative z-10">
            <div className="w-28 h-28 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative group">
               <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] scale-0 group-hover:scale-100 transition-transform duration-500"></div>
               <Building2 className="w-14 h-14 text-white relative z-10" />
            </div>
            
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-primary text-navy text-[8px] font-black uppercase tracking-[0.2em] rounded-lg">Entidade Verificada</span>
                  <div className="w-px h-4 bg-white/10"></div>
                  <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Protocolo de Auditoria v4.2</span>
               </div>
               <h3 className="text-5xl font-black uppercase tracking-tighter mb-6 leading-none">
                 {profileName}
               </h3>
               
               <div className="flex flex-wrap gap-4">
                  <StatBadge icon={Calendar} label="Contratos" value={auditData.length.toString()} />
                  <StatBadge icon={Clock} label="Média" value={calculateAverageStay(auditData)} />
                  <StatBadge icon={Package} label="Ativos" value={auditData.reduce((acc, curr) => acc + (curr.materials?.length || 0), 0).toString()} />
               </div>
            </div>
         </div>
      </div>

      {/* Toolbar de Auditoria */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center gap-6">
         <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {[
              { id: 'all', label: 'TUDO', icon: History },
              { id: 'active', label: 'NA PLANTA', icon: Activity },
              { id: 'finished', label: 'FINALIZADOS', icon: ShieldCheck }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  filterType === type.id 
                    ? 'bg-navy text-white shadow-lg shadow-navy/20' 
                    : 'text-slate-400 hover:text-navy hover:bg-slate-100'
                }`}
              >
                <type.icon className={`w-3.5 h-3.5 ${filterType === type.id ? 'text-primary' : 'text-slate-300'}`} />
                {type.label}
              </button>
            ))}
         </div>

         <div className="w-px h-10 bg-slate-100 hidden lg:block"></div>

         <div className="flex flex-1 items-center gap-4 w-full">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
               <input 
                 type="text" 
                 placeholder="FILTRAR MATERIAIS, MARCAS OU MODELOS..."
                 value={searchText}
                 onChange={e => setSearchText(e.target.value)}
                 className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-navy uppercase tracking-widest placeholder:text-slate-300 focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all"
               />
            </div>
            
            <div className="relative group">
               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
               <input 
                 type="date"
                 value={dateFilter}
                 onChange={e => setDateFilter(e.target.value)}
                 className="pl-11 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-navy uppercase tracking-widest focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all cursor-pointer"
               />
               {dateFilter && (
                 <button onClick={() => setDateFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500"><XCircle className="w-4 h-4" /></button>
               )}
            </div>
         </div>
      </div>

      {/* Fluxo de Auditoria */}
      <div className="relative pl-12 space-y-10">
         {/* Linha da Timeline */}
         <div className="absolute left-6 top-4 bottom-4 w-px border-l-2 border-dashed border-slate-200"></div>

         {filteredData.length === 0 ? (
            <div className="py-24 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
               <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nenhum registro encontrado para esta análise</p>
            </div>
         ) : filteredData.map((request, idx) => (
            <div key={request.id} className="relative group/card animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
               {/* Ponto da Timeline */}
               <div className="absolute -left-[3.25rem] top-0 w-10 h-10 rounded-2xl bg-white border-2 border-slate-100 shadow-xl z-10 flex items-center justify-center font-black text-xs text-navy group-hover/card:border-primary group-hover/card:scale-110 transition-all duration-300">
                  {filteredData.length - idx}
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-navy/5 transition-all duration-500">
                  <div className="p-8">
                     <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 bg-navy text-white rounded-[1.25rem] flex items-center justify-center shadow-lg">
                              <UserCheck className="w-7 h-7" />
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Check-in Realizado</p>
                              <div className="flex items-center gap-3">
                                 <h4 className="text-xl font-black text-navy uppercase tracking-tight">
                                   {new Date(request.gate_checked_at || request.created_at).toLocaleDateString('pt-BR')}
                                 </h4>
                                 <span className="text-primary font-black text-lg">/</span>
                                 <h4 className="text-xl font-black text-navy uppercase tracking-tight">
                                   {new Date(request.gate_checked_at || request.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                 </h4>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="text-right hidden sm:block">
                              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Status do Ciclo</p>
                              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                request.exit_at 
                                  ? 'bg-slate-50 text-slate-400 border-slate-100' 
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}>
                                {request.exit_at ? 'CICLO FINALIZADO' : 'EM OPERAÇÃO'}
                              </span>
                           </div>
                           
                           {request.exit_at && (
                             <div className="bg-navy p-4 rounded-2xl text-white shadow-lg">
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Permanência</p>
                                <p className="text-sm font-black uppercase leading-none">{calculateDuration(request.gate_checked_at || request.created_at, request.exit_at)}</p>
                             </div>
                           )}
                        </div>
                     </div>

                     {/* Grid de Materiais Auditados */}
                     <div className="space-y-4">
                        {(request.materials || []).map(material => (
                          <div key={material.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 group/material hover:bg-white hover:border-primary/20 transition-all duration-300">
                             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-white text-navy rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover/material:bg-navy group-hover/material:text-white transition-all">
                                      <Package className="w-6 h-6" />
                                   </div>
                                   <div>
                                      <h5 className="font-black text-navy text-sm uppercase tracking-tight mb-1">{material.name}</h5>
                                      <div className="flex items-center gap-2">
                                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{material.brand}</span>
                                         <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{material.model}</span>
                                      </div>
                                   </div>
                                </div>

                                <div className="flex items-center gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-200/50">
                                   <div className="flex-1 md:flex-none">
                                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Último Rastro Local</p>
                                      <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,214,0,0.4)]"></div>
                                         <span className="text-[10px] font-black text-navy uppercase">
                                           {(material.movements || []).length > 0 
                                             ? material.movements[material.movements.length - 1].to_sector?.name 
                                             : 'GATE PRINCIPAL'}
                                         </span>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Total Hops</p>
                                      <span className="text-sm font-black text-navy">{(material.movements || []).length}</span>
                                   </div>
                                </div>
                             </div>

                             {/* Trilha de Movimentos */}
                             {(material.movements || []).length > 0 && (
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                                  {material.movements.map((move, mIdx) => (
                                    <div key={move.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group/move hover:border-primary/30 transition-all">
                                       <div className="absolute top-0 right-0 px-2 py-1 bg-slate-50 text-[7px] font-black text-slate-300 rounded-bl-lg">#{mIdx + 1}</div>
                                       <div className="flex flex-col gap-3">
                                          <div className="flex items-center gap-2">
                                             <div className="w-1.5 h-10 bg-primary/20 rounded-full flex flex-col items-center py-1">
                                                <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                                             </div>
                                             <div className="flex-1">
                                                <p className="text-[9px] font-black text-navy uppercase leading-tight mb-1">{move.to_sector?.name || 'Setor'}</p>
                                                <p className="text-[7px] font-bold text-slate-400 uppercase">Origem: {move.from_sector?.name || 'Gate'}</p>
                                             </div>
                                          </div>
                                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                             <div className="flex items-center gap-1.5">
                                                <Clock className="w-2.5 h-2.5 text-slate-300" />
                                                <span className="text-[8px] font-black text-navy">{new Date(move.moved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                             </div>
                                             <div className="flex items-center gap-1.5">
                                                <MapPin className="w-2.5 h-2.5 text-slate-200" />
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                             )}
                          </div>
                        ))}
                     </div>
                  </div>
                  
                  {/* Rodapé de Verificação */}
                  <div className="bg-slate-50/80 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                           <div className="w-5 h-5 bg-navy text-white rounded-lg flex items-center justify-center">
                              <ShieldCheck className="w-3 h-3" />
                           </div>
                           <span className="text-[9px] font-black text-navy uppercase tracking-widest">Auditado e Criptografado</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200"></div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">ID: {request.id.slice(0, 8)}</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-400">
                        <p className="text-[8px] font-bold uppercase italic">Confirmado por: {request.gate_checked_by_profile?.full_name || 'Agente de Portaria'}</p>
                     </div>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}

function StatBadge({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all cursor-default group/stat">
       <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center group-hover/stat:rotate-12 transition-transform duration-300">
          <Icon className="w-4 h-4 text-navy" />
       </div>
       <div>
          <p className="text-white/40 text-[7px] leading-none mb-1">{label}</p>
          <p className="text-white leading-none">{value}</p>
       </div>
    </div>
  );
}

// Helpers
function calculateDuration(start: string, end: string | null) {
  if (!end) return 'Ativo';
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const diffInMs = e - s;
  
  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
}

function calculateAverageStay(data: AuditRequest[]) {
  if (!data) return 'N/A';
  const completed = data.filter(d => d.exit_at);
  if (completed.length === 0) return 'N/A';
  
  const totalMs = completed.reduce((acc, curr) => {
    const entry = new Date(curr.gate_checked_at || curr.created_at).getTime();
    const exit = new Date(curr.exit_at!).getTime();
    return acc + (exit - entry);
  }, 0);
  
  const avgMs = totalMs / completed.length;
  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  return `${hours}h médios`;
}
