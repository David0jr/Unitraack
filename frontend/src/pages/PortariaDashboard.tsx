import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Truck, Search, CheckCircle, Loader2, Package, Hash, Info, LogOut } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  description: string;
  condition: string;
}

interface Requisicao {
  id: string;
  sector: string;
  entry_date: string;
  profiles: {
    full_name: string;
    representative_name?: string;
  };
  materials: Material[];
}

export default function PortariaDashboard() {
  const { signOut } = useAuth();
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchAprovados = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/approved`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) setRequisicoes(data);
    } catch (err) {
      console.error('Erro ao carregar aprovados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAprovados();
  }, []);

  const selectedReq = requisicoes.find(r => r.id === selecionadoId);

  const handleCheckIn = async (requestId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/checkin/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ observations: 'Check-in realizado com sucesso.' })
      });

      if (response.ok) {
        setRequisicoes(prev => prev.filter(r => r.id !== requestId));
        setSelecionadoId(null);
        alert('Entrada Liberada! Registro de IN_PLANTA efetuado.');
      } else {
        alert('Erro ao processar check-in.');
      }
    } catch (err) {
      alert('Erro de rede.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredReqs = requisicoes.filter(r => 
    r.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-brand antialiased text-navy">
      <nav className="bg-navy border-b border-navy/10 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <img 
              src="https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png" 
              alt="Lins" 
              className="h-10 brightness-[200%]"
            />
            <div className="h-6 w-px bg-white/20 mx-2 hidden md:block"></div>
            <div className="hidden md:block">
              <span className="text-[10px] text-blue-200/50 font-black uppercase tracking-[0.2em] leading-none">Gate Control</span>
              <h1 className="font-black text-white text-sm uppercase">Painel da Portaria</h1>
            </div>
          </div>
          <button 
            onClick={signOut} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-200 hover:text-white transition-all bg-white/5 py-2 px-4 rounded-full border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* List Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
               <input 
                type="text" 
                placeholder="Buscar por Empresa ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-sm"
               />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acessos Liberados</span>
                  <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full">{requisicoes.length} AGUARDANDO</span>
               </div>
               
               <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-50">
                  {loading ? (
                    <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" /></div>
                  ) : filteredReqs.length === 0 ? (
                    <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Nenhum veículo na fila</div>
                  ) : filteredReqs.map(req => (
                    <button 
                      key={req.id}
                      onClick={() => setSelecionadoId(req.id)}
                      className={`w-full p-6 text-left transition-all hover:bg-slate-50 flex items-center justify-between group ${selecionadoId === req.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${selecionadoId === req.id ? 'bg-primary text-white' : 'bg-slate-100 text-navy'} transition-colors`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-navy text-xs uppercase leading-none mb-1">{req.profiles.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.sector}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">{req.id.slice(0, 8)}</p>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-8">
             {selectedReq ? (
               <div className="bg-white rounded-[40px] shadow-2xl shadow-navy/5 border border-slate-100 p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                     <Truck className="w-64 h-64 -mr-20 -mt-20" />
                  </div>

                  <div className="relative flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-50 pb-10 mb-10">
                     <div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-4 py-1.5 rounded-full mb-4 inline-block">Verificação de Entrada</span>
                        <h3 className="text-4xl font-black text-navy uppercase tracking-tighter leading-none mb-2">{selectedReq.profiles.full_name}</h3>
                        <p className="text-slate-400 font-medium">Solicitação aprovada pelo Líder de Setor às {new Date(selectedReq.entry_date).toLocaleTimeString()}</p>
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Protocolo</span>
                        <code className="bg-slate-50 px-4 py-2 rounded-xl text-navy font-black text-xs border border-slate-100 italic">#{selectedReq.id}</code>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                     <div className="space-y-6">
                        <InfoItem label="Setor Destinado" value={selectedReq.sector} icon={<Hash className="w-4 h-4 text-primary" />} />
                        <InfoItem label="Data Agendada" value={new Date(selectedReq.entry_date).toLocaleDateString()} icon={<Hash className="w-4 h-4 text-primary" />} />
                        <InfoItem label="Status Operacional" value="IN_FILA_ENTRADA" icon={<Hash className="w-4 h-4 text-emerald-500" />} />
                     </div>
                     <div className="bg-[#F8FAFC] p-8 rounded-[32px] border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                           <Package className="w-5 h-5 text-primary" />
                           <h4 className="font-black text-navy text-[10px] uppercase tracking-widest">Conferência de Carga ({selectedReq.materials.length})</h4>
                        </div>
                        <ul className="space-y-3">
                           {selectedReq.materials.map(mat => (
                             <li key={mat.id} className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                                <div>
                                   <p className="text-xs font-black text-navy uppercase">{mat.name} {mat.brand}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">SN: {mat.serial_number || 'REGISTRO ÚNICO'}</p>
                                </div>
                             </li>
                           ))}
                        </ul>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button 
                        onClick={() => handleCheckIn(selectedReq.id)}
                        disabled={processing}
                        className="flex-1 py-6 bg-navy hover:bg-[#002880] text-white rounded-3xl shadow-2xl shadow-navy/20 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50"
                     >
                        {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                          <>
                             <CheckCircle className="w-6 h-6 text-primary" />
                             Confirmar Entrada na Planta
                          </>
                        )}
                     </button>
                     <button className="px-8 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-3xl transition-all">
                        <Info className="w-6 h-6" />
                     </button>
                  </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-slate-100 border-dashed">
                  <div className="p-8 bg-slate-50 rounded-full mb-6">
                     <Truck className="w-16 h-16 text-slate-200" />
                  </div>
                  <h3 className="text-navy font-black text-lg uppercase tracking-tighter">Selecione um Veículo</h3>
                  <p className="text-slate-400 font-medium mt-2 max-w-sm text-center">Inicie a conferência física selecionando uma empresa autorizada na lista ao lado.</p>
               </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-navy uppercase">{value}</p>
      </div>
    </div>
  );
}
