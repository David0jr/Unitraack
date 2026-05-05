import { useState } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Check, 
  X
} from 'lucide-react';
import { useDashboard } from '../../../contexts/DashboardContext';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import { InputGroup } from './TeamCommon';
import { useEffect } from 'react';

interface SectorManagementProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function SectorManagement({ onSuccess, onError }: SectorManagementProps) {
  const { sectors, refreshData } = useDashboard();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
   const [inlineSectorParentId, setInlineSectorParentId] = useState<string | null>(null);
  const [inlineSectorName, setInlineSectorName] = useState('');

  // Garantir que os dados estão sincronizados ao abrir a gestão de setores
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName) return;
    setLoading(true);
    try {
      await api.post('/gestor/sectors', { 
        name: newSectorName,
        parent_id: null
      });
      
      setNewSectorName('');
      refreshData();
      onSuccess('Setor principal cadastrado com sucesso!');
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro ao criar setor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInlineSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineSectorName || !inlineSectorParentId) return;
    setLoading(true);
    try {
      await api.post('/gestor/sectors', { 
        name: inlineSectorName,
        parent_id: inlineSectorParentId
      });
      
      setInlineSectorName('');
      setInlineSectorParentId(null);
      refreshData();
      onSuccess('Subsetor cadastrado com sucesso!');
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro ao criar subsetor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSector = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este setor?')) return;
    try {
      await api.delete(`/gestor/sectors/${id}`);
      refreshData();
      onSuccess('Setor removido.');
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro ao remover setor.');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="max-w-xl">
        <div className="space-y-1 mb-8">
          <h4 className="font-black text-navy text-sm uppercase">Estrutura da Usina</h4>
          <p className="text-xs text-slate-400 font-medium">Cadastre os novos setores principais (Setores Pai) da usina aqui.</p>
        </div>

        <form onSubmit={handleCreateSector} className="space-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
          <div className="grid grid-cols-1 gap-4">
            <InputGroup 
              id="new-sector-input"
              label="Nome do Setor Principal" 
              value={newSectorName} 
              onChange={setNewSectorName} 
              placeholder="Ex: INDUSTRIA ou AGRÍCOLA"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest w-full mb-1">Sugestões rápidas:</span>
            {['Portaria', 'Balança', 'Laboratório', 'Oficina', 'Lavador', 'Estacionamento'].map(sug => (
              <button 
                key={sug} 
                type="button"
                onClick={() => setNewSectorName(sug)}
                className="px-3 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-bold text-slate-400 hover:border-primary/30 hover:text-primary transition-all"
              >
                +{sug}
              </button>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading || !newSectorName}
            className="w-full py-4 bg-navy text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#002880] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-navy/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Registro de Estrutura'}
          </button>
        </form>
      </div>

      <div className="space-y-6">
         <div className="flex items-center justify-between ml-1">
           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mapa de Operações</h5>
           <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
             Sectores: {sectors.length} | Filtro Pai: {sectors.filter((s: any) => !s.parent_id).length}
           </div>
         </div>
         
         <div className="space-y-4">
           {sectors.filter((s: any) => !s.parent_id).length === 0 ? (
             <p className="text-slate-300 italic text-[10px] uppercase tracking-widest text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">Nenhum setor principal registrado.</p>
           ) : sectors.filter((s: any) => !s.parent_id).map((parent: any) => (
             <div key={parent.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-5 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-navy text-white rounded-2xl flex items-center justify-center font-black">
                      {parent.name[0]}
                    </div>
                    <span className="font-black text-navy text-sm uppercase tracking-tighter">{parent.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteSector(parent.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-white">
                  {sectors.filter((s: any) => s.parent_id === parent.id).map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between p-3.5 bg-slate-50/30 rounded-2xl border border-slate-100/50 hover:border-primary/20 transition-all group">
                       <div className="flex items-center gap-2.5">
                         <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                         <span className="font-bold text-navy text-[11px] uppercase">{sub.name}</span>
                       </div>
                       <button 
                         onClick={() => handleDeleteSector(sub.id)}
                         className="p-1.5 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  ))}
                  {inlineSectorParentId === parent.id ? (
                    <form 
                      onSubmit={handleCreateInlineSector}
                      className="flex items-center justify-between p-2 lg:col-span-1 border border-primary/30 rounded-2xl bg-white shadow-sm"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={inlineSectorName}
                        onChange={(e) => setInlineSectorName(e.target.value)}
                        placeholder="Nome do subsetor..."
                        className="w-full bg-transparent border-none text-[10px] font-bold text-navy uppercase placeholder-slate-300 focus:outline-none focus:ring-0 px-2"
                      />
                      <div className="flex items-center gap-1">
                        <button 
                          type="submit" 
                          disabled={loading || !inlineSectorName}
                          className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all flex-shrink-0 disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setInlineSectorParentId(null); setInlineSectorName(''); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => { setInlineSectorParentId(parent.id); setInlineSectorName(''); }}
                      className="flex items-center justify-center gap-2 p-3.5 border border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-300 uppercase hover:border-primary/30 hover:text-primary transition-all"
                    >
                       <Plus className="w-4 h-4" /> Novo Subsetor
                    </button>
                  )}
                </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
