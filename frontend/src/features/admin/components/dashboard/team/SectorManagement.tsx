import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Check, 
  X,
  Building2,
  FolderTree,
  CornerDownRight,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { useDashboard } from '../../../../../contexts/DashboardContext';
import { api } from '../../../../../lib/axios';
import { Modal } from './TeamCommon';

interface SectorManagementProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function formatSectorName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .join(' ');
}

export function SectorManagement({ onSuccess, onError }: SectorManagementProps) {
  const { sectors, refreshData } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [inlineSectorParentId, setInlineSectorParentId] = useState<string | null>(null);
  const [inlineSectorName, setInlineSectorName] = useState('');
  const [deletingSector, setDeletingSector] = useState<{ id: string; name: string; isParent: boolean } | null>(null);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const parentSectors = sectors.filter((s: any) => !s.parent_id);
  const subSectorsCount = sectors.filter((s: any) => !!s.parent_id).length;

  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;
    setLoading(true);
    try {
      await api.post('/sectors', { 
        name: newSectorName.trim(),
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
    if (!inlineSectorName.trim() || !inlineSectorParentId) return;
    setLoading(true);
    try {
      await api.post('/sectors', { 
        name: inlineSectorName.trim(),
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

  const confirmDeleteSector = async () => {
    if (!deletingSector) return;
    setLoading(true);
    try {
      await api.delete(`/sectors/${deletingSector.id}`);
      refreshData();
      onSuccess('Setor removido com sucesso.');
      setDeletingSector(null);
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro ao remover setor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-navy text-base">Estrutura de Setores da Usina</h3>
          <p className="text-xs text-slate-500 font-normal">
            Cadastre os setores principais e seus subsetores operacionais para organizar os líderes e acessos.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 self-start sm:self-auto">
          <span className="px-3 py-1.5 bg-slate-100 rounded-xl flex items-center gap-1.5 shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-navy" />
            <span><strong>{parentSectors.length}</strong> Principais</span>
          </span>
          <span className="px-3 py-1.5 bg-slate-100 rounded-xl flex items-center gap-1.5 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span><strong>{subSectorsCount}</strong> Subsetores</span>
          </span>
        </div>
      </div>

      {/* Formulário Novo Setor Principal */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs max-w-2xl">
        <h4 className="text-xs font-semibold text-navy mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span>Cadastrar Novo Setor Principal</span>
        </h4>

        <form onSubmit={handleCreateSector} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input 
                type="text"
                value={newSectorName} 
                onChange={e => setNewSectorName(e.target.value)} 
                placeholder="Ex: Indústria, Agrícola, Balança..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-xs"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !newSectorName.trim()}
              className="px-5 py-2.5 bg-navy hover:bg-[#002880] text-white rounded-xl font-medium text-xs shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Setor</span>
                </>
              )}
            </button>
          </div>

          {/* Sugestões Rápidas */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Sugestões rápidas:</span>
            {['Portaria', 'Balança', 'Laboratório', 'Oficina', 'Lavador', 'Estacionamento'].map(sug => (
              <button 
                key={sug} 
                type="button"
                onClick={() => setNewSectorName(sug)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100/80 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 hover:text-navy transition-colors cursor-pointer shadow-xs"
              >
                +{sug}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Lista de Setores e Subsetores */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-slate-400" />
          <span>Setores e Subsetores em Operação</span>
        </h4>

        {parentSectors.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">Nenhum setor principal cadastrado.</p>
            <p className="text-[11px] text-slate-400 mt-1">Utilize o campo acima para cadastrar o primeiro setor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {parentSectors.map((parent: any) => {
              const children = sectors.filter((s: any) => s.parent_id === parent.id);
              const isAddingSub = inlineSectorParentId === parent.id;

              return (
                <div key={parent.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  {/* Cabeçalho do Setor Pai */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-navy text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-xs">
                        {parent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-navy text-xs sm:text-sm">
                          {formatSectorName(parent.name)}
                        </span>
                        <span className="ml-2.5 px-2 py-0.5 bg-slate-200/60 text-slate-600 text-[10px] font-medium rounded-md">
                          {children.length} subsetor{children.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setDeletingSector({ id: parent.id, name: parent.name, isParent: true })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Setor Principal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Subsetores */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-white">
                    {children.map((sub: any) => (
                      <div 
                        key={sub.id} 
                        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CornerDownRight className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-medium text-slate-800 text-xs truncate">
                            {formatSectorName(sub.name)}
                          </span>
                        </div>
                        <button 
                          onClick={() => setDeletingSector({ id: sub.id, name: sub.name, isParent: false })}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Excluir Subsetor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Adicionar Subsetor Inline Form */}
                    {isAddingSub ? (
                      <form 
                        onSubmit={handleCreateInlineSector}
                        className="flex items-center gap-1.5 p-1.5 border border-primary/40 rounded-xl bg-primary/5 shadow-xs"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={inlineSectorName}
                          onChange={(e) => setInlineSectorName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setInlineSectorParentId(null);
                              setInlineSectorName('');
                            }
                          }}
                          placeholder="Nome do subsetor..."
                          className="w-full bg-transparent border-none text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none px-2"
                        />
                        <button 
                          type="submit" 
                          disabled={loading || !inlineSectorName.trim()}
                          className="p-1.5 bg-primary hover:bg-[#00928a] text-white rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          title="Confirmar"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setInlineSectorParentId(null); setInlineSectorName(''); }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <button 
                        onClick={() => { setInlineSectorParentId(parent.id); setInlineSectorName(''); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 rounded-xl text-xs font-medium text-slate-500 hover:text-primary transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Subsetor</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Confirmar Exclusão de Setor */}
      <Modal
        isOpen={!!deletingSector}
        onClose={() => setDeletingSector(null)}
        title="Confirmar Exclusão de Setor"
      >
        <div className="space-y-5">
          <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-rose-800">Atenção ao excluir setor</p>
              <p className="text-xs text-rose-700 leading-relaxed font-normal">
                Você tem certeza que deseja excluir o {deletingSector?.isParent ? 'setor principal' : 'subsetor'} <strong className="underline">{deletingSector?.name}</strong>?
                {deletingSector?.isParent && ' Todos os subsetores e vínculos operacionais a este setor poderão ser impactados.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button 
              onClick={() => setDeletingSector(null)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={confirmDeleteSector}
              disabled={loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
