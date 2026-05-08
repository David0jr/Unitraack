import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAuthToken } from '../../../utils/subdomain';
import {
  Building2,
  Users,
  ShieldCheck,
  Loader2,
  LogOut,
  BarChart3,
  Globe,
  PlusCircle,
  X,
  Search,
  LayoutDashboard,
  Menu,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Activity
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  cnpj: string;
  logo_url?: string;
  company_color?: string;
  created_at: string;
  gestores?: { count: number }[];
}

interface PlatformStats {
  totalTenants: number;
  totalUsers: number;
  totalRequests: number;
}

interface GlobalProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  tenant?: {
    id: string;
    name: string;
  };
}

export default function SuperAdminDashboard() {
  const { signOut, user, profile, token: authToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'users' | 'monitoring'>('dashboard');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [allUsers, setAllUsers] = useState<GlobalProfile[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedTenants, setExpandedTenants] = useState<string[]>([]);
  const [selectedMonitoringTenant, setSelectedMonitoringTenant] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchAuditLogs = async (tenantId: string) => {
    if (!tenantId) {
      setAuditLogs([]);
      return;
    }
    console.log('[Dashboard] Buscando logs para o tenantId:', tenantId);
    setLoadingLogs(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/admin/audit/${tenantId}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (resp.ok) {
        const result = await resp.json();
        console.log('[Dashboard] Resultado da API:', result);
        if (result.success && Array.isArray(result.data)) {
          setAuditLogs(result.data);
        } else {
          setAuditLogs([]);
        }
      } else {
        console.error('[Dashboard] Erro na resposta da API');
        setAuditLogs([]);
      }
    } catch (e) {
      console.error('Erro ao buscar logs', e);
      setAuditLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monitoring' && selectedMonitoringTenant) {
      fetchAuditLogs(selectedMonitoringTenant);
    }
  }, [activeTab, selectedMonitoringTenant]);

  const toggleTenant = (tenantId: string) => {
    setExpandedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId) 
        : [...prev, tenantId]
    );
  };

  const initialFormData = {
    tenantName: '',
    tenantCnpj: '',
    gestorEmail: '',
    gestorPassword: '',
    gestorFullName: '',
    logoUrl: '',
    companyColor: '#001D4A'
  };

  const [formData, setFormData] = useState(initialFormData);


  const fetchData = async () => {
    try {
      const token = authToken || getAuthToken();
      if (!token) {
        console.warn('[Dashboard] Nenhum token encontrado para busca de dados');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      const [tenantsRes, statsRes, usersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/tenants`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/users`, { headers })
      ]);

      if (tenantsRes.ok && statsRes.ok && usersRes.ok) {
        setTenants(await tenantsRes.json());
        setStats(await statsRes.json());
        setAllUsers(await usersRes.json());
      } else {
        console.error('[Dashboard] Erro ao buscar dados:', {
          tenants: tenantsRes.status,
          stats: statsRes.status,
          users: usersRes.status
        });
      }
    } catch (error) {
      console.error('Erro na requisição do dashboard:', error);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const isEditing = !!editingTenant;
      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/admin/tenants/${editingTenant.id}`
        : `${import.meta.env.VITE_API_URL}/admin/tenants`;

      const body = isEditing
        ? {
          name: formData.tenantName,
          cnpj: formData.tenantCnpj,
          logo_url: formData.logoUrl,
          company_color: formData.companyColor
        }
        : {
          tenantName: formData.tenantName,
          tenantCnpj: formData.tenantCnpj,
          logo_url: formData.logoUrl,
          company_color: formData.companyColor
        };

      const resp = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${getAuthToken()}` 
        },
        body: JSON.stringify(body)
      });

      if (resp.ok) {
        const data = await resp.json();
        if (!isEditing && data.inviteToken) {
          setGeneratedInvite(`${window.location.origin}/register-gestor?token=${data.inviteToken}`);
        } else {
          setIsModalOpen(false);
          setFormData(initialFormData);
        }
        fetchData();

      } else {
        const d = await resp.json();
        alert(d.error);
      }
    } catch (e) { alert('Erro'); } finally { setCreating(false); }
  };

  const handleCopyLink = (token?: string) => {
    const link = token
      ? `${window.location.origin}/register-gestor?token=${token}`
      : generatedInvite;

    if (link) {
      navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const generateAndCopyNewLink = async (tenantId: string) => {
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ tenantId })
      });
      if (resp.ok) {
        const d = await resp.json();
        const link = `${window.location.origin}/register-gestor?token=${d.inviteToken}`;
        navigator.clipboard.writeText(link);
        alert('Novo link de convite gerado e copiado!');
      }
    } catch (e) { alert('Erro ao gerar link'); }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta usina? Esta ação não pode ser desfeita.')) return;

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });

      if (resp.ok) {
        fetchData();
      } else {
        const d = await resp.json();
        alert(d.error);
      }
    } catch (e) { alert('Erro ao excluir'); }
  };

  const openEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setFormData({
      tenantName: t.name,
      tenantCnpj: t.cnpj,
      gestorEmail: '',
      gestorPassword: '',
      gestorFullName: '',
      logoUrl: t.logo_url || '',
      companyColor: t.company_color || '#001D4A'
    });
    setIsModalOpen(true);

  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cnpj.includes(searchTerm) ||
    t.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-brand antialiased text-navy flex">
      {/* Sidebar background with deep navy gradient */}
      <aside className={`bg-gradient-to-b from-[#001D4A] to-navy border-r border-white/5 shadow-xl transition-all duration-500 flex flex-col z-50 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-6 h-24 flex items-center gap-4 overflow-hidden border-b border-white/5">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
            <LayoutDashboard className="w-5 h-5 text-primary shadow-xl" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-white font-bold uppercase text-sm tracking-tighter">Unitraack Control</span>
              <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Global SaaS Infra</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 />} label="Início / Stats" collapsed={!isSidebarOpen} />
          <NavItem active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} icon={<Building2 />} label="Gerenciar Usinas" collapsed={!isSidebarOpen} />
          <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users />} label="Usuários Globais" collapsed={!isSidebarOpen} />
          <NavItem active={activeTab === 'monitoring'} onClick={() => setActiveTab('monitoring')} icon={<Activity />} label="Monitoramento" collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-white/5">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-lg transition-all cursor-default group/profile mb-2">
               <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-[10px] border border-primary/10 shrink-0">
                 {profile?.full_name ? profile.full_name[0] : 'A'}
               </div>
               <div className="flex flex-col overflow-hidden">
                 <p className="text-white/80 font-bold text-[10px] uppercase truncate leading-tight group-hover/profile:text-white transition-colors">
                   {profile?.full_name || 'Admin'}
                 </p>
                 <p className="text-[8px] text-primary font-bold uppercase tracking-widest opacity-50 group-hover/profile:opacity-100 transition-opacity truncate">
                   Global Controller
                 </p>
               </div>
            </div>
          )}
          
          <button 
            onClick={signOut} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all group ${!isSidebarOpen && 'justify-center focus:ring-2 focus:ring-red-400/20'}`}
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {isSidebarOpen && <span className="text-[9px] font-bold uppercase tracking-widest">Encerrar Sessão</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200/50 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex flex-col">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                {activeTab === 'dashboard' ? 'Infraestrutura' : activeTab === 'tenants' ? 'Unidades' : 'Auditoria'}
              </h2>
              <h3 className="text-sm font-bold text-navy uppercase tracking-tighter">
                {activeTab === 'dashboard' ? 'Overview Geral' : activeTab === 'tenants' ? 'Gestão de Usinas' : activeTab === 'users' ? 'Usuários Globais' : 'Logs de Sistema'}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Removidas informações do Admin Principal do cabeçalho conforme solicitação */}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 bg-[#F8FAFC] bg-industrial-grid relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none"></div>
          
          <div className="space-y-8 animate-in fade-in duration-500 relative z-10">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold text-navy uppercase tracking-tighter">Controle <span className="text-primary italic">Global</span></h1>
                    <p className="text-slate-400 font-medium">Métricas de performance de todas as unidades integradas.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Total de Usinas" value={stats?.totalTenants.toString() || '0'} icon={<Globe className="w-6 h-6" />} color="bg-primary/10 text-primary" />
                  <StatCard label="Usuários Totais" value={stats?.totalUsers.toString() || '0'} icon={<Users className="w-6 h-6" />} color="bg-blue-50 text-blue-600" />
                  <StatCard label="Requisições Ativas" value={stats?.totalRequests.toString() || '0'} icon={<BarChart3 className="w-6 h-6" />} color="bg-navy/5 text-navy" />
                </div>
              </div>
            )}

            {activeTab === 'tenants' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-primary rounded-full"></div>
                      <h1 className="text-4xl font-bold text-navy uppercase tracking-tighter">Gerenciar <span className="text-primary italic">Usinas</span></h1>
                    </div>
                    <p className="text-slate-400 font-medium ml-4 uppercase text-[10px] tracking-widest">Central de Controle de Unidades Federadas</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-3 bg-navy hover:bg-[#002880] text-white px-8 py-5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-navy/20 transition-all hover:-translate-y-1 active:scale-95 group"
                  >
                    <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Cadastrar Unidade
                  </button>
                </div>

              {/* Toolbar: Busca e Alternância de Visualização */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar por nome, CNPJ ou subdomínio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100/50 rounded-xl shadow-sm shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm font-bold text-navy placeholder-slate-300"
                  />
                </div>
              </div>

              {/* List View (Table) */}
              <div className="bg-white rounded-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] border border-slate-100/50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Unidade / Identidade</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Contrato</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Ativação</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Gestores</th>
                      <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Controle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTenants.map(t => (
                      <tr key={t.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-xl shadow-navy/10 transform transition-transform group-hover:rotate-6">
                              {t.name[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-navy text-sm uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors">{t.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-primary/70 font-bold lowercase tracking-widest">{t.subdomain}.localhost</span>
                                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                <span className="text-[10px] text-slate-300 font-bold tracking-widest">{t.cnpj}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-full border border-emerald-100 flex items-center gap-2 w-fit">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            Regularizado
                          </span>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 leading-none">Emissão</span>
                            <span className="text-[11px] font-bold text-navy">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-center">
                          <div className="inline-flex flex-col items-center justify-center px-4 py-2 bg-slate-50 rounded-xl min-w-[50px] border border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-all">
                            <span className="text-sm font-bold text-navy">{Number(t.gestores?.[0]?.count || 0)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            <ActionButton onClick={() => generateAndCopyNewLink(t.id)} icon={<Copy className="w-3.5 h-3.5" />} title="Gestor" color="text-slate-400 hover:text-navy hover:bg-slate-100" />
                            <ActionButton onClick={() => openEditModal(t)} icon={<Pencil className="w-3.5 h-3.5" />} title="Editar" color="text-slate-400 hover:text-primary hover:bg-primary/5" />
                            <ActionButton
                              onClick={() => {
                                const url = `${window.location.origin}/${t.subdomain}/login`;
                                navigator.clipboard.writeText(url);
                                alert('Portal copiado!');
                              }}
                              icon={<ExternalLink className="w-3.5 h-3.5" />}
                              title="Portal"
                              color="text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                            />
                            <ActionButton onClick={() => handleDeleteTenant(t.id)} icon={<Trash2 className="w-3.5 h-3.5" />} title="Excluir" color="text-slate-400 hover:text-red-500 hover:bg-red-50" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                    <h1 className="text-4xl font-bold text-navy uppercase tracking-tighter">Trilha de <span className="text-emerald-500 italic">Auditoria</span></h1>
                  </div>
                  <p className="text-slate-400 font-medium ml-4 uppercase text-[10px] tracking-widest">Rastreamento de movimentações e integridade de dados</p>
                </div>

                <div className="flex flex-col gap-2 min-w-[300px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Selecionar Unidade para Auditoria</label>
                  <select 
                    value={selectedMonitoringTenant}
                    onChange={(e) => setSelectedMonitoringTenant(e.target.value)}
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all text-xs font-bold text-navy uppercase tracking-tight appearance-none cursor-pointer"
                  >
                    <option value="">Selecione uma Usina...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!selectedMonitoringTenant ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                    <Search className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy uppercase tracking-tight">Aguardando Seleção</h3>
                    <p className="text-slate-400 max-w-md mx-auto text-sm mt-2 font-medium">
                      Selecione uma usina acima para carregar o histórico completo de movimentações, entradas e saídas.
                    </p>
                  </div>
                </div>
              ) : loadingLogs ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">Sincronizando base de dados...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy uppercase tracking-tight">Sem Movimentações</h3>
                    <p className="text-slate-400 max-w-md mx-auto text-sm mt-2 font-medium">
                      Nenhuma atividade suspeita ou movimentação de materiais foi registrada nesta unidade até o momento.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] border border-slate-100/50 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horário / Data</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ação / Material</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Fluxo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {Array.isArray(auditLogs) && auditLogs.map((log: any) => (
                        <tr key={log.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-navy">{new Date(log.moved_at).toLocaleTimeString('pt-BR')}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(log.moved_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-navy border border-slate-200 group-hover:bg-navy group-hover:text-white transition-all">
                                {log.actor?.full_name?.[0] || 'U'}
                              </div>
                              <span className="text-xs font-bold text-navy uppercase tracking-tight">{log.actor?.full_name || 'Usuário do Sistema'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-navy uppercase">{log.material?.name || 'Item não identificado'}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">De: {log.from_sector?.name || 'Origem'}</span>
                                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Para: {log.to_sector?.name || 'Destino'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase rounded-full border border-emerald-100">
                              Confirmado
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-primary rounded-full"></div>
                    <h1 className="text-4xl font-bold text-navy uppercase tracking-tighter">Auditoria de <span className="text-primary italic">Usuários</span></h1>
                  </div>
                  <p className="text-slate-400 font-medium ml-4 uppercase text-[10px] tracking-widest">Controle de acessos e identidade por unidade</p>
                </div>
              </div>

              {/* Grouping Logic */}
              {(() => {
                const groups = allUsers
                  .filter(u => u.id !== user?.id)
                  .reduce((acc, user) => {
                    const key = user.tenant?.id || 'global';
                    const name = user.tenant?.name || 'Sistema Global';
                    if (!acc[key]) acc[key] = { name, users: [] };
                    acc[key].users.push(user);
                    return acc;
                  }, {} as Record<string, { name: string, users: GlobalProfile[] }>);

                return (
                  <div className="space-y-4">
                    {Object.entries(groups).sort(([a], [b]) => a === 'global' ? -1 : b === 'global' ? 1 : 0).map(([id, group]) => {
                      const isExpanded = expandedTenants.includes(id);
                      return (
                        <div key={id} className="bg-white rounded-2xl shadow-sm border border-slate-100/50 overflow-hidden transition-all duration-300">
                          {/* Group Header */}
                          <button 
                            onClick={() => toggleTenant(id)}
                            className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${id === 'global' ? 'bg-navy text-white' : 'bg-primary/10 text-primary'}`}>
                                {id === 'global' ? <ShieldCheck className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                              </div>
                              <div className="text-left">
                                <h4 className="font-bold text-navy text-sm uppercase tracking-tight group-hover:text-primary transition-colors">
                                  {group.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                  {group.users.length} {group.users.length === 1 ? 'Usuário vinculado' : 'Usuários vinculados'}
                                </p>
                              </div>
                            </div>
                            <div className={`p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-primary transition-all ${isExpanded ? 'rotate-180 bg-primary/5 text-primary' : ''}`}>
                              <ChevronDown className="w-5 h-5" />
                            </div>
                          </button>

                          {/* Group Content (User Table) */}
                          {isExpanded && (
                            <div className="border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                              <table className="w-full text-left">
                                <thead className="bg-[#F8FAFC]">
                                  <tr>
                                    <th className="px-8 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Identidade</th>
                                    <th className="px-8 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Acesso</th>
                                    <th className="px-8 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Data de Registro</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {group.users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-navy border border-slate-200">
                                            {u.full_name?.[0] || '?'}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="font-bold text-navy text-xs uppercase">{u.full_name}</span>
                                            <span className="text-[9px] text-slate-400 font-medium lowercase">{u.email}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-8 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${
                                          u.role === 'SUPER_ADMIN' ? 'bg-navy/5 text-navy border-navy/10' :
                                          u.role === 'GESTOR_SEGURANCA' ? 'bg-primary/5 text-primary border-primary/10' :
                                          'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                          {u.role.replace('_', ' ')}
                                        </span>
                                      </td>
                                      <td className="px-8 py-4 text-right">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001D4A]/40 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-100">
            <div className="p-10 space-y-8">
              {generatedInvite ? (
                <div className="space-y-8 py-4 animate-in zoom-in-95 duration-300 text-center">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-navy uppercase tracking-tighter">Unidade Ativada!</h3>
                    <p className="text-slate-400 font-medium mt-2 px-8 text-sm">
                      A usina foi cadastrada. Agora, envie o link abaixo para o gestor responsável realizar o seu auto-cadastro.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Convite do Gestor</span>
                        <span className="text-[10px] font-bold text-navy truncate">{generatedInvite}</span>
                      </div>
                      <button
                        onClick={() => handleCopyLink()}
                        className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition-all ${copySuccess ? 'bg-green-500 text-white' : 'bg-navy text-white hover:bg-navy/80'}`}
                      >
                        {copySuccess ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Portal da Usina (Terceirizadas)</span>
                        <span className="text-[10px] font-bold text-primary truncate">
                          {window.location.origin}/{tenants.find(t => t.id === editingTenant?.id || t.name === formData.tenantName)?.subdomain || 'unidade'}/login
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const target = tenants.find(t => t.id === editingTenant?.id || t.name === formData.tenantName);
                          const sub = target?.subdomain || 'unidade';
                          navigator.clipboard.writeText(`${window.location.origin}/${sub}/login`);
                          alert('Link do Portal copiado!');
                        }}

                        className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-[10px] uppercase hover:bg-primary/80 transition-all"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setGeneratedInvite(null);
                      setFormData(initialFormData);
                    }}
                    className="w-full py-4 bg-slate-100 text-slate-500 font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col">
                      <h3 className="text-3xl font-bold text-navy uppercase tracking-tighter leading-none">
                        {editingTenant ? 'Editar' : 'Ativar'} <span className="text-primary italic">Unidade</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-1">Configuração de Infraestrutura</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingTenant(null);
                        setFormData(initialFormData);
                      }}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleCreateTenant} className="space-y-6">
                    <InputGroup label="Identificação da Usina" icon={<Building2 />} value={formData.tenantName} onChange={(v: any) => setFormData({ ...formData, tenantName: v })} placeholder="Ex: Lins Agro Unidade 02" />
                    <InputGroup label="CNPJ" icon={<ShieldCheck />} value={formData.tenantCnpj} onChange={(v: any) => setFormData({ ...formData, tenantCnpj: v })} placeholder="00.000.000/0000-00" />

                    <div className="grid grid-cols-2 gap-4">
                      <InputGroup label="URL do Logo" icon={<Globe />} value={formData.logoUrl} onChange={(v: any) => setFormData({ ...formData, logoUrl: v })} placeholder="https://..." />
                      <InputGroup label="Cor da Marca" icon={<div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: formData.companyColor }} />} value={formData.companyColor} onChange={(v: any) => setFormData({ ...formData, companyColor: v })} placeholder="#001D4A" />
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 mt-4">

                      <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Fluxo de Convite Ativado
                      </p>
                      <p className="text-[10px] text-blue-400 font-medium mt-1 leading-relaxed">
                        Por questões de segurança e LGPD, o gestor criará sua própria senha através de um link seguro gerado após a ativação.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={creating}
                      className="w-full py-5 bg-navy text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-xl shadow-navy/20 hover:bg-[#002880] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:translate-y-0 active:scale-95"
                    >
                      {creating ? <Loader2 className="animate-spin" /> : (editingTenant ? 'Salvar Configurações' : 'Confirmar & Gerar Acesso')}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

function NavItem({ active, onClick, icon, label, collapsed }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 relative group
        ${active
          ? 'bg-primary text-white shadow-[0_10px_20px_-5px_rgba(0,181,173,0.4)] translate-x-1'
          : 'text-white/40 hover:text-white/90 hover:bg-white/5'} 
        ${collapsed && 'justify-center'}
      `}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {!collapsed && <span className="text-[11px] font-bold uppercase tracking-widest leading-none">{label}</span>}
      {active && !collapsed && <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-7 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-white flex items-center justify-between group hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-transparent -mr-12 -mt-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="relative z-10">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-80">{label}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-4xl font-bold text-navy tracking-tighter">{value}</p>
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
        </div>
      </div>

      <div className={`p-5 rounded-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg ${color} relative z-10`}>
        {icon}
      </div>
    </div>
  );
}



interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  color: string;
}

function ActionButton({ onClick, icon, title, color }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${color}`}
    >
      {icon}
    </button>
  );
}

interface InputGroupProps {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
}

function InputGroup({ label, placeholder, type = "text", value, onChange, icon }: InputGroupProps) {
  return (
    <div className="space-y-2 w-full group">
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest leading-none">{label}</label>
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">{icon}</div>
        <input
          type={type}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-xl text-navy placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-sm shadow-inner"
        />
      </div>
    </div>
  );
}

