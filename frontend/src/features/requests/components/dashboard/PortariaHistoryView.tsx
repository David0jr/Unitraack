import React, { useState, useMemo } from 'react';
import { 
  History, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Camera, 
  ArrowRight, 
  Package, 
  Truck, 
  Clock, 
  Calendar, 
  Hash, 
  User, 
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
  const [selectedDate, setSelectedDate] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');

  // Formata o nome para formato legível (Title Case)
  const toTitleCase = (str?: string) => {
    if (!str) return '';
    return str
      .trim()
      .split(/\s+/)
      .map(word => {
        if (word.length <= 2 && ['de', 'da', 'do', 'das', 'dos', 'em', 'e'].includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  // Helper para obter a data local no formato YYYY-MM-DD
  const getLocalDateStr = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const safeDateStr = (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/)) 
        ? `${dateStr}Z` 
        : dateStr;
      const d = new Date(safeDateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Identifica com precisão se o movimento foi Entrada ou Saída na Portaria
  const getMovementInfo = (audit: any) => {
    const rawFromName = audit.from_sector?.name || '';
    const rawToName = audit.to_sector?.name || '';
    const fromName = toTitleCase(rawFromName);
    const toName = toTitleCase(rawToName);

    // É Saída se:
    // 1. Não tem setor de destino (to_sector_id é null/vazio) E tem setor de origem (saiu de um setor interno da planta para fora)
    // 2. Destino explícito contém 'portaria', 'expedição', 'saída' ou 'externo'
    // 3. Status do material é OUT_PLANTA e não tem destino interno especificado
    const isExit =
      (!audit.to_sector_id && !rawToName && (audit.from_sector_id || rawFromName)) ||
      rawToName.toLowerCase().includes('portaria') ||
      rawToName.toLowerCase().includes('expedi') ||
      rawToName.toLowerCase().includes('saída') ||
      rawToName.toLowerCase().includes('saida') ||
      rawToName.toLowerCase().includes('externo') ||
      (audit.material?.status === 'OUT_PLANTA' && (!audit.to_sector_id || !rawToName));

    if (isExit) {
      return {
        type: 'EXIT' as const,
        typeLabel: 'Saída da Planta',
        origin: fromName || 'Setor Interno',
        destination: toName || 'Saída da Usina',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
        badgeIcon: <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      };
    } else {
      return {
        type: 'ENTRY' as const,
        typeLabel: 'Entrada na Planta',
        origin: fromName || 'Externo / Portaria',
        destination: toName || 'Setor de Destino',
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

  // Itens filtrados previamente por data (se houver data selecionada)
  const dateFilteredHistory = useMemo(() => {
    if (!selectedDate) return history;
    return history.filter(item => getLocalDateStr(item.moved_at) === selectedDate);
  }, [history, selectedDate]);

  // Contadores gerais (respeitando a data selecionada se ativa)
  const entriesCount = useMemo(() => {
    return dateFilteredHistory.filter(item => getMovementInfo(item).type === 'ENTRY').length;
  }, [dateFilteredHistory]);

  const exitsCount = useMemo(() => {
    return dateFilteredHistory.filter(item => getMovementInfo(item).type === 'EXIT').length;
  }, [dateFilteredHistory]);

  // Filtro inteligente (Data + Tipo de Fluxo + Busca Textual)
  const filteredHistory = useMemo(() => {
    return dateFilteredHistory.filter(item => {
      const info = getMovementInfo(item);
      if (filterType === 'ENTRY' && info.type !== 'ENTRY') return false;
      if (filterType === 'EXIT' && info.type !== 'EXIT') return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const dt = formatDateTime(item.moved_at);
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
        dt.date.includes(term) ||
        dt.time.includes(term) ||
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
  }, [dateFilteredHistory, filterType, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Barra de Ações do Topo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-xs transition-all shadow-xs cursor-pointer active:scale-95 group w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar ao Controle de Portaria</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
            title="Atualizar lista de registros"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Header Compacto & Elegante */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Histórico de Movimentações</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Rastreabilidade e registro detalhado de todas as entradas e saídas de materiais e terceirizadas na planta industrial.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/70 px-4 py-3 rounded-xl shrink-0">
          <div className="w-10 h-10 rounded-lg bg-navy text-white flex items-center justify-center shadow-xs">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Total Auditado</p>
            <p className="text-xl font-bold text-navy leading-none">
              {dateFilteredHistory.length} <span className="text-xs font-normal text-slate-500">{selectedDate ? `de ${history.length} registros` : 'registros'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Métricas / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total de Movimentações</p>
            <p className="text-2xl font-bold text-navy tracking-tight">{dateFilteredHistory.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{selectedDate ? 'Na data selecionada' : 'Entradas e saídas no portão'}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Entradas na Usina</p>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight">{entriesCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Materiais e cargas admitidos</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Saídas da Usina</p>
            <p className="text-2xl font-bold text-blue-600 tracking-tight">{exitsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Itens liberados para retorno</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input de Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por equipamento, empresa, motorista, placa, data ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-all cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por Data */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all cursor-pointer"
              title="Filtrar por data específica"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                title="Limpar data"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setSelectedDate(prev => prev === getTodayStr() ? '' : getTodayStr())}
            className={`px-3 py-2 border rounded-xl text-xs font-medium transition-all cursor-pointer ${
              selectedDate === getTodayStr()
                ? 'bg-navy text-white border-navy font-semibold shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
            }`}
            title={selectedDate === getTodayStr() ? 'Remover filtro de hoje' : 'Filtrar registros de hoje'}
          >
            Hoje
          </button>
        </div>

        {/* Segmented Control de Filtro */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 self-start md:self-auto overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'ALL' 
                ? 'bg-white text-navy font-semibold shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({dateFilteredHistory.length})
          </button>
          <button
            onClick={() => setFilterType('ENTRY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'ENTRY' 
                ? 'bg-emerald-600 text-white font-semibold shadow-xs' 
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Entradas ({entriesCount})
          </button>
          <button
            onClick={() => setFilterType('EXIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'EXIT' 
                ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            Saídas ({exitsCount})
          </button>
        </div>
      </div>

      {/* Listagem de Registros */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-40" />
            <p className="text-xs font-medium text-slate-500">Carregando histórico de movimentações...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
              <History className="w-7 h-7 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Nenhum registro encontrado</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {searchTerm || selectedDate 
                  ? 'Tente ajustar a data ou os termos de pesquisa informados.' 
                  : 'Não há movimentações registradas para os filtros selecionados.'}
              </p>
            </div>
            {(searchTerm || selectedDate) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDate('');
                }}
                className="mt-1 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all cursor-pointer"
              >
                Limpar Filtros
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
              const companyName = reqProfile?.full_name ? toTitleCase(reqProfile.full_name) : 'Empresa Terceirizada';
              const driver = item.material?.request?.driver_name ? toTitleCase(item.material.request.driver_name) : '';
              const plate = item.material?.request?.plate ? item.material.request.plate.toUpperCase() : '';
              const equipmentName = item.material?.name ? toTitleCase(item.material.name) : 'Material não especificado';
              const serialNumber = item.material?.serial_number || 'S/N';
              const actorName = item.actor?.full_name ? toTitleCase(item.actor.full_name) : 'Agente de Portaria';
              const authorizerMat = item.signature || item.actor?.registration_number || '';
              const roleLabel = 
                item.actor?.role === 'PORTARIA' ? 'Portaria' : 
                item.actor?.role === 'LIDER_SETOR' ? 'Líder' : 
                item.actor?.role === 'GESTOR' ? 'Gestor' : 'Portaria';

              return (
                <div 
                  key={item.id || idx} 
                  className="p-5 md:p-6 hover:bg-slate-50/60 transition-colors flex flex-col gap-4 group"
                >
                  {/* Linha Superior: Tipo de Movimento, Protocolo e Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${info.badgeColor}`}>
                        {info.badgeIcon}
                        <span>{info.typeLabel}</span>
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Protocolo #{item.id?.slice(0, 8).toUpperCase() || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dt.date}</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-700">{dt.time}</span>
                    </div>
                  </div>

                  {/* Linha Central: Informações Limpas e Hierarquizadas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-center">
                    
                    {/* Terceirizada & Veículo (4 cols) */}
                    <div className="lg:col-span-4 flex items-center gap-3.5">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 overflow-hidden"
                        style={{ backgroundColor: themeColor }}
                      >
                        {reqProfile?.logo_url ? (
                          <img src={reqProfile.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          companyName[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{companyName}</p>
                        {(plate || driver) ? (
                          <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 truncate">
                            <Truck className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{plate ? `Placa ${plate}` : ''} {driver ? `• ${driver}` : ''}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">Entrada autorizada</p>
                        )}
                      </div>
                    </div>

                    {/* Equipamento & Serial (3 cols) */}
                    <div className="lg:col-span-3">
                      <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{equipmentName}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {(item.material?.brand || item.material?.model) && (
                          <span className="text-xs text-slate-500 truncate max-w-[130px]">
                            {item.material.brand} {item.material.model}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-medium">
                          <Hash className="w-2.5 h-2.5 text-slate-400" />
                          {serialNumber}
                        </span>
                      </div>
                    </div>

                    {/* Fluxo Operacional: Origem -> Destino (3 cols) */}
                    <div className="lg:col-span-3">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Fluxo da Operação</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[120px]" title={info.origin}>
                          {info.origin}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md truncate max-w-[120px] ${
                          info.type === 'EXIT' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`} title={info.destination}>
                          {info.destination}
                        </span>
                      </div>
                    </div>

                    {/* Responsável & Ações (2 cols) */}
                    <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 pt-3 lg:pt-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-navy/10 text-navy flex items-center justify-center text-xs font-bold shrink-0">
                          {actorName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={actorName}>
                            {actorName}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                            <span>{roleLabel}</span>
                            {authorizerMat && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-600">Mat. {authorizerMat}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botão de Fotos se houver */}
                      {item.photos && item.photos.length > 0 && (
                        <button
                          onClick={() => onViewPhotos(item.photos)}
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                          title="Visualizar fotos registradas"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{item.photos.length}</span>
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Observação / Evidência Adicional */}
                  {item.observation && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-900 leading-relaxed">
                        <span className="font-semibold text-amber-800 mr-1.5">Observação:</span>
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
      <div className="pt-2 pb-8 flex justify-center">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-xs transition-all shadow-xs active:scale-95 group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-slate-400" />
          <span>Voltar ao Controle de Portaria</span>
        </button>
      </div>

    </div>
  );
};
