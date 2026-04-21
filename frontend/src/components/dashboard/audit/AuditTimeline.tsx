import { 
  Building2, 
  Calendar, 
  Clock, 
  Package, 
  ShieldCheck, 
  ArrowRight,
  MapPin,
  ChevronLeft,
  History
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
  exit_at: string | null;
  status: string;
  profile: { full_name: string; role: string };
  materials: AuditMaterial[];
}

interface AuditTimelineProps {
  auditData: AuditRequest[];
  profileName: string;
  onBack: () => void;
}

export function AuditTimeline({ auditData, profileName, onBack }: AuditTimelineProps) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center justify-between">
         <button 
           onClick={onBack}
           className="flex items-center gap-2 text-[10px] font-black text-navy hover:text-primary transition-all uppercase tracking-widest"
         >
           <ChevronLeft className="w-4 h-4" /> Voltar para Pesquisa
         </button>
         <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <History className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-navy uppercase tracking-widest">
              Gerando logs individuais de rastro
            </span>
         </div>
      </div>

      {/* Info Perfil */}
      <div className="bg-navy p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
         <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/10 rounded-l-[10rem] skew-x-12"></div>
         <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
            <div className="w-24 h-24 bg-white text-navy rounded-[2rem] flex items-center justify-center shadow-2xl">
               <Building2 className="w-12 h-12" />
            </div>
            <div className="flex-1">
               <h3 className="text-4xl font-black uppercase tracking-tighter mb-2">
                 {profileName}
               </h3>
               <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">
                     <Calendar className="w-3 h-3 text-primary" />
                     {auditData.length} Contratos / Entradas
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">
                     <Clock className="w-3 h-3 text-primary" />
                     Tempo Médio: {calculateAverageStay(auditData)}
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">
                     <Package className="w-3 h-3 text-primary" />
                     Total Ativos: {auditData.reduce((acc, curr) => acc + curr.materials.length, 0)}
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Timeline de Entradas */}
      <div className="space-y-12 pl-4 border-l-2 border-slate-100 ml-6 pt-4">
         {auditData.map((request, idx) => (
           <div key={request.id} className="relative group">
              {/* Ponto na timeline */}
              <div className="absolute -left-[2.25rem] top-0 w-8 h-8 rounded-full bg-white border-4 border-primary shadow-lg z-20 flex items-center justify-center font-black text-[10px] text-navy">
                 {auditData.length - idx}
              </div>
              
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group-hover:shadow-xl transition-all">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Entrada Realizada em</p>
                          <p className="text-lg font-black text-navy uppercase">{new Date(request.created_at).toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <span className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-navy uppercase tracking-widest">
                          Status: {request.exit_at ? 'Finalizado' : 'Ativo na Usina'}
                       </span>
                       {request.exit_at && (
                          <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            Permanência: {calculateDuration(request.created_at, request.exit_at)}
                          </span>
                       )}
                    </div>
                 </div>

                 {/* Itens e Seus Trajetos */}
                 <div className="space-y-6">
                    {request.materials.map(material => (
                      <div key={material.id} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-navy text-white rounded-2xl flex items-center justify-center">
                                 <Package className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-navy uppercase leading-none">{material.name}</p>
                                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">{material.brand} {material.model}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end">
                                 <span className="text-[8px] font-bold text-slate-400 uppercase">Hops Operacionais</span>
                                 <span className="text-xs font-black text-navy">{material.movements.length} Movimentos</span>
                              </div>
                           </div>
                        </div>

                        {/* Sub-timeline de Movimentos do Material */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                           {material.movements.length === 0 ? (
                             <p className="col-span-full py-4 px-6 border border-dashed border-slate-200 rounded-2xl text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center italic">
                               Aguardando primeira movimentação física
                             </p>
                           ) : material.movements.map((move, mIdx) => (
                             <div key={move.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative group/move">
                                <div className="flex items-center justify-between mb-3 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                   <span>MOV #{mIdx + 1}</span>
                                   <span>{new Date(move.moved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                   <span className="text-[9px] font-bold text-navy uppercase truncate max-w-[80px]">{move.from_sector?.name || 'Início'}</span>
                                   <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                                   <span className="text-[9px] font-black text-primary uppercase truncate">{move.to_sector.name}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                   <span className="text-[8px] font-medium text-slate-400 uppercase italic">Resp: {move.actor.full_name.split(' ')[0]}</span>
                                   <MapPin className="w-2.5 h-2.5 text-slate-200" />
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                 </div>

                 {/* Rodapé da Visita */}
                 {request.exit_at && (
                   <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-end gap-3 grayscale opacity-60">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-[9px] font-black text-navy uppercase tracking-widest">Auditoria de Saída Concluída</span>
                   </div>
                 )}
              </div>
           </div>
         ))}
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
  const completed = data.filter(d => d.exit_at);
  if (completed.length === 0) return 'N/A';
  
  const totalMs = completed.reduce((acc, curr) => {
    return acc + (new Date(curr.exit_at!).getTime() - new Date(curr.created_at).getTime());
  }, 0);
  
  const avgMs = totalMs / completed.length;
  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  return `${hours}h médios`;
}
