import React, { useState, useMemo } from 'react';
import { 
  History, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Camera, 
  ChevronRight, 
  Package, 
  Truck, 
  Clock, 
  Calendar, 
  Hash, 
  User, 
  ShieldCheck, 
  Layers, 
  X,
  FileText
} from 'lucide-react';

interface PortariaHistoryViewProps {
  history: any[];
  loading: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onViewPhotos: (photos: string[]) => void;
}

export const PortariaHistoryView: React.FC<PortariaHistoryViewProps> = ({
  history,
  loading,
  onRefresh,
  onBack,
  onViewPhotos
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');

  // Identifica com precisão se o movimento foi Entrada ou Saída na Portaria
  const getMovementInfo = (audit: any) => {
    const fromName = audit.from_sector?.name || '';
    const toName = audit.to_sector?.name || '';
    const isExit = toName.toLowerCase().includes('portaria') || (!toName && audit.to_sector_id);

    if (isExit) {
      return {
        type: 'EXIT' as const,
        typeLabel: 'Saída da Planta',
        origin: fromName || 'SETOR DE ORIGEM',
        destination: toName || 'PORTARIA / EXPEDIÇÃO',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
        badgeIcon: <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      };
    } else {
      return {
        type: 'ENTRY' as const,
        typeLabel: 'Entrada na Planta',
        origin: fromName || 'EXTERNO / FORNECEDOR',
        destination: toName || 'SETOR DE DESTINO',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        badgeIcon: <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      };
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: '---', time: '--:--' };
    try {
      const safeDateStr = (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/)) 
        ? `${dateStr}Z` 
        : dateStr;
      const d = new Date(safeDateStr);
      return {
        date: d.toLocaleDateString('pt-BR'),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    } catch {
      return { date: 'Data Inválida', time: '--:--' };
    }
  };

  // Contadores gerais
  const entriesCount = useMemo(() => {
    return history.filter(item => getMovementInfo(item).type === 'ENTRY').length;
  }, [history]);

  const exitsCount = useMemo(() => {
    return history.filter(item => getMovementInfo(item).type === 'EXIT').length;
  }, [history]);

  // Filtro inteligente
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const info = getMovementInfo(item);
      if (filterType === 'ENTRY' && info.type !== 'ENTRY') return false;
      if (filterType === 'EXIT' && info.type !== 'EXIT') return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const matName = (item.material?.name || '').toLowerCase();
      const matBrand = (item.material?.brand || '').toLowerCase();
      const matModel = (item.material?.model || '').toLowerCase();
      const matSerial = (item.material?.serial_number || '').toLowerCase();
      const compName = (item.material?.request?.profile?.full_name || '').toLowerCase();
      const actorName = (item.actor?.full_name || '').toLowerCase();
      const actorMat = (item.signature || item.actor?.registration_number || '').toLowerCase();
      const plate = (item.material?.request?.plate || '').toLowerCase();
      const driver = (item.material?.request?.driver_name || '').toLowerCase();

      return (
        matName.includes(term) ||
        matBrand.includes(term) ||
        matModel.includes(term) ||
        matSerial.includes(term) ||
        compName.includes(term) ||
        actorName.includes(term) ||
        actorMat.includes(term) ||
        plate.includes(term) ||
        driver.includes(term) ||
        info.origin.toLowerCase().includes(term) ||
        info.destination.toLowerCase().includes(term)
      );
    });
  }, [history, filterType, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Barra de Ações do Topo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-navy text-white hover:bg-[#002880] rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-navy/20 active:scale-95 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-white" />
          Voltar para Controle de Portaria
        </button>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-4 bg-white border border-slate-200 text-navy hover:bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Atualizar lista de registros"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Hero Banner da Página */}
      <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3.5 py-1.5 bg-primary/10 text-primary font-black text-[9px] uppercase tracking-widest rounded-full border border-primary/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Segurança Patrimonial & Portaria
              </span>
              <span className="text-slate-200 font-bold">•</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Usina Lins Agroindustrial
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-navy uppercase tracking-tighter italic leading-none">
              Histórico de <span className="text-primary not-italic">Portaria</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-[0.2em] mt-3 max-w-2xl leading-relaxed">
              Rastreabilidade oficial e exclusiva de fluxos de entrada e saída de equipamentos e terceirizadas com registro de matrícula autorizadora.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl shrink-0">
            <div className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center shadow-md">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Auditado</p>
              <p className="text-2xl font-black text-navy leading-none tracking-tight">{history.length} Registros</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas / KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-navy/5 text-navy flex items-center justify-center shrink-0 border border-navy/10">
            <Layers className="w-7 h-7 text-navy" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total de Movimentações</p>
            <p className="text-3xl font-black text-navy tracking-tight">{history.length}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Entradas e saídas registradas</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <ArrowDownLeft className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Entradas na Usina</p>
            <p className="text-3xl font-black text-emerald-600 tracking-tight">{entriesCount}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Cargas e materiais admitidos</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <ArrowUpRight className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Saídas da Usina</p>
            <p className="text-3xl font-black text-blue-600 tracking-tight">{exitsCount}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Materiais liberados para retorno</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Input de Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input
            type="text"
            placeholder="BUSCAR POR EQUIPAMENTO, EMPRESA, MOTORISTA, PLACA, SETOR OU MATRÍCULA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-navy placeholder:text-slate-300 uppercase focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-navy hover:bg-slate-200/50 rounded-lg transition-all"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botões de Filtro */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto overflow-x-auto w-full lg:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${filterType === 'ALL' ? 'bg-navy text-white shadow-md' : 'text-slate-400 hover:text-navy hover:bg-white'}`}
          >
            Todas ({history.length})
          </button>
          <button
            onClick={() => setFilterType('ENTRY')}
            className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${filterType === 'ENTRY' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-emerald-700 hover:bg-white'}`}
          >
            Entradas ({entriesCount})
          </button>
          <button
            onClick={() => setFilterType('EXIT')}
            className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${filterType === 'EXIT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-blue-700 hover:bg-white'}`}
          >
            Saídas ({exitsCount})
          </button>
        </div>
      </div>

      {/* Listagem em Tabela e Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-28 text-center flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-10 h-10 animate-spin text-primary opacity-30" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Histórico da Portaria...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
              <History className="w-10 h-10 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-black text-navy uppercase tracking-wider">Nenhum registro encontrado</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {searchTerm ? 'Tente ajustar os termos da busca.' : 'Não há movimentações de portaria cadastradas para este período.'}
              </p>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Limpar Busca
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((item, idx) => {
              const info = getMovementInfo(item);
              const dt = formatDateTime(item.moved_at);
              const reqProfile = item.material?.request?.profile;
              const themeColor = reqProfile?.theme_color || '#0032A0';
              const companyName = reqProfile?.full_name || 'EMPRESA TERCEIRIZADA';
              const driver = item.material?.request?.driver_name;
              const plate = item.material?.request?.plate;

              return (
                <div 
                  key={item.id || idx} 
                  className="p-6 md:p-8 hover:bg-slate-50/70 transition-all flex flex-col gap-6 group"
                >
                  {/* Linha Superior: Tipo de Movimento e Horário */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider shadow-xs ${info.badgeColor}`}>
                        {info.badgeIcon}
                        {info.typeLabel}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Protocolo #{item.id?.slice(0, 8) || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/60">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{dt.date}</span>
                        <span className="text-slate-300">•</span>
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{dt.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Linha Central: Empresa, Equipamento, Trajeto e Autorização */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* Terceirizada (4 cols) */}
                    <div className="lg:col-span-3 flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 overflow-hidden"
                        style={{ backgroundColor: themeColor }}
                      >
                        {reqProfile?.logo_url ? (
                          <img src={reqProfile.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          companyName[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Empresa / Terceirizada</p>
                        <p className="font-black text-navy text-xs uppercase leading-tight truncate">{companyName}</p>
                        {(plate || driver) && (
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mt-1 flex items-center gap-1.5 truncate">
                            <Truck className="w-3 h-3 text-primary shrink-0" />
                            <span>{plate ? `Placa: ${plate}` : ''} {driver ? `• ${driver}` : ''}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Equipamento (3 cols) */}
                    <div className="lg:col-span-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Equipamento</p>
                      <p className="font-black text-navy text-xs uppercase leading-tight truncate">{item.material?.name || 'MATERIAL NÃO ESPECIFICADO'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {(item.material?.brand || item.material?.model) && (
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            {item.material.brand} {item.material.model}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[8px] uppercase tracking-tight">
                          <Hash className="w-2.5 h-2.5" />
                          {item.material?.serial_number || 'S/N'}
                        </span>
                      </div>
                    </div>

                    {/* Trajeto Origem -> Destino (3 cols) */}
                    <div className="lg:col-span-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Fluxo da Operação</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80 truncate max-w-[120px]" title={info.origin}>
                          {info.origin}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 truncate max-w-[120px]" title={info.destination}>
                          {info.destination}
                        </span>
                      </div>
                    </div>

                    {/* Responsável & Matrícula (3 cols) */}
                    <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                          {item.actor?.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Autorização</p>
                          <p className="text-xs font-black text-navy uppercase leading-tight truncate max-w-[140px]">{item.actor?.full_name || 'Agente'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[7px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">
                              {item.actor?.role === 'PORTARIA' ? 'Controle de Acesso' : item.actor?.role === 'LIDER_SETOR' ? 'Líder' : item.actor?.role || 'Colaborador'}
                            </span>
                            <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20 tracking-wider">
                              MAT: {item.signature || item.actor?.registration_number || '---'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botão de Fotos se houver */}
                      {item.photos && item.photos.length > 0 && (
                        <button
                          onClick={() => onViewPhotos(item.photos)}
                          className="px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
                          title="Visualizar fotos registradas"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{item.photos.length} Fotos</span>
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Observação / Evidência Adicional */}
                  {item.observation && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-amber-900 leading-relaxed">
                        <span className="font-black uppercase text-[9px] tracking-wider text-amber-700 mr-1.5">Observação registrada:</span>
                        {item.observation}
                      </p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botão Voltar no Rodapé */}
      <div className="pt-4 pb-12 flex justify-center">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border border-slate-200 text-navy hover:bg-slate-50 hover:border-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-primary" />
          Voltar para Controle de Portaria
        </button>
      </div>

    </div>
  );
};
