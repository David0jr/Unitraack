import { Search, User, ChevronRight } from 'lucide-react';

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
  onSelect: (id: string) => void;
}

export function AuditThirdPartyList({ thirdParties, filterText, setFilterText, onSelect }: AuditThirdPartyListProps) {
  const filteredParties = thirdParties.filter(p => 
    p.full_name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-4">
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
           <input 
             type="text" 
             placeholder="Buscar empresa ou técnico..."
             value={filterText}
             onChange={e => setFilterText(e.target.value)}
             className="pl-11 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold text-navy placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all w-full md:w-80 shadow-sm"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredParties.map(party => (
           <div 
             key={party.id}
             onClick={() => onSelect(party.id)}
             className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-navy/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -z-0 transition-all group-hover:bg-primary/5"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-navy text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                   <User className="w-6 h-6" />
                </div>
                <h3 className="font-black text-navy text-lg uppercase leading-tight mb-2 tracking-tighter">
                  {party.full_name}
                </h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {party.role}
                  </span>
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {party.totalVisits} Visitas
                  </span>
                </div>
                
                <div className="space-y-3 pt-6 border-t border-slate-50 mt-auto">
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Último Acesso</span>
                     <span className="text-[9px] font-black text-navy uppercase">
                       {party.lastVisit ? new Date(party.lastVisit).toLocaleDateString() : 'Nunca'}
                     </span>
                  </div>
                  <div className="flex items-center justify-between group-hover:text-primary transition-all">
                     <span className="text-[9px] font-black uppercase tracking-widest">Ver Relação de Rastreio</span>
                     <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
