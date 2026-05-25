import { useState, useMemo, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Package, 
  ShieldCheck, 
  MapPin,
  ChevronLeft,
  ChevronRight,
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
  actor: { full_name: string; role: string };
  moved_at: string;
  signature?: string;
}

interface AuditMaterial {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number?: string;
  description?: string;
  condition?: string;
  code?: string;
  movements: AuditMovement[];
}

interface AuditRequest {
  id: string;
  created_at: string;
  entry_date: string;
  gate_checked_at?: string;
  gate_checked_by_profile?: { full_name: string; role: string };
  approved_leader_profile?: { full_name: string; role: string };
  approved_gestor_profile?: { full_name: string; role: string };
  exit_at: string | null;
  status: string;
  signature?: string;
  profile: { 
    full_name: string; 
    role: string;
    cnpj?: string;
    phone?: string;
    representative_name?: string;
    logo_url?: string;
    company_color?: string;
  };
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, dateFilter, searchText]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const p = auditData[0]?.profile;

    // Header Industrial
    doc.setFillColor(0, 21, 64);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255); 
    doc.text('Relatório de Auditoria e Rastreabilidade', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Empresa Parceira: ${profileName.toUpperCase()}`, 14, 28);
    if (p?.cnpj) doc.text(`CNPJ: ${p.cnpj} | Representante: ${p.representative_name || 'N/A'}`, 14, 34);
    doc.text(`Emitido em: ${new Date().toLocaleString()} | Protocolo Industrial UsinaLins v4.2`, 14, 40);

    doc.setTextColor(15, 23, 42);
    
    // Summary Table
    autoTable(doc, {
      startY: 50,
      head: [['Métrica de Auditoria', 'Valor']],
      body: [
        ['Total de Contratos/Entradas Analisados', auditData.length.toString()],
        ['Tempo Médio de Permanência (Visitas Finalizadas)', calculateAverageStay(auditData)],
        ['Total de Ativos/Materiais Movimentados', auditData.reduce((acc, curr) => acc + (curr.materials?.length || 0), 0).toString()],
        ['Status do Parceiro', auditData.some(d => !d.exit_at) ? 'EM OPERAÇÃO NA PLANTA' : 'NENHUM ATIVO NA PLANTA'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 21, 64], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    // Access History Table
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Histórico de Acessos e Validações', 14, (doc as any).lastAutoTable.finalY + 15);

    const entriesBody = filteredData.map(req => {
      const movements = (req.materials || []).flatMap(m => m.movements || []);
      const firstMovement = [...movements].sort((a, b) => 
        new Date(a.moved_at).getTime() - new Date(b.moved_at).getTime()
      )[0];

      const entryTime = firstMovement ? firstMovement.moved_at : (req.gate_checked_at || req.created_at);

      return [
        new Date(entryTime).toLocaleString(),
        req.exit_at ? new Date(req.exit_at).toLocaleString() : 'EM OPERAÇÃO',
        calculateDuration(entryTime, req.exit_at),
        req.gate_checked_by_profile?.full_name.split(' (')[0] || 'Portaria',
        req.approved_leader_profile?.full_name.split(' (')[0] || 'N/A',
        req.signature || 'NÃO ASSINADO'
      ];
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Check-in', 'Check-out', 'Permanência', 'Portaria', 'Líder / Responsável', 'Assinatura']],
      body: entriesBody,
      theme: 'grid',
      headStyles: { fillColor: [0, 21, 64], fontSize: 8 },
      styles: { fontSize: 8 }
    });

    // Detailed Equipment Tracker
    doc.setFontSize(14);
    doc.text('Movimentações Detalhadas por Equipamento', 14, (doc as any).lastAutoTable.finalY + 15);

    let currentY = (doc as any).lastAutoTable.finalY + 20;

    filteredData.forEach(req => {
      (req.materials || []).forEach(mat => {
        const movements = mat.movements || [];
        if (movements.length === 0) return; // Only show materials with movements

        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        // Sub-header for equipment
        doc.setFillColor(240, 245, 250);
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setFontSize(10);
        doc.setTextColor(0, 21, 64);
        doc.setFont('helvetica', 'bold');
        doc.text(`Equipamento: ${mat.name} | Marca: ${mat.brand} | Série: ${mat.serial_number || 'N/A'}`, 16, currentY + 5.5);
        doc.setFont('helvetica', 'normal');

        const movementsBody = movements.map((move, idx) => {
          let responsibleName = move.actor?.full_name ? move.actor.full_name.split(' (')[0] : 'N/A';
          let role = move.actor?.role ? (move.actor.role === 'LIDER_SETOR' ? 'Líder' : move.actor.role === 'GESTOR_UNIDADE' ? 'Gestor' : 'Agente') : '';
          
          if (role) responsibleName += ` (${role})`;
          
          let fromName = move.from_sector?.name || 'Gate';
          let toName = move.to_sector?.name || 'Gate';

          return [
            `#${idx + 1}`,
            new Date(move.moved_at).toLocaleString(),
            fromName,
            toName,
            responsibleName,
            move.signature || '-'
          ];
        });

        autoTable(doc, {
          startY: currentY + 10,
          head: [['Seq.', 'Data/Hora', 'Origem', 'Destino', 'Responsável pela Ação', 'Assinatura']],
          body: movementsBody,
          theme: 'striped',
          headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontSize: 8 },
          styles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 35 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 45 },
            5: { cellWidth: 30 }
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      });
    });

    doc.save(`AUDITORIA_RASTREAMENTO_${profileName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
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

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center justify-between">
         <button 
           onClick={onBack}
           className="group flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-navy hover:bg-navy hover:text-white transition-all uppercase tracking-widest shadow-sm"
         >
           <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
           Voltar para Pesquisa
         </button>
         
         <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-slate-100 shadow-sm">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-bold text-navy uppercase tracking-widest">Logs em Tempo Real</span>
            </div>
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-3 bg-navy text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#002880] active:scale-95 transition-all shadow-xl shadow-navy/20"
            >
              <FileDown className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Exportar PDF Industrial</span>
            </button>
         </div>
      </div>

      {/* Header do Perfil Auditoria */}
      <div className="bg-[#001540] p-10 rounded-3xl text-white shadow-xl relative overflow-hidden border border-white/5">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
         <div className="absolute right-[-5%] top-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
         
         <div className="flex flex-col md:flex-row md:items-center gap-10 relative z-10">
            <div className="w-28 h-28 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-xl relative group">
               <div className="absolute inset-0 bg-primary/10 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-500"></div>
               <Building2 className="w-14 h-14 text-white relative z-10" />
            </div>
            
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-primary text-navy text-[8px] font-bold uppercase tracking-widest rounded-lg">Entidade Verificada</span>
                  <div className="w-px h-4 bg-white/10"></div>
                  <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Protocolo de Auditoria v4.2</span>
               </div>
               <h3 className="text-5xl font-bold uppercase tracking-tighter mb-6 leading-none">
                 {profileName}
               </h3>
               
               <div className="flex flex-wrap gap-4 mt-2">
                  <StatBadge icon={Calendar} label="Contratos" value={auditData.length.toString()} />
                  <StatBadge icon={Clock} label="Média" value={calculateAverageStay(auditData)} />
                  <StatBadge icon={Package} label="Ativos" value={auditData.reduce((acc, curr) => acc + (curr.materials?.length || 0), 0).toString()} />
               </div>

               {auditData[0]?.profile && (
                 <div className="flex flex-wrap gap-x-8 gap-y-2 mt-6 pt-6 border-t border-white/10">
                   {auditData[0].profile.cnpj && (
                     <div className="flex flex-col">
                       <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">CNPJ Operacional</span>
                       <span className="text-xs font-bold text-white/80">{auditData[0].profile.cnpj}</span>
                     </div>
                   )}
                   {auditData[0].profile.representative_name && (
                     <div className="flex flex-col">
                       <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">Representante Legal</span>
                       <span className="text-xs font-bold text-white/80">{auditData[0].profile.representative_name}</span>
                     </div>
                   )}
                   {auditData[0].profile.phone && (
                     <div className="flex flex-col">
                       <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">Contato Emergência</span>
                       <span className="text-xs font-bold text-white/80">{auditData[0].profile.phone}</span>
                     </div>
                   )}
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Toolbar de Auditoria */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center gap-6">
         <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            {[
              { id: 'all', label: 'TUDO', icon: History },
              { id: 'active', label: 'NA PLANTA', icon: Activity },
              { id: 'finished', label: 'FINALIZADOS', icon: ShieldCheck }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
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
                 className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-navy uppercase tracking-widest placeholder:text-slate-300 focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all"
               />
            </div>
            
            <div className="relative group">
               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
               <input 
                 type="date"
                 value={dateFilter}
                 onChange={e => setDateFilter(e.target.value)}
                 className="pl-11 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-navy uppercase tracking-widest focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all cursor-pointer"
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
            <div className="py-24 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
               <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum registro encontrado para esta análise</p>
            </div>
         ) : paginatedData.map((request, idx) => (
            <div key={request.id} className="relative group/card animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
               {/* Ponto da Timeline */}
               <div className="absolute -left-[3.25rem] top-0 w-10 h-10 rounded-xl bg-white border-2 border-slate-100 shadow-xl z-10 flex items-center justify-center font-bold text-xs text-navy group-hover/card:border-primary group-hover/card:scale-110 transition-all duration-300">
                  {filteredData.length - ((currentPage - 1) * itemsPerPage + idx)}
               </div>

               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-navy/5 transition-all duration-500">
                  <div className="p-8">
                     <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 bg-navy text-white rounded-[1.25rem] flex items-center justify-center shadow-lg">
                              <UserCheck className="w-7 h-7" />
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-in Realizado</p>
                              <div className="flex items-center gap-3">
                                 <h4 className="text-xl font-bold text-navy uppercase tracking-tight">
                                   {new Date(request.gate_checked_at || request.created_at).toLocaleDateString('pt-BR')}
                                 </h4>
                                 <span className="text-primary font-bold text-lg">/</span>
                                 <h4 className="text-xl font-bold text-navy uppercase tracking-tight">
                                   {new Date(request.gate_checked_at || request.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                 </h4>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="text-right hidden sm:block">
                              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1">Status do Ciclo</p>
                              <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                                request.exit_at 
                                  ? 'bg-slate-50 text-slate-400 border-slate-100' 
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}>
                                {request.exit_at ? 'CICLO FINALIZADO' : 'EM OPERAÇÃO'}
                              </span>
                           </div>
                           
                           {request.exit_at && (
                             <div className="bg-navy p-4 rounded-xl text-white shadow-lg">
                                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Permanência</p>
                                <p className="text-sm font-bold uppercase leading-none">{calculateDuration(request.gate_checked_at || request.created_at, request.exit_at)}</p>
                             </div>
                           )}
                        </div>
                     </div>

                     {/* Grid de Materiais Auditados */}
                     <div className="space-y-4">
                        {(request.materials || []).map(material => (
                          <div key={material.id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 group/material hover:bg-white hover:border-primary/20 transition-all duration-300">
                             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-white text-navy rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover/material:bg-navy group-hover/material:text-white transition-all">
                                      <Package className="w-6 h-6" />
                                   </div>
                                   <div>
                                      <h5 className="font-bold text-navy text-sm uppercase tracking-tight mb-1">{material.name}</h5>
                                      <div className="flex flex-wrap items-center gap-2">
                                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{material.brand}</span>
                                         <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{material.model}</span>
                                         {material.serial_number && (
                                            <>
                                               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                               <span className="text-[8px] font-bold text-primary bg-navy px-1.5 py-0.5 rounded uppercase tracking-widest">SÉRIE: {material.serial_number}</span>
                                            </>
                                         )}
                                         {material.condition && (
                                            <>
                                               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                               <span className="text-[8px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-widest">{material.condition}</span>
                                            </>
                                         )}
                                      </div>
                                   </div>
                                </div>

                                <div className="flex items-center gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-200/50">
                                   <div className="flex-1 md:flex-none">
                                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Último Rastro Local</p>
                                      <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,214,0,0.4)]"></div>
                                         <span className="text-[10px] font-bold text-navy uppercase">
                                           {(material.movements || []).length > 0 
                                             ? material.movements[material.movements.length - 1].to_sector?.name 
                                             : 'GATE PRINCIPAL'}
                                         </span>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Movimentações</p>
                                      <span className="text-sm font-bold text-navy">{(material.movements || []).length}</span>
                                   </div>
                                </div>
                             </div>

                             {/* Trilha de Movimentos */}
                             {(material.movements || []).length > 0 && (
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                                  {material.movements.map((move, mIdx) => (
                                    <div key={move.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group/move hover:border-primary/30 transition-all">
                                       <div className="absolute top-0 right-0 px-2 py-1 bg-slate-50 text-[7px] font-bold text-slate-300 rounded-bl-lg">#{mIdx + 1}</div>
                                       <div className="flex flex-col gap-3">
                                          <div className="flex items-center gap-2">
                                             <div className="w-1.5 h-10 bg-primary/20 rounded-full flex flex-col items-center py-1">
                                                <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                                             </div>
                                             <div className="flex-1">
                                                <p className="text-[9px] font-bold text-navy uppercase leading-tight mb-1">{move.to_sector?.name || 'Setor'}</p>
                                                <p className="text-[7px] font-bold text-slate-400 uppercase">Origem: {move.from_sector?.name || 'Gate'}</p>
                                             </div>
                                          </div>
                                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                             <div className="flex items-center gap-1.5">
                                                <Clock className="w-2.5 h-2.5 text-slate-300" />
                                                <span className="text-[8px] font-bold text-navy">{new Date(move.moved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                             </div>
                                             <div className="flex items-center gap-1.5">
                                                {move.signature && (
                                                   <span className="text-[7px] font-black bg-primary/20 text-navy px-1.5 py-0.5 rounded italic">VISTO: {move.signature}</span>
                                                )}
                                                <div className="flex flex-col items-end">
                                                   <span className="text-[7px] font-bold text-navy">
                                                      {(move.to_sector?.name.toLowerCase() !== 'portaria' && move.to_sector?.name.toLowerCase() !== 'entrada')
                                                         ? (request.approved_leader_profile?.full_name.split(' (')[0] || `Líder ${move.to_sector?.name || 'Setor'}`)
                                                         : (move.actor?.full_name?.split(' (')[0] || 'Agente')}
                                                   </span>
                                                   <span className="text-[5px] font-bold text-slate-300 uppercase tracking-tighter">
                                                      {(move.to_sector?.name.toLowerCase() !== 'portaria' && move.to_sector?.name.toLowerCase() !== 'entrada')
                                                         ? 'Líder'
                                                         : (move.actor?.role?.split('_')[0] || 'Agente')}
                                                   </span>
                                                 </div>
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
                           <span className="text-[9px] font-bold text-navy uppercase tracking-widest">Auditado e Criptografado</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200"></div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">ID: {request.id.slice(0, 8)}</span>
                     </div>
                     <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400">
                        {request.approved_leader_profile && (
                           <p className="text-[8px] font-bold uppercase italic">Líder: {request.approved_leader_profile.full_name.split(' (')[0]}</p>
                        )}
                        {request.approved_gestor_profile && (
                           <p className="text-[8px] font-bold uppercase italic">Gestor: {request.approved_gestor_profile.full_name.split(' (')[0]}</p>
                        )}
                        <p className="text-[8px] font-bold uppercase italic">Portaria: {request.gate_checked_by_profile?.full_name || 'Agente'}</p>
                        {request.signature && (
                           <p className="text-[8px] font-black text-navy uppercase italic">Visto: {request.signature}</p>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 mt-4 pl-0 sm:pl-12 gap-4">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
           </span>
           <div className="flex items-center gap-3">
              <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-navy hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                 <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 hidden sm:block">
                 <span className="text-[10px] font-bold text-navy uppercase tracking-widest">
                    Página {currentPage} de {totalPages}
                 </span>
              </div>
              <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-navy hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                 Próxima <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all cursor-default group/stat">
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
