import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Maximize2, 
  Minimize2, 
  Edit3, 
  Save, 
  Plus,
  Package
} from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { useAuth } from '../contexts/AuthContext';

const COMPANY_COLORS: Record<string, string> = {
  'default': '#0032A0',
  '1': '#F59E0B', // Amber
  '2': '#10B981', // Emerald
  '3': '#3B82F6', // Blue
  '4': '#8B5CF6', // Violet
  '5': '#EC4899', // Pink
};

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

  const getCompanyColor = (tenantId: string) => {
    const hash = tenantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const keys = Object.keys(COMPANY_COLORS).filter(k => k !== 'default');
    return COMPANY_COLORS[keys[hash % keys.length]] || COMPANY_COLORS.default;
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
                    <div className="max-h-48 overflow-y-auto">
                      {sectors.filter((s: any) => !localSectors.some(ls => ls.id === s.id)).length > 0 ? (
                        sectors.filter((s: any) => !localSectors.some(ls => ls.id === s.id)).map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => addSectorToMap(s)}
                            className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-all group"
                          >
                            <span className="text-[10px] font-bold text-navy uppercase group-hover:text-primary">{s.name}</span>
                          </button>
                        ))
                      ) : (
                        <p className="p-4 text-[9px] text-slate-400 font-bold italic text-center">
                          {sectors.length === 0 ? "Buscando setores..." : "Todos os setores já estão no mapa"}
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

                const color = getCompanyColor(mat.request.profile.tenant_id);

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
    </div>
  );
}
