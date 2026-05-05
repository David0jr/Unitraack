import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../utils/subdomain';
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
    representative_name?: string;
    phone?: string;
  };
  materials: Material[];
}

export default function LiderDashboard() {
  const { signOut } = useAuth();
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [liderInfo, setLiderInfo] = useState<{ full_name: string, sector: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPendencias = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/lider/pendencias`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Erro ao carregar dados.');
      
      // O ApiResponse.success empacota o retorno dentro de `data`
      const responseData = payload.data || payload;

      setRequisicoes(responseData.requests || []);
      if (responseData.lider) {
        setLiderInfo(responseData.lider);
      }
    } catch (err: any) {
      setError(err.message);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/lider/revisar/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ acao })
      });

      if (response.ok) {
        setRequisicoes(prev => prev.filter(r => r.id !== requestId));
      } else {
        const payload = await response.json();
        alert(payload.error || 'Erro ao processar ação.');
      }
    } catch (err) {
      alert('Erro de rede.');
    }
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
          ) : requisicoes.map((req) => (
            <div key={req.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:border-primary/20 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
               
               <div className="relative flex flex-col lg:flex-row gap-10">
                  {/* Driver & Company */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-navy/20">
                          {req.profile?.full_name ? req.profile.full_name[0] : '?'}
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-navy uppercase leading-none">{req.profile?.full_name || 'Usuário Desconhecido'}</h4>
                          <div className="flex items-center gap-4 mt-2">
                             <span className="text-[10px] text-primary font-black uppercase tracking-widest">Terceirizada</span>
                             <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                             <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(req.entry_date).toLocaleDateString()}</span>
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
                          <p className="font-bold text-navy text-sm">{new Date(req.entry_date).toLocaleTimeString()}</p>
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
                          <div 
                            key={mat.id} 
                            className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-primary/30 hover:shadow-md transition-all"
                          >
                             <div>
                                <p className="font-black text-navy text-[11px] uppercase">{mat.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{mat.model || 'S/ Modelo'} • SN: {mat.serial_number || 'S/ Série'}</p>
                             </div>
                             <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">{mat.condition}</span>
                          </div>
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
          ))}
        </div>

      </main>
    </div>
  );
}
