import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  ArrowRightLeft, 
  Loader2, 
  Search,
  ArrowRight,
  Building,
  LogOut,
  ChevronDown,
  XCircle
} from 'lucide-react';
import { useDashboard } from '../../../contexts/DashboardContext';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Componente de Monitoramento Operacional (Digital Twin).
 * Exibe a distribuição de ativos por setores em formato de gavetas (accordions).
 */
export default function MonitoringDashboard({ parentSectorId }: { parentSectorId?: string | null }) {
  const { token } = useAuth();
  const { sectors, materials, movements, loading, refreshData } = useDashboard();
  const [filterText, setFilterText] = useState('');
  const [transferModal, setTransferModal] = useState<{materialId: string, materialName: string} | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [targetSectorId, setTargetSectorId] = useState('');
  
  // Paginação para movimentações
  const [movementPage, setMovementPage] = useState(1);
  const movementsPerPage = 3;
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  // Efeito para expandir automaticamente o setor selecionado via sidebar
  useEffect(() => {
    if (parentSectorId) {
      setExpandedParents([parentSectorId]);
    }
  }, [parentSectorId]);

  const toggleParent = (id: string) => {
    setExpandedParents(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };


  // Agrupamento hierárquico
  const parentSectors = sectors.filter(s => !s.parent_id)
    .filter(s => parentSectorId ? s.id === parentSectorId : true);
  const getSubsectors = (parentId: string) => sectors.filter(s => s.parent_id === parentId);
  
  const getSectorMaterials = (sectorId: string) => {
    const sector = sectors.find(s => s.id === sectorId);
    const sectorNameMatches = filterText ? (sector?.name?.toLowerCase() || '').includes(filterText.toLowerCase()) : false;

    return materials.filter(m => m.current_sector_id === sectorId)
      .filter(m => {
        if (!filterText) return true;
        if (sectorNameMatches) return true;
        
        return (
          (m.name?.toLowerCase() || '').includes(filterText.toLowerCase()) || 
          (m.request?.profile?.full_name?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
          (m.code?.toLowerCase() || '').includes(filterText.toLowerCase())
        );
      });
  };

  const filteredParentSectors = parentSectors.filter(parent => {
    if (!filterText) return true;
    
    const subsectors = getSubsectors(parent.id);
    const hasMatchingMaterial = getSectorMaterials(parent.id).length > 0;
    const hasMatchingSubsectorMaterial = subsectors.some(sub => getSectorMaterials(sub.id).length > 0);
    
    // Também mostrar se o nome do setor pai ou de algum sub-setor combina com a busca
    const nameMatches = (parent.name?.toLowerCase() || '').includes(filterText.toLowerCase());
    const subsectorNameMatches = subsectors.some(sub => (sub.name?.toLowerCase() || '').includes(filterText.toLowerCase()));

    return nameMatches || subsectorNameMatches || hasMatchingMaterial || hasMatchingSubsectorMaterial;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
        <p className="mt-4 text-slate-300 font-bold text-[10px] uppercase tracking-widest text-center">
          Mapeando unidades e ativos...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {/* Coluna de Estrutura & Equipamentos */}
        <div className="space-y-4">
          {/* Header de Ações Minimalista */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Buscar por equipamento, empresa ou patrimônio..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all w-full"
              />
            </div>
          </div>

          {/* Lista de Unidades e Ativos */}
          <div className="space-y-4">
            {parentSectors.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 border-dashed p-20 text-center">
                <Building className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">Nenhuma unidade operacional encontrada</p>
              </div>
            )}

            {filteredParentSectors.map(parent => {
              const subsectors = getSubsectors(parent.id).filter(sub => {
                if (!filterText) return true;
                // Mostrar sub-setor se o nome dele combina ou se tem materiais que combinam
                return (sub.name?.toLowerCase() || '').includes(filterText.toLowerCase()) || getSectorMaterials(sub.id).length > 0;
              });
              const parentMaterials = getSectorMaterials(parent.id);
              
              // Contagem total filtrada
              const filteredTotalCount = parentMaterials.length + subsectors.reduce((acc, sub) => acc + getSectorMaterials(sub.id).length, 0);
              
              const isExpanded = expandedParents.includes(parent.id) || !!parentSectorId || !!filterText;

              return (
                <div key={parent.id} className={`bg-white rounded-xl border transition-all duration-300 shadow-sm overflow-hidden ${
                  isExpanded ? 'border-primary/30 shadow-md' : 'border-slate-200'
                }`}>
                  {/* Cabeçalho de Unidade (Oculto se filtrado via Sidebar para ser mais direto) */}
                  {!parentSectorId && (
                    <button 
                      onClick={() => toggleParent(parent.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group text-left border-b border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white' : 'bg-navy text-white'}`}>
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-navy text-[11px] uppercase tracking-tight group-hover:text-primary transition-colors">{parent.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredTotalCount} Equipamentos</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-all ${isExpanded ? 'rotate-180 text-primary' : 'text-slate-300'}`} />
                      </div>
                    </button>
                  )}

                  {/* Grid de Ativos em Formato de Lista Profissional */}
                  <div className={`${parentSectorId ? '' : `transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}`}>
                    {/* Materiais Diretos */}
                    {parentMaterials.length > 0 && (
                      <div className="p-4 border-b border-slate-50 bg-slate-50/20">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Itens sem subsetor definido</p>
                        <AssetList 
                          items={parentMaterials} 
                          onView={setSelectedMaterial}
                          onViewCompany={setSelectedCompany}
                        />
                      </div>
                    )}

                    {/* Subsetores */}
                    <div className="divide-y divide-slate-100">
                      {subsectors.map(sub => {
                        const subMaterials = getSectorMaterials(sub.id);

                        return (
                          <div key={sub.id} className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm"></div>
                                <span className="font-bold text-navy text-[10px] uppercase tracking-widest">{sub.name}</span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                {subMaterials.length} Itens
                              </span>
                            </div>
                            
                            {subMaterials.length === 0 ? (
                              <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest py-4 border border-dashed border-slate-100 rounded-lg text-center">Nenhum ativo operacional nesta unidade</p>
                            ) : (
                              <AssetList 
                                items={subMaterials} 
                                onView={setSelectedMaterial}
                                onViewCompany={setSelectedCompany}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <div 
          onClick={() => setSelectedMaterial(null)} 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-2xl rounded-[16px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[85vh] border border-slate-200 cursor-default"
          >
            <div className="md:w-[40%] relative bg-slate-900 flex-shrink-0 min-h-[220px]">
              {selectedMaterial.image_url || selectedMaterial.imageUrl ? (
                <img 
                  src={selectedMaterial.image_url || selectedMaterial.imageUrl} 
                  alt={selectedMaterial.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                  <Package className="w-8 h-8 opacity-10" />
                  <p className="text-[8px] font-bold uppercase tracking-widest mt-2">Sem imagem</p>
                </div>
              )}
            </div>
            <div className="md:w-[60%] flex flex-col overflow-hidden bg-white">
              <div className="bg-navy px-5 py-3 flex justify-between items-center flex-shrink-0">
                 <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/20 rounded-md">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[7px] text-primary font-bold uppercase tracking-widest leading-none">Ativo Industrial</p>
                      <h3 className="text-white font-bold uppercase text-[11px] mt-0.5 tracking-tight truncate max-w-[160px]">{selectedMaterial.name}</h3>
                    </div>
                 </div>
                 <button onClick={() => setSelectedMaterial(null)} className="w-6 h-6 bg-white/10 hover:bg-white/20 text-white rounded-md flex items-center justify-center transition-all">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Especificações Técnicas</span>
                    <span className="bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded-md uppercase border border-primary/20">
                      Condição: {selectedMaterial.condition}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Fabricante</p>
                      <p className="font-bold text-navy text-[10px] truncate">{selectedMaterial.brand || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Modelo</p>
                      <p className="font-bold text-navy text-[10px] truncate">{selectedMaterial.model || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Nº de Série</p>
                      <p className="font-bold text-navy text-[10px] font-mono tracking-tighter truncate">{selectedMaterial.serial_number || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Patrimônio</p>
                      <p className="font-bold text-navy text-[10px] font-mono tracking-tighter truncate">{selectedMaterial.code || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2">
                <button onClick={() => setSelectedMaterial(null)} className="w-full bg-navy text-white font-bold text-[9px] uppercase tracking-widest py-3 rounded-lg hover:bg-primary transition-all shadow-md active:scale-[0.98]">
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div 
          onClick={() => setSelectedCompany(null)} 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border border-slate-200 cursor-default"
          >
             <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                   <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl"
                    style={{ backgroundColor: selectedCompany.theme_color || '#0032A0' }}
                   >
                      {selectedCompany.logo_url ? (
                        <img src={selectedCompany.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedCompany.full_name ? selectedCompany.full_name[0] : '?'
                      )}
                   </div>
                   <button 
                    onClick={() => setSelectedCompany(null)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all"
                   >
                     <XCircle className="w-6 h-6" />
                   </button>
                </div>

                <div className="mb-8">
                   <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Perfil da Empresa</span>
                   <h3 className="text-2xl font-bold text-navy uppercase leading-tight mt-1">{selectedCompany.full_name}</h3>
                </div>

                <div className="space-y-6">
                   <DetailItem label="Representante" value={selectedCompany.representative_name || 'NÃO INFORMADO'} />
                   <DetailItem label="CNPJ" value={selectedCompany.cnpj || 'NÃO INFORMADO'} />
                   <DetailItem label="Telefone" value={selectedCompany.phone || 'NÃO INFORMADO'} />
                </div>

                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="w-full bg-navy text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl mt-10 hover:bg-[#002880] transition-all shadow-xl shadow-navy/20"
                >
                  Fechar Detalhes
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col">
       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
       <p className="font-bold text-navy text-sm uppercase">{value}</p>
    </div>
  );
}

function AssetList({ 
  items, 
  onView, 
  onViewCompany 
}: { 
  items: any[], 
  onView: (item: any) => void,
  onViewCompany: (company: any) => void
}) {
  return (
    <div className="w-full">
      {/* Header da Lista (Desktop) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-slate-100 mb-2">
        <div className="col-span-6 text-[8px] font-bold text-slate-300 uppercase tracking-widest">Equipamento / Empresa</div>
        <div className="col-span-4 text-[8px] font-bold text-slate-300 uppercase tracking-widest">Patrimônio</div>
        <div className="col-span-2 text-[8px] font-bold text-slate-300 uppercase tracking-widest">Condição</div>
      </div>

      <div className="space-y-1">
        {items.map(item => (
          <AssetListItem 
            key={item.id} 
            item={item} 
            onView={() => onView(item)}
            onViewCompany={() => onViewCompany(item.request.profile)}
          />
        ))}
      </div>
    </div>
  );
}

function AssetListItem({ 
  item, 
  onView, 
  onViewCompany 
}: { 
  item: any, 
  onView: () => void,
  onViewCompany: () => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-100 group">
      {/* Equipamento / Empresa */}
      <div className="col-span-12 md:col-span-6 flex items-center gap-3">
        <button 
          onClick={onViewCompany}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shadow-sm overflow-hidden flex-shrink-0"
          style={{ backgroundColor: item.request.profile.theme_color || '#0032A0' }}
        >
          {item.request.profile.logo_url ? (
            <img src={item.request.profile.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            item.request.profile.full_name ? item.request.profile.full_name[0] : '?'
          )}
        </button>
        <div className="flex flex-col overflow-hidden">
          <button 
            onClick={onView}
            className="text-[10px] font-bold text-navy uppercase leading-tight text-left hover:text-primary transition-colors truncate"
          >
            {item.name}
          </button>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate">
            {item.request.profile.full_name}
          </p>
        </div>
      </div>

      {/* Patrimônio / Código */}
      <div className="hidden md:block md:col-span-4">
        <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">
          {item.code || 'S/N'}
        </span>
      </div>

      {/* Condição */}
      <div className="hidden md:block md:col-span-2">
        <span className={`text-[8px] font-bold uppercase tracking-widest ${
          item.condition === 'NOVO' ? 'text-emerald-600' : 'text-amber-600'
        }`}>
          {item.condition}
        </span>
      </div>
    </div>
  );
}
