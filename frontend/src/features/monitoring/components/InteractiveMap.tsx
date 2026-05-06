import { useState, useRef, useEffect } from 'react';
import { api } from '../../../lib/axios';
import { 
  Maximize2, 
  Minimize2, 
  Edit3, 
  Save, 
  Plus,
  Package
} from 'lucide-react';
import { useDashboard } from '../../../contexts/DashboardContext';
import { useAuth } from '../../../contexts/AuthContext';

const COMPANY_COLORS: Record<string, string> = {
  'default': '#0032A0',
  'Lins': '#0032A0',
  'Usina': '#10B981',
  'Terceirizada': '#F59E0B',
  'Transporte': '#3B82F6',
  'Manutenção': '#8B5CF6',
  'Segurança': '#EF4444',
};

const PALETTE = [
  '#0032A0', // Navy
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#64748B', // Slate
];

/**
 * Mapa Digital Twin da Usina.
 * Permite visualização e edição do layout industrial e localização de ativos.
 */
export default function InteractiveMap() {
  const { } = useAuth();
  const { sectors, materials, refreshData } = useDashboard();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localSectors, setLocalSectors] = useState<any[]>([]);
  const [draggingSector, setDraggingSector] = useState<string | null>(null);
  const [resizingSector, setResizingSector] = useState<{ id: string, handle: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [hoveredMaterial, setHoveredMaterial] = useState<any | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const positioned = sectors.filter((s: any) => s.layout_x !== null && s.layout_x !== 0);
    setLocalSectors(positioned);
  }, [sectors]);

  const handleMouseDown = (id: string) => {
    if (!isEditMode) return;
    setDraggingSector(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    if (draggingSector && isEditMode) {
      setLocalSectors(prev => prev.map(s => 
        s.id === draggingSector 
          ? { ...s, layout_x: Math.round(x - s.layout_w / 2), layout_y: Math.round(y - s.layout_h / 2) }
          : s
      ));
    }

    if (resizingSector && isEditMode) {
      setLocalSectors(prev => prev.map(s => {
        if (s.id !== resizingSector.id) return s;
        const newSector = { ...s };
        if (resizingSector.handle === 'se') {
          newSector.layout_w = Math.max(50, Math.round(x - s.layout_x));
          newSector.layout_h = Math.max(50, Math.round(y - s.layout_y));
        } else if (resizingSector.handle === 'sw') {
          const deltaX = s.layout_x - x;
          newSector.layout_x = x;
          newSector.layout_w = Math.max(50, s.layout_w + deltaX);
          newSector.layout_h = Math.max(50, Math.round(y - s.layout_y));
        }
        return newSector;
      }));
    }

    if (hoveredMaterial) {
      setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
    }
  };

  const handleMouseUp = () => {
    setDraggingSector(null);
    setResizingSector(null);
  };

  const addSectorToMap = (sector: any) => {
    setLocalSectors(prev => [
      ...prev,
      { ...sector, layout_x: 200, layout_y: 200, layout_w: 180, layout_h: 120 }
    ]);
    setShowAddMenu(false);
  };

  const removeSectorFromMap = (id: string) => {
    setLocalSectors(prev => prev.filter(s => s.id !== id));
  };

  const saveChanges = async () => {
    try {
      await api.post('/gestor/map-layout', {
        layouts: localSectors.map(s => ({
          id: s.id,
          x: s.layout_x,
          y: s.layout_y,
          w: s.layout_w,
          h: s.layout_h
        }))
      });
      
      setIsEditMode(false);
      refreshData();
    } catch (err: any) {

      alert(err.response?.data?.error || 'Erro ao salvar layout do mapa.');
    }
  };

  const getCompanyColor = (tenantId: string, companyName?: string) => {
    if (companyName) {
      if (companyName.includes('Usina') || companyName.includes('Lins')) return COMPANY_COLORS.Lins;
      const hash = companyName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return PALETTE[hash % PALETTE.length];
    }
    const hash = tenantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PALETTE[hash % PALETTE.length];
  };

  return (
    <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 ${isExpanded ? 'fixed inset-4 z-[100]' : 'relative h-[500px]'}`}>
      
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-navy text-white rounded-2xl flex items-center justify-center">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-navy uppercase tracking-tighter leading-none italic">
              Digital Twin <span className="text-primary italic">Mapa Operacional</span>
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronização em tempo real de ativos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditMode ? (
            <>
              <div className="relative">
                <button 
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="px-4 py-2 bg-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-navy/90 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Área
                </button>

                {showAddMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100] animate-in fade-in slide-in-from-top-2">
                    <p className="p-3 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Setores Disponíveis</p>
                    <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {sectors.filter((s: any) => !s.parent_id).map((parent: any) => {
                        const availableChildren = sectors.filter((s: any) => 
                          s.parent_id === parent.id && 
                          !localSectors.some(ls => ls.id === s.id)
                        );
                        
                        const isParentAvailable = !localSectors.some(ls => ls.id === parent.id);

                        if (availableChildren.length === 0 && !isParentAvailable) return null;

                        return (
                          <div key={parent.id} className="mb-5 last:mb-2 group/parent">
                            <div className="px-4 py-2 flex items-center justify-between bg-slate-50/50 rounded-xl mb-2 border border-slate-100/50">
                              <div className="flex items-center gap-2.5">
                                <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                <span className="text-[10px] font-black text-navy uppercase tracking-[0.1em]">{parent.name}</span>
                              </div>
                              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{availableChildren.length} subsetores</span>
                            </div>
                            
                            <div className="space-y-1 ml-2">
                              {isParentAvailable && (
                                <button
                                  onClick={() => addSectorToMap(parent)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-primary/5 rounded-xl transition-all group flex items-center justify-between border border-transparent hover:border-primary/10"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary"></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase group-hover:text-primary transition-colors italic">Posicionar Setor Completo</span>
                                  </div>
                                  <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-all group-hover:rotate-90" />
                                </button>
                              )}
                              
                              {availableChildren.map((sub: any) => (
                                <button
                                  key={sub.id}
                                  onClick={() => addSectorToMap(sub)}
                                  className="w-full text-left px-4 py-3 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 rounded-xl transition-all group flex items-center justify-between border border-transparent hover:border-slate-100"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-1 h-1 rounded-full bg-slate-200 group-hover:bg-primary"></div>
                                    <span className="text-[10px] font-bold text-navy uppercase group-hover:text-primary transition-colors">{sub.name}</span>
                                  </div>
                                  <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                    <Plus className="w-3 h-3" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Fallback para setores avulsos */}
                      {sectors.filter((s: any) => 
                        !s.parent_id && 
                        !localSectors.some(ls => ls.id === s.id) &&
                        !sectors.some(other => other.parent_id === s.id)
                      ).length > 0 && (
                        <div className="mt-4 border-t border-slate-50 pt-4">
                           <p className="px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                             Outros Setores
                           </p>
                           <div className="space-y-1">
                             {sectors.filter((s: any) => 
                                !s.parent_id && 
                                !localSectors.some(ls => ls.id === s.id) &&
                                !sectors.some(other => other.parent_id === s.id)
                             ).map((s: any) => (
                                <button
                                  key={s.id}
                                  onClick={() => addSectorToMap(s)}
                                  className="w-full text-left px-4 py-3 hover:bg-white hover:shadow-md rounded-xl transition-all group flex items-center justify-between border border-transparent hover:border-slate-100"
                                >
                                  <span className="text-[10px] font-bold text-navy uppercase group-hover:text-primary">{s.name}</span>
                                  <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-all" />
                                </button>
                             ))}
                           </div>
                        </div>
                      )}

                      {sectors.length > 0 && sectors.every((s: any) => localSectors.some(ls => ls.id === s.id)) && (
                        <p className="p-4 text-[9px] text-slate-400 font-bold italic text-center">
                          Todos os setores já estão no mapa
                        </p>
                      )}
                      
                      {sectors.length === 0 && (
                        <p className="p-4 text-[9px] text-slate-400 font-bold italic text-center">
                          Buscando setores...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-[1px] h-6 bg-slate-100 mx-1"></div>

              <button 
                onClick={() => setIsEditMode(false)}
                className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Descartar
              </button>
              <button 
                onClick={saveChanges}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.05] transition-all"
              >
                <Save className="w-3.5 h-3.5" /> Salvar Layout
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditMode(true)}
              className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/20 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar Layout
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-navy transition-all"
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Map Content */}
      <div className="relative w-full h-full bg-[#F8FAFC] overflow-hidden group/map">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#0032A0 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        <svg 
          ref={svgRef}
          className={`w-full h-full ${isEditMode ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          viewBox={isExpanded ? undefined : "0 0 1000 600"}
          preserveAspectRatio="xMidYMid slice"
        >
          {sectors.length === 0 ? (
            <text x="500" y="300" textAnchor="middle" className="fill-slate-300 font-black text-sm uppercase tracking-widest">
              Carregando estrutura industrial...
            </text>
          ) : localSectors.length === 0 && (
            <text x="500" y="300" textAnchor="middle" className="fill-slate-300 font-black text-sm uppercase tracking-widest">
              Nenhuma área definida no mapa. Clique em "Adicionar Área" para começar.
            </text>
          )}
          <defs>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
            </filter>
            <linearGradient id="sectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.8 }} />
               <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0.5 }} />
            </linearGradient>
          </defs>

          {localSectors.map(sector => (
            <g 
              key={sector.id}
              onMouseDown={() => handleMouseDown(sector.id)}
              className={`transition-all ${isEditMode ? 'cursor-move opacity-80 hover:opacity-100' : ''}`}
            >
              <rect 
                x={sector.layout_x}
                y={sector.layout_y}
                width={sector.layout_w}
                height={sector.layout_h}
                rx="20"
                fill="url(#sectorGrad)"
                stroke="#E2E8F0"
                strokeWidth="1"
                filter="url(#shadow)"
              />
              <text 
                x={sector.layout_x + 20} 
                y={sector.layout_y + 30} 
                className="text-navy font-black text-[10px] uppercase tracking-widest pointer-events-none fill-navy/40"
              >
                {sector.name}
              </text>

              {isEditMode && (
                <>
                  <circle 
                    cx={sector.layout_x + sector.layout_w} 
                    cy={sector.layout_y + sector.layout_h} 
                    r="8" 
                    fill="white" 
                    stroke="#0032A0" 
                    strokeWidth="2"
                    className="cursor-nwse-resize hover:fill-primary transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingSector({ id: sector.id, handle: 'se' });
                    }}
                  />
                  <circle 
                    cx={sector.layout_x} 
                    cy={sector.layout_y + sector.layout_h} 
                    r="8" 
                    fill="white" 
                    stroke="#0032A0" 
                    strokeWidth="2"
                    className="cursor-nesw-resize hover:fill-primary transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingSector({ id: sector.id, handle: 'sw' });
                    }}
                  />
                  <circle 
                    cx={sector.layout_x + sector.layout_w / 2} 
                    cy={sector.layout_y - 20} 
                    r="12" 
                    fill="#EF4444" 
                    className="cursor-pointer hover:fill-red-600 transition-colors shadow-lg"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      removeSectorFromMap(sector.id);
                    }}
                  />
                  {/* Removido o foreignObject problemático e substituído por um ícone SVG simples ou Group */}
                  <g transform={`translate(${sector.layout_x + sector.layout_w / 2 - 7}, ${sector.layout_y - 27})`} className="pointer-events-none">
                     <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                </>
              )}

              {materials.filter((m: any) => m.current_sector_id === sector.id).map((mat: any, idx: number) => {
                const x = mat.layout_x ?? (sector.layout_x + 40 + (idx * 25) % (sector.layout_w - 60));
                const y = mat.layout_y ?? (sector.layout_y + 60 + Math.floor(idx / 5) * 25);

                const color = mat.request?.profile?.theme_color || getCompanyColor(mat.request?.profile?.tenant_id || 'default', mat.request?.profile?.full_name);

                return (
                  <circle 
                    key={mat.id}
                    cx={x}
                    cy={y}
                    r="6"
                    fill={color}
                    className="cursor-pointer transition-all hover:r-8 animate-pulse"
                    onMouseEnter={() => setHoveredMaterial(mat)}
                    onMouseLeave={() => setHoveredMaterial(null)}
                    onClick={() => setSelectedMaterial(mat)}
                    style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
                  />
                );
              })}
            </g>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredMaterial && (
          <div 
            className="fixed z-[200] bg-navy p-4 rounded-2xl shadow-2xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                 <Package className="w-4 h-4" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-white uppercase leading-none">{hoveredMaterial.name}</p>
                 <p className="text-[8px] text-primary font-bold uppercase tracking-widest mt-1">{hoveredMaterial.model}</p>
               </div>
            </div>
            <div className="pt-2 border-t border-white/5">
               <p className="text-[8px] text-white/40 font-black uppercase tracking-widest mb-1">Empresa Parceira</p>
               <p className="text-[10px] font-bold text-white uppercase">{hoveredMaterial.request.profile.full_name}</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-xl z-20 space-y-2">
           <p className="text-[8px] font-black text-navy uppercase tracking-widest mb-3 opacity-50">Legenda de Ativos</p>
           <div className="flex flex-wrap gap-4 max-w-xs">
              {Object.entries(COMPANY_COLORS).map(([id, color]) => (
                <div key={id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-[8px] font-bold text-navy uppercase tracking-tighter">Empresa {id === 'default' ? 'Lins' : id.toUpperCase()}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Modals from MonitoringDashboard */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[16px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[85vh] border border-slate-200">
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
                  <p className="text-[8px] font-black uppercase tracking-widest mt-2">Sem imagem</p>
                </div>
              )}
              <button 
                onClick={() => setSelectedCompany(selectedMaterial.request.profile)}
                className="absolute bottom-4 left-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-2 transition-all group"
              >
                 <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 bg-navy">
                    {selectedMaterial.request.profile.logo_url ? (
                      <img src={selectedMaterial.request.profile.logo_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-black">
                        {selectedMaterial.request.profile.full_name[0]}
                      </div>
                    )}
                 </div>
                 <span className="text-[8px] font-black text-white uppercase truncate group-hover:text-primary transition-colors">Propriedade: {selectedMaterial.request.profile.full_name}</span>
              </button>
            </div>
            <div className="md:w-[60%] flex flex-col overflow-hidden bg-white">
              <div className="bg-navy px-5 py-3 flex justify-between items-center flex-shrink-0">
                 <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/20 rounded-md">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[7px] text-primary font-black uppercase tracking-[0.2em] leading-none">Ativo Industrial</p>
                      <h3 className="text-white font-black uppercase text-[11px] mt-0.5 tracking-tight truncate max-w-[160px]">{selectedMaterial.name}</h3>
                    </div>
                 </div>
                 <button onClick={() => setSelectedMaterial(null)} className="w-6 h-6 bg-white/10 hover:bg-white/20 text-white rounded-md flex items-center justify-center transition-all">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Especificações Técnicas</span>
                    <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-md uppercase border border-primary/20">
                      Condição: {selectedMaterial.condition}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Fabricante</p>
                      <p className="font-bold text-navy text-[10px] truncate">{selectedMaterial.brand || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Modelo</p>
                      <p className="font-bold text-navy text-[10px] truncate">{selectedMaterial.model || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Nº de Série</p>
                      <p className="font-bold text-navy text-[10px] font-mono tracking-tighter truncate">{selectedMaterial.serial_number || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Patrimônio</p>
                      <p className="font-bold text-navy text-[10px] font-mono tracking-tighter truncate">{selectedMaterial.code || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2">
                <button onClick={() => setSelectedMaterial(null)} className="w-full bg-navy text-white font-black text-[9px] uppercase tracking-[0.2em] py-3 rounded-lg hover:bg-primary transition-all shadow-md active:scale-[0.98]">
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCompany && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
             <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                   <div 
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl"
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
                   <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Perfil da Empresa</span>
                   <h3 className="text-2xl font-black text-navy uppercase leading-tight mt-1">{selectedCompany.full_name}</h3>
                </div>

                <div className="space-y-6">
                   <DetailItem label="Representante" value={selectedCompany.representative_name || 'NÃO INFORMADO'} />
                   <DetailItem label="CNPJ" value={selectedCompany.cnpj || 'NÃO INFORMADO'} />
                   <DetailItem label="Telefone" value={selectedCompany.phone || 'NÃO INFORMADO'} />
                </div>

                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="w-full bg-navy text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl mt-10 hover:bg-[#002880] transition-all shadow-xl shadow-navy/20"
                >
                  Fechar Detalhes
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col">
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
       <p className="font-bold text-navy text-sm uppercase">{value}</p>
    </div>
  );
}

import { XCircle } from 'lucide-react';

