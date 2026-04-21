import { useState } from 'react';
import axios from 'axios';
import { 
  Network, 
  Package, 
  ArrowRightLeft, 
  Loader2, 
  Search,
  ArrowRight,
  Building,
  LogOut
} from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente de Monitoramento Operacional (Digital Twin).
 * Exibe a distribuição de ativos por setores e o histórico de movimentação.
 */
export default function MonitoringDashboard() {
  const { token } = useAuth();
  const { sectors, materials, movements, loading, refreshData } = useDashboard();
  const [filterText, setFilterText] = useState('');
  const [transferModal, setTransferModal] = useState<{materialId: string, materialName: string} | null>(null);
  const [targetSectorId, setTargetSectorId] = useState('');

  const handleTransfer = async () => {
    if (!transferModal || !targetSectorId) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/gestor/transfer-material`, { 
        material_id: transferModal.materialId, 
        to_sector_id: targetSectorId 
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setTransferModal(null);
      setTargetSectorId('');
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao transferir equipamento.');
    }
  };

  const handleCheckout = async (requestId: string) => {
    if (!confirm('Deseja registrar a SAÍDA definitiva deste ativo? Esta ação encerrará o rastro de auditoria.')) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/gestor/mark-checkout`, { 
        request_id: requestId 
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao registrar saída.');
    }
  };

  // Agrupamento hierárquico
  const parentSectors = sectors.filter(s => !s.parent_id);
  const getSubsectors = (parentId: string) => sectors.filter(s => s.parent_id === parentId);
  
  const getSectorMaterials = (sectorId: string) => 
    materials.filter(m => m.current_sector_id === sectorId)
      .filter(m => filterText ? 
        m.name.toLowerCase().includes(filterText.toLowerCase()) || 
        m.request.profile.full_name.toLowerCase().includes(filterText.toLowerCase()) 
        : true
      );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
        <p className="mt-4 text-slate-300 font-black text-[10px] uppercase tracking-widest text-center">
          Mapeando unidades e ativos...
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Coluna de Estrutura & Equipamentos */}
      <div className="xl:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div>
            <h3 className="text-sm font-black text-navy uppercase flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" /> Distribuição Operacional
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status em tempo real por unidade</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Buscar equipamento ou empresa..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-navy placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all w-full md:w-64"
            />
          </div>
        </div>

        <div className="space-y-4">
          {parentSectors.map(parent => (
            <div key={parent.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden border-l-4 border-l-navy transition-all">
              <div className="p-6 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-navy text-white rounded-2xl flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-navy text-xs uppercase tracking-tighter leading-none">{parent.name}</span>
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Unidade Principal</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-black text-navy shadow-sm">
                    {getSubsectors(parent.id).length} Subsetores
                  </span>
                  <span className="px-3 py-1 bg-navy text-white rounded-full text-[9px] font-black shadow-lg shadow-navy/20">
                    {materials.filter(m => m.current_sector_id === parent.id || getSubsectors(parent.id).some(s => s.id === m.current_sector_id)).length} Equipamentos
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Materiais diretos no setor pai */}
                {getSectorMaterials(parent.id).length > 0 && (
                  <div className="grid gap-2 mb-6">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-1">Equipamentos em {parent.name}</p>
                    {getSectorMaterials(parent.id).map(mat => (
                      <MaterialItem 
                        key={mat.id} 
                        material={mat} 
                        onTransfer={() => setTransferModal({ materialId: mat.id, materialName: mat.name })} 
                        onCheckout={() => handleCheckout(mat.request.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Subsetores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getSubsectors(parent.id).map(sub => (
                    <div key={sub.id} className="bg-slate-50/30 rounded-3xl p-5 border border-slate-100/50 hover:border-primary/20 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span className="font-black text-navy text-[10px] uppercase tracking-widest">{sub.name}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{getSectorMaterials(sub.id).length} itens</span>
                      </div>
                      
                      <div className="space-y-2">
                        {getSectorMaterials(sub.id).length === 0 ? (
                          <p className="text-[9px] text-slate-300 font-medium italic py-2">Nenhum ativo alocado aqui</p>
                        ) : (
                          getSectorMaterials(sub.id).map(mat => (
                            <MaterialItem 
                              key={mat.id} 
                              material={mat} 
                              compact 
                              onTransfer={() => setTransferModal({ materialId: mat.id, materialName: mat.name })} 
                              onCheckout={() => handleCheckout(mat.request.id)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coluna Lateral: Histórico de Movimentação */}
      <div className="space-y-6">
        <div className="bg-navy rounded-[2.5rem] p-8 text-white shadow-2xl shadow-navy/20 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-6">
             <ArrowRightLeft className="w-5 h-5 text-primary" />
             <h3 className="font-black text-xs uppercase tracking-widest">Movimentações</h3>
          </div>
          
          <div className="space-y-5">
            {movements.length === 0 ? (
              <p className="text-[10px] text-white/40 font-medium py-10 text-center border border-dashed border-white/10 rounded-2xl">Sem movimentações recentes</p>
            ) : movements.map(move => (
              <div key={move.id} className="flex gap-4 relative">
                <div className="flex flex-col items-center gap-1">
                   <div className="w-2 h-2 bg-primary rounded-full"></div>
                   <div className="w-0.5 h-full bg-white/10"></div>
                </div>
                <div className="pb-4">
                   <p className="text-[10px] font-medium text-white/60 mb-1">{new Date(move.moved_at).toLocaleString()}</p>
                   <p className="text-[11px] font-black uppercase text-white leading-tight mb-2">
                      {move.material.name} <span className="text-primary italic">transferido</span>
                   </p>
                   <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                      <span className="text-[8px] font-black text-white/40 uppercase">{move.from_sector?.name || 'Início'}</span>
                      <ArrowRight className="w-3 h-3 text-primary" />
                      <span className="text-[8px] font-black text-primary uppercase">{move.to_sector.name}</span>
                   </div>
                   <p className="text-[9px] text-white/30 mt-2 font-bold uppercase tracking-widest">Por: {move.actor.full_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Transferência */}
      {transferModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 transition-all">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-navy uppercase tracking-tighter">Mover Ativo</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{transferModal.materialName}</p>
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-navy uppercase ml-1 tracking-widest">Setor de Destino</label>
                   <select 
                     value={targetSectorId}
                     onChange={e => setTargetSectorId(e.target.value)}
                     className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-navy font-bold text-xs focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none outline-none"
                   >
                     <option value="">Selecione a unidade...</option>
                     {sectors.map(s => (
                       <option key={s.id} value={s.id}>
                         {s.parent?.name ? `${s.parent.name} > ` : ''}{s.name}
                       </option>
                     ))}
                   </select>
                </div>

                <div className="flex gap-3">
                   <button 
                     onClick={() => setTransferModal(null)}
                     className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     onClick={handleTransfer}
                     disabled={!targetSectorId}
                     className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                   >
                     Confirmar Transferência
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MaterialItem({ 
  material, 
  compact, 
  onTransfer, 
  onCheckout 
}: { 
  material: any, 
  compact?: boolean, 
  onTransfer: () => void,
  onCheckout: () => void 
}) {
  return (
    <div className={`flex items-center justify-between transition-all hover:bg-white p-3 rounded-2xl group ${compact ? 'bg-white/40 border border-slate-100/50' : 'bg-slate-50 border border-slate-100 hover:shadow-sm'}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-xl flex items-center justify-center transition-all group-hover:bg-primary/20 ${compact ? 'w-8 h-8 bg-slate-200 text-slate-400 group-hover:text-primary' : 'w-10 h-10 bg-navy text-white'}`}>
          <Package className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        </div>
        <div>
          <p className={`${compact ? 'text-[10px]' : 'text-xs'} font-black text-navy uppercase leading-none`}>{material.name}</p>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {material.request.profile.full_name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={onTransfer}
          className="p-2.5 text-slate-200 hover:text-primary hover:bg-primary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
          title="Mover Setor"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={onCheckout}
          className="p-2.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
          title="Saída Definitiva (Checkout)"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
