import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAuthToken } from '../../../utils/subdomain';
import { api } from '../../../lib/axios';
import { ClipboardList, Check, X, AlertTriangle, Loader2, LogOut } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  description: string;
  condition: string;
  code: string;
  image_url: string;
}

interface Requisicao {
  id: string;
  sector: string;
  entry_date: string;
  profile: {
    full_name: string;
    theme_color?: string;
    representative_name?: string;
    phone?: string;
    cnpj?: string;
    logo_url?: string;
  };
  materials: Material[];
}

interface CompanyDetails {
  full_name: string;
  representative_name?: string;
  phone?: string;
  cnpj?: string;
  logo_url?: string;
  theme_color?: string;
}

export default function LiderDashboard() {
  const { signOut } = useAuth();
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [liderInfo, setLiderInfo] = useState<{ full_name: string, sector: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);

  const fetchPendencias = async () => {
    try {
      const response = await api.get('/lider/pendencias', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      const responseData = response.data.data || response.data;

      setRequisicoes(responseData.requests || []);
      if (responseData.lider) {
        setLiderInfo(responseData.lider);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      if (err.message.includes('Token')) {
        setTimeout(() => signOut(), 2500);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendencias();
  }, []);

  const handleRevisar = async (requestId: string, acao: 'APPROVE' | 'REJECT') => {
    try {
      const response = await api.post(`/lider/revisar/${requestId}`, 
        { acao },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      if (response.status === 200) {
        setRequisicoes(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao processar ação.');
    }
  };

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Formatação amigável de data e hora
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('pt-BR'),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-brand antialiased text-navy">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <img 
              src="https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png" 
              alt="Lins" 
              className="h-10"
            />
            <div className="h-6 w-px bg-slate-100 mx-2 hidden md:block"></div>
            <div className="hidden md:block">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                {liderInfo?.sector ? `Gestão Setorial: ${liderInfo.sector}` : 'Gestão Setorial'}
              </span>
              <h1 className="font-black text-navy text-sm uppercase">Fila de Aprovação</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-black text-navy uppercase leading-none">{liderInfo?.full_name || 'Carregando...'}</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Líder de Setor</p>
            </div>
            <button 
              onClick={signOut}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors bg-slate-50 px-4 py-2 rounded-full border border-slate-100"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-navy uppercase tracking-tighter italic">
              Setores em <span className="text-primary not-italic">Operação</span>
            </h2>
            <p className="text-slate-400 font-medium mt-1">Avalie as entradas de equipamentos antes do acesso à planta.</p>
          </div>
          
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendências</p>
              <p className="text-xl font-black text-navy">{requisicoes.length}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
             <AlertTriangle className="w-5 h-5 flex-shrink-0" />
             {error}
          </div>
        )}

        {/* Pending Requests */}
        <div className="space-y-6">
          {loading ? (
            <div className="p-20 text-center bg-white rounded-3xl border border-slate-100">
               <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" />
               <p className="mt-4 text-slate-400 font-black text-[10px] uppercase tracking-widest italic">Aguardando dados industriais...</p>
            </div>
          ) : requisicoes.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
               <Check className="w-12 h-12 text-emerald-400 bg-emerald-50 p-4 rounded-full mb-4" />
               <h3 className="text-navy font-black text-sm uppercase">Nenhuma solicitação pendente</h3>
               <p className="text-slate-400 text-xs mt-1">Seu setor está com o fluxo de segurança em dia.</p>
            </div>
          ) : requisicoes.map((req) => {
            const { date, time } = formatDateTime(req.entry_date);
            return (
              <div key={req.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:border-primary/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
                
                <div className="relative flex flex-col lg:flex-row gap-10">
                   {/* Driver & Company */}
                   <div className="flex-1">
                     <div className="flex items-center gap-4 mb-6">
                        <button 
                         onClick={() => setSelectedCompany({
                           full_name: req.profile.full_name,
                           representative_name: req.profile.representative_name,
                           phone: req.profile.phone,
                           cnpj: req.profile.cnpj,
                           logo_url: req.profile.logo_url,
                           theme_color: req.profile.theme_color
                         })}
                         className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-all hover:scale-110 active:scale-95 overflow-hidden group/logo"
                         style={{ 
                           backgroundColor: req.profile?.theme_color || '#0032A0',
                           boxShadow: `0 10px 20px ${(req.profile?.theme_color || '#0032A0')}40`
                         }}
                        >
                           {req.profile?.logo_url ? (
                             <img src={req.profile.logo_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             req.profile?.full_name ? req.profile.full_name[0] : '?'
                           )}
                           <div className="absolute inset-0 bg-black/0 group-hover/logo:bg-black/20 transition-colors flex items-center justify-center">
                             <Plus className="w-5 h-5 text-white opacity-0 group-hover/logo:opacity-100 scale-50 group-hover/logo:scale-100 transition-all" />
                           </div>
                        </button>
                        <div className="flex-1">
                           <button 
                             onClick={() => setSelectedCompany({
                               full_name: req.profile.full_name,
                               representative_name: req.profile.representative_name,
                               phone: req.profile.phone,
                               cnpj: req.profile.cnpj,
                               logo_url: req.profile.logo_url,
                               theme_color: req.profile.theme_color
                             })}
                             className="text-lg font-black text-navy uppercase leading-none hover:text-primary transition-colors text-left"
                           >
                             {req.profile?.full_name || 'Usuário Desconhecido'}
                           </button>
                           <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1.5">
                                 <div 
                                   className="w-2 h-2 rounded-full" 
                                   style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}
                                 ></div>
                                 <span className="text-[10px] text-primary font-black uppercase tracking-widest">Terceirizada</span>
                              </div>
                              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{date}</span>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Setor Destino</p>
                           <p className="font-bold text-navy text-sm italic">{req.sector}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Horário Previsto</p>
                           <p className="font-bold text-navy text-sm">{time}</p>
                        </div>
                     </div>
                   </div>

                   {/* Materials */}
                   <div className="flex-1 lg:border-l lg:border-slate-50 lg:pl-10">
                      <div className="flex items-center justify-between mb-4">
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Equipamentos e Materiais ({req.materials.length})</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                         {req.materials.map(mat => (
                           <button 
                             key={mat.id} 
                             onClick={() => setSelectedMaterial(mat)}
                             className="w-full text-left bg-[#F8FAFC] p-3 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-primary/30 hover:shadow-md transition-all group/mat relative overflow-hidden"
                           >
                              {/* Indicador de Cor da Terceirizada */}
                              <div 
                               className="absolute left-0 top-0 bottom-0 w-1 opacity-60"
                               style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}
                              ></div>

                              <div className="pl-2">
                                 <p className="font-black text-navy text-[11px] uppercase group-hover/mat:text-primary transition-colors">{mat.name}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{mat.model || 'S/ Modelo'} • SN: {mat.serial_number || 'S/ Série'}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 {mat.image_url && <div className="w-6 h-6 bg-slate-200 rounded-md overflow-hidden border border-slate-300">
                                    <img src={mat.image_url} alt="" className="w-full h-full object-cover" />
                                 </div>}
                                 <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">{mat.condition}</span>
                              </div>
                           </button>
                         ))}
                      </div>
                   </div>

                   {/* Decisions */}
                   <div className="flex lg:flex-col gap-4 justify-center items-center">
                     <button 
                       onClick={() => handleRevisar(req.id, 'APPROVE')}
                       className="flex-1 lg:flex-none w-full lg:w-16 h-16 bg-primary hover:bg-[#009e96] text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center transition-all active:scale-[0.98] group/btn"
                     >
                       <Check className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
                     </button>
                     <button 
                       onClick={() => handleRevisar(req.id, 'REJECT')}
                       className="flex-1 lg:flex-none w-full lg:w-16 h-16 bg-white border-2 border-slate-100 hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all active:scale-[0.98]"
                     >
                       <X className="w-8 h-8" />
                     </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
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
                        selectedCompany.full_name[0]
                      )}
                   </div>
                   <button 
                    onClick={() => setSelectedCompany(null)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all"
                   >
                     <X className="w-6 h-6" />
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

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[16px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[85vh] border border-slate-200">
            
            {/* Lado Esquerdo: Imagem Compacta */}
            <div className="md:w-[40%] relative bg-slate-900 flex-shrink-0 min-h-[220px]">
              {selectedMaterial.image_url ? (
                <img 
                  src={selectedMaterial.image_url} 
                  alt={selectedMaterial.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                  <ClipboardList className="w-8 h-8 opacity-10" />
                  <p className="text-[8px] font-black uppercase tracking-widest mt-2">Sem imagem</p>
                </div>
              )}
            </div>

            {/* Lado Direito: Informações Técnicas Enxutas */}
            <div className="md:w-[60%] flex flex-col overflow-hidden bg-white">
              {/* Header Ultra-Compacto */}
              <div className="bg-navy px-5 py-3 flex justify-between items-center flex-shrink-0">
                 <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/20 rounded-md">
                      <ClipboardList className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[7px] text-primary font-black uppercase tracking-[0.2em] leading-none">Ativo Industrial</p>
                      <h3 className="text-white font-black uppercase text-[11px] mt-0.5 tracking-tight truncate max-w-[160px]">{selectedMaterial.name}</h3>
                    </div>
                 </div>
                 <button 
                  onClick={() => setSelectedMaterial(null)}
                  className="w-6 h-6 bg-white/10 hover:bg-white/20 text-white rounded-md flex items-center justify-center transition-all"
                >
                  <X className="w-3.5 h-3.5" />
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

                  {selectedMaterial.description && (
                    <div className="pt-3 border-t border-slate-50">
                       <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Notas de Campo</p>
                       <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                          <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                            "{selectedMaterial.description}"
                          </p>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 pt-2">
                <button 
                  onClick={() => setSelectedMaterial(null)}
                  className="w-full bg-navy text-white font-black text-[9px] uppercase tracking-[0.2em] py-3 rounded-lg hover:bg-primary transition-all shadow-md active:scale-[0.98]"
                >
                  Confirmar Leitura
                </button>
              </div>
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
       <p className="font-bold text-navy text-sm">{value}</p>
    </div>
  );
}

function Plus({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
