import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../../utils/subdomain';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MapPin,
  LogOut,
  Package,
  Loader2,
  Trash2,
  Edit2,
  XOctagon
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/axios';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function TerceirizadaDashboard() {
  const { signOut, user, profile: authProfile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Busca perfil via Backend API
      const profileRes = await api.get('/terceirizada/profile', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setProfile(profileRes.data.data || profileRes.data);

      // Busca requisições via Backend API
      const requestsRes = await api.get('/terceirizada/requisicoes', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      const reqs = requestsRes.data.data || requestsRes.data;
      setRequests(reqs || []);
    } catch (err) {
      console.error('[TerceirizadaDashboard] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: any = {
    'PENDING': { label: 'Análise (Líder)', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
    'APPROVED_LIDER': { label: 'Análise (Gestor)', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
    'REJECTED_LIDER': { label: 'Recusado (Líder)', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
    'APPROVED_GESTOR': { label: 'Aprovado (Gestor)', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
    'REJECTED_GESTOR': { label: 'Recusado (Gestor)', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
    'APPROVED': { label: 'Aprovado', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
    'REJECTED': { label: 'Recusado', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
    'IN_PLANTA': { label: 'Dentro da Planta', color: 'text-purple-600', bg: 'bg-purple-50', icon: CheckCircle2 },
    'COMPLETED': { label: 'Finalizado', color: 'text-slate-600', bg: 'bg-slate-100', icon: CheckCircle2 },
    'CANCELED': { label: 'Cancelado', color: 'text-slate-400', bg: 'bg-slate-50', icon: XOctagon },
  };

  const handleCancel = async (id: string) => {
    const result = await Swal.fire({
      title: 'Cancelar Solicitação?',
      text: "Esta ação invalidará a permissão de entrada.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0032A0',
      cancelButtonColor: '#f1f5f9',
      cancelButtonText: '<span style="color: #64748b">Não</span>',
      confirmButtonText: 'Sim, cancelar!'
    });

    if (result.isConfirmed) {
      try {
        await api.patch(`/terceirizada/requisicao/${id}/cancelar`, {}, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        Swal.fire('Cancelada!', 'A solicitação foi cancelada.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Erro', 'Não foi possível cancelar.', 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Excluir Solicitação?',
      text: "Isso removerá todo o histórico e fotos permanentemente.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#f1f5f9',
      cancelButtonText: '<span style="color: #64748b">Manter</span>',
      confirmButtonText: 'Sim, excluir!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/terceirizada/requisicao/${id}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        Swal.fire('Excluída!', 'Registro removido.', 'success');
        fetchData();
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || 'Não foi possível excluir.';
        Swal.fire('Erro', errorMsg, 'error');
      }
    }
  };

  const handleEdit = (req: any) => {
    const slug = authProfile?.tenant?.subdomain || 'painel';
    const rolePath = authProfile?.role?.toLowerCase().replace('_', '-');
    
    if (slug !== 'painel' && rolePath) {
      navigate(`/${slug}/${rolePath}/painel/nova-solicitacao`, { state: { editMode: true, request: req } });
    } else {
      navigate('/painel/nova-solicitacao', { state: { editMode: true, request: req } });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-navy font-brand antialiased">
      {/* Navbar Superior */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <img 
              src="https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png" 
              alt="Lins" 
              className="h-10 hover:opacity-80 transition-opacity"
            />
            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <div className="hidden md:block">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">Canal do Parceiro</span>
              <h1 className="font-black text-navy text-sm uppercase">Painel de Logística</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-black text-navy uppercase leading-none">{profile?.full_name || 'Carregando...'}</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Fornecedor Ativo</p>
            </div>
            <button 
              onClick={signOut}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Sair do Sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">
              Olá, <span className="text-primary italic">{profile?.representative_name?.split(' ')[0] || 'Representante'}</span>
            </h2>
            <p className="text-slate-400 font-medium mt-1">Gerencie suas solicitações de entrada e remessas de materiais.</p>
          </div>

          <button 
            onClick={() => {
              const slug = authProfile?.tenant?.subdomain || 'painel';
              const rolePath = authProfile?.role?.toLowerCase().replace('_', '-');
              if (slug !== 'painel' && rolePath) {
                navigate(`/${slug}/${rolePath}/painel/nova-solicitacao`);
              } else {
                navigate('/painel/nova-solicitacao');
              }
            }}
            className="flex items-center gap-3 bg-navy hover:bg-[#002880] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-navy/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Nova Solicitação
          </button>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            label="Total de Remessas" 
            value={requests.length.toString()} 
            icon={<Package className="w-6 h-6" />}
            color="bg-slate-50 text-navy"
          />
          <StatCard 
            label="Em Análise" 
            value={requests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED_LIDER').length.toString()} 
            icon={<Clock className="w-6 h-6" />}
            color="bg-amber-50 text-amber-600"
          />
          <StatCard 
            label="Aprovados" 
            value={requests.filter(r => r.status === 'APPROVED' || r.status === 'APPROVED_GESTOR' || r.status === 'IN_PLANTA' || r.status === 'COMPLETED').length.toString()} 
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Requests Table/List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-navy uppercase tracking-widest text-xs">Histórico Recente</h3>
            <span className="bg-slate-50 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">Últimas 30 dias</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento/Nota</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor Destino</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Solicitação</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" />
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                ) : requests.map((req) => {
                  const status = (req?.status && statusMap[req.status]) ? statusMap[req.status] : statusMap['PENDING'];
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${status?.bg || 'bg-slate-50'} ${status?.color || 'text-slate-400'}`}>
                            {status?.icon && <status.icon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-navy text-sm">{req.driver_name || 'N/A'}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase">{req.plate || 'SEM PLACA'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {req.sector || 'Geral'}
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(req.created_at).toLocaleDateString()}
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {/* Botão de Detalhes sempre visível */}
                           <button 
                              onClick={() => setSelectedRequest(req)}
                              className="p-2 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg transition-all"
                              title="Ver Detalhes"
                           >
                             <Package className="w-4 h-4" />
                           </button>

                           {/* Editar: Análise ou Aprovado (volta para análise) */}
                           {['PENDING', 'APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'REJECTED_LIDER', 'REJECTED_GESTOR', 'REJECTED'].includes(req.status) && (
                             <button 
                                onClick={() => handleEdit(req)}
                                className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                                title="Editar Pedido"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                           )}

                           {/* Cancelar: Apenas se estiver em análise */}
                           {req.status === 'PENDING' && (
                             <button 
                                onClick={() => handleCancel(req.id)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Cancelar Pedido"
                             >
                               <XOctagon className="w-4 h-4" />
                             </button>
                           )}
                           
                           {/* Excluir: Apenas se foi recusado ou cancelado */}
                           {['REJECTED_LIDER', 'REJECTED_GESTOR', 'REJECTED', 'CANCELED'].includes(req.status) && (
                             <button 
                                onClick={() => handleDelete(req.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Excluir do Histórico"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
               <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Protocolo #{selectedRequest.id.slice(0, 8)}</span>
                  <h3 className="text-2xl font-black text-navy uppercase tracking-tighter">Detalhes da Solicitação</h3>
               </div>
               <button onClick={() => setSelectedRequest(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all">
                  <XOctagon className="w-6 h-6" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
               <div className="grid grid-cols-2 gap-8 mb-10">
                  <DetailItem label="Motorista" value={selectedRequest.driver_name} />
                  <DetailItem label="Placa" value={selectedRequest.plate} />
                  <DetailItem label="Setor" value={selectedRequest.sector} />
                  <DetailItem label="Data Agendada" value={new Date(selectedRequest.entry_date).toLocaleDateString()} />
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Materiais na Remessa ({selectedRequest.materials?.length || 0})</h4>
                  <div className="grid grid-cols-1 gap-3">
                     {selectedRequest.materials?.map((mat: any) => (
                       <button 
                        key={mat.id}
                        onClick={() => setSelectedMaterial(mat)}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all group"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <Package className="w-5 h-5 text-primary" />
                             </div>
                             <div className="text-left">
                                <p className="text-xs font-black text-navy uppercase leading-none mb-1">{mat.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SN: {mat.serial_number || 'REGISTRO ÚNICO'}</p>
                             </div>
                          </div>
                          <div className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                             Ver Foto/Specs
                          </div>
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-50">
               <button onClick={() => setSelectedRequest(null)} className="w-full py-4 bg-navy text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-primary transition-all">
                  Fechar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Detail Modal (Same as Lider/Portaria) */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
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
                  <XOctagon className="w-3.5 h-3.5" />
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
                <button onClick={() => setSelectedMaterial(null)} className="w-full bg-navy text-white font-black text-[9px] uppercase tracking-[0.2em] py-3 rounded-lg hover:bg-primary transition-all shadow-md active:scale-[0.98]">
                  Fechar Detalhes
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
       <p className="font-bold text-navy text-sm uppercase">{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black text-navy">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl ${color}`}>
        {icon}
      </div>
    </div>
  );
}

