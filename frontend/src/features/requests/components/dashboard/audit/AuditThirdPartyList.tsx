import { Search, User, ChevronRight, Activity, Calendar } from 'lucide-react';

interface ThirdParty {
  id: string;
  full_name: string;
  role: string;
  totalVisits: number;
  lastVisit: string | null;
}

interface AuditThirdPartyListProps {
  thirdParties: ThirdParty[];
  filterText: string;
  setFilterText: (text: string) => void;
  onSelect: (id: string | null) => void;
}

export function AuditThirdPartyList({ thirdParties, filterText, onSelect }: AuditThirdPartyListProps) {
  const filteredParties = thirdParties.filter(p => 
    p.full_name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Lista Industrial de Alta Densidade */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header da Tabela Desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 bg-slate-50/50 border-b border-slate-100">
          <div className="col-span-5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Identificação da Entidade</span>
          </div>
          <div className="col-span-2 text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tipo / Perfil</span>
          </div>
          <div className="col-span-2 text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Frequência</span>
          </div>
          <div className="col-span-2 text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Último Rastro</span>
          </div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredParties.length === 0 ? (
            <div className="py-20 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                  <Search className="w-6 h-6 text-slate-200" />
               </div>
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum rastro encontrado na base</p>
            </div>
          ) : filteredParties.map(party => (
            <div 
              key={party.id}
              onClick={() => onSelect(party.id)}
              className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-slate-50/80 transition-all cursor-pointer"
            >
              {/* Identificação */}
              <div className="col-span-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-navy text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-primary transition-all duration-300">
                  <User className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-navy text-sm uppercase leading-tight tracking-tight mb-1 group-hover:text-primary transition-colors">
                     {party.full_name}
                   </h3>
                   <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ID Verificado</span>
                   </div>
                </div>
              </div>

              {/* Perfil */}
              <div className="col-span-2 flex justify-center">
                <span className="px-3 py-1 bg-white border border-slate-100 text-slate-500 text-[8px] font-bold uppercase tracking-widest rounded-lg shadow-sm">
                  {party.role}
                </span>
              </div>

              {/* Frequência */}
              <div className="col-span-2 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                   <Activity className="w-3 h-3 text-primary" />
                   <span className="text-xs font-bold text-navy">{party.totalVisits}</span>
                </div>
                <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">Visitas Totais</span>
              </div>

              {/* Último Rastro */}
              <div className="col-span-2 flex flex-col items-end gap-1">
                 <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] font-bold text-navy">
                      {party.lastVisit ? new Date(party.lastVisit).toLocaleDateString('pt-BR') : 'NEVER'}
                    </span>
                 </div>
                 <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">Rastreado em</span>
              </div>

              {/* Ação */}
              <div className="col-span-1 flex justify-end">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
