import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../utils/subdomain';
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
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function TerceirizadaDashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(prof);

      const { data: reqs } = await supabase
        .from('entry_requests')
        .select(`
          *,
          materials (count)
        `)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });
      
      setRequests(reqs || []);
    } catch (err) {
      console.error(err);
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
        await axios.patch(`${import.meta.env.VITE_API_URL}/terceirizada/requisicao/${id}/cancelar`, {}, {
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
        await axios.delete(`${import.meta.env.VITE_API_URL}/terceirizada/requisicao/${id}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        Swal.fire('Excluída!', 'Registro removido.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Erro', 'Não foi possível excluir.', 'error');
      }
    }
  };

  const handleEdit = (req: any) => {
    navigate('/painel/nova-solicitacao', { state: { editMode: true, request: req } });
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
            onClick={() => navigate('/painel/nova-solicitacao')}
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
                           {/* Só permite editar/cancelar se NÃO estiver na planta ou finalizado */}
                           {req.status !== 'IN_PLANTA' && req.status !== 'COMPLETED' && req.status !== 'CANCELED' && (
                             <>
                               <button 
                                  onClick={() => handleEdit(req)}
                                  className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                                  title="Editar Pedido"
                               >
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button 
                                  onClick={() => handleCancel(req.id)}
                                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                  title="Cancelar Pedido"
                               >
                                 <XOctagon className="w-4 h-4" />
                               </button>
                             </>
                           )}
                           
                           <button 
                              onClick={() => handleDelete(req.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir do Histórico"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
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
