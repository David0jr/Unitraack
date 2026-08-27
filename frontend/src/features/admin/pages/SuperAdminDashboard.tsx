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
  Activity,
  User,
  Sparkles,
  Palette,
  Check
} from 'lucide-react';
import { MobileNav } from '../../requests/components/dashboard/MobileNav';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  cnpj: string;
  logo_url?: string;
  company_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
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
  const [copyPortalSuccess, setCopyPortalSuccess] = useState(false);
  const [expandedTenants, setExpandedTenants] = useState<string[]>([]);
  const [selectedMonitoringTenant, setSelectedMonitoringTenant] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
      setCurrentPage(1);
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
    companyColor: '#00B5AD',
    secondaryColor: '#1996DC',
    tertiaryColor: '#001D4A'
  };

  const [formData, setFormData] = useState(initialFormData);
  const [websiteInput, setWebsiteInput] = useState('');
  const [isExtractingBranding, setIsExtractingBranding] = useState(false);
  const [detectedPalette, setDetectedPalette] = useState<string[]>([]);
  const [activeColorSlot, setActiveColorSlot] = useState<'primary' | 'secondary' | 'tertiary'>('primary');
  const [extractionFeedback, setExtractionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAutoDetectBranding = async (urlToScan?: string) => {
    const url = (urlToScan || websiteInput || formData.logoUrl).trim();
    if (!url) {
      alert('Por favor, digite ou cole o link do site da usina (ex: https://cafealcool.com.br).');
      return;
    }

    setIsExtractingBranding(true);
    setExtractionFeedback(null);

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/admin/extract-branding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ url })
      });

      const res = await resp.json();
      if (resp.ok && res.success && res.data) {
        const { suggestedName, logoUrl, primaryColor, secondaryColor, tertiaryColor, palette } = res.data;

        setFormData(prev => ({
          ...prev,
          tenantName: prev.tenantName ? prev.tenantName : (suggestedName || prev.tenantName),
          logoUrl: logoUrl || prev.logoUrl,
          companyColor: primaryColor || prev.companyColor || '#00B5AD',
          secondaryColor: secondaryColor || prev.secondaryColor || '#1996DC',
          tertiaryColor: tertiaryColor || prev.tertiaryColor || '#001D4A'
        }));

        if (palette && palette.length > 0) {
          setDetectedPalette(palette);
        }

        setExtractionFeedback({
          type: 'success',
          message: `Identidade detectada com sucesso! 3 cores da paleta aplicadas.`
        });
      } else {
        setExtractionFeedback({
          type: 'error',
          message: res.error || 'Não foi possível extrair a identidade do site informado.'
        });
      }
    } catch (e: any) {
      setExtractionFeedback({
        type: 'error',
        message: 'Falha de conexão ao tentar escanear o site.'
      });
    } finally {
      setIsExtractingBranding(false);
    }
  };


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
          company_color: formData.companyColor,
          secondary_color: formData.secondaryColor,
          tertiary_color: formData.tertiaryColor
        }
        : {
          tenantName: formData.tenantName,
          tenantCnpj: formData.tenantCnpj,
          logo_url: formData.logoUrl,
          company_color: formData.companyColor,
          secondary_color: formData.secondaryColor,
          tertiary_color: formData.tertiaryColor
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
      companyColor: t.company_color || '#00B5AD',
      secondaryColor: t.secondary_color || '#1996DC',
      tertiaryColor: t.tertiary_color || '#001D4A'
    });
    setWebsiteInput('');
    setDetectedPalette([]);
    setExtractionFeedback(null);
    setIsModalOpen(true);
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cnpj.includes(searchTerm) ||
    t.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-brand antialiased text-navy flex flex-col lg:flex-row">
      {/* Sidebar background with deep navy gradient - Hidden on mobile */}
      <aside className={`bg-gradient-to-b from-[#001D4A] to-navy border-r border-white/5 shadow-xl transition-all duration-500 hidden lg:flex flex-col z-50 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
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
          <div className="flex items-center gap-3 lg:gap-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all active:scale-95 hidden lg:block"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden w-10 h-10 bg-[#001D4A] rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>
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
            <div className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
               <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-[8px] border border-primary/20">
                 {profile?.full_name ? profile.full_name[0] : 'A'}
               </div>
               <span className="text-[10px] font-bold text-navy truncate max-w-[80px]">
                 {profile?.full_name?.split(' ')[0] || 'Admin'}
               </span>
            </div>
            <button 
              onClick={signOut}
              className="flex items-center justify-center h-8 w-8 bg-rose-50 text-rose-500 rounded-full border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm group"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-12 bg-[#F8FAFC] bg-industrial-grid relative pb-32 md:pb-12">
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
                    onClick={() => {
                      setEditingTenant(null);
                      setFormData(initialFormData);
                      setWebsiteInput('');
                      setDetectedPalette([]);
                      setExtractionFeedback(null);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-3 bg-navy hover:bg-[#002880] text-white px-8 py-5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-navy/20 transition-all hover:-translate-y-1 active:scale-95 group cursor-pointer"
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

              {/* List View (Table) - Scrollable on mobile */}
              <div className="bg-white rounded-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] border border-slate-100/50 overflow-x-auto">
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
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-xl shadow-navy/10 transform transition-transform group-hover:rotate-6 overflow-hidden border border-white/20 shrink-0"
                              style={{ backgroundColor: t.tertiary_color || t.company_color || '#001D4A' }}
                            >
                              {t.logo_url ? (
                                <img src={t.logo_url} alt={t.name} className="w-full h-full object-contain p-1.5" onError={(e: any) => e.target.style.display = 'none'} />
                              ) : (
                                t.name[0]
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-navy text-sm uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors">{t.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-primary/70 font-bold lowercase tracking-widest">{t.subdomain}.localhost</span>
                                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                <span className="text-[10px] text-slate-300 font-bold tracking-widest">{t.cnpj}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="w-2.5 h-2.5 rounded-full shadow-sm border border-white/50" style={{ backgroundColor: t.company_color || '#00B5AD' }} title="Cor Primária" />
                                <span className="w-2.5 h-2.5 rounded-full shadow-sm border border-white/50" style={{ backgroundColor: t.secondary_color || '#1996DC' }} title="Cor Secundária" />
                                <span className="w-2.5 h-2.5 rounded-full shadow-sm border border-white/50" style={{ backgroundColor: t.tertiary_color || '#001D4A' }} title="Cor Terciária / Base" />
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
                          <div className="flex items-center justify-end gap-1 transition-all duration-300">
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
                <div className="bg-white rounded-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] border border-slate-100/50 overflow-x-auto">
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
                      {Array.isArray(auditLogs) && auditLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log: any) => (
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
                  {Math.ceil(auditLogs.length / itemsPerPage) > 1 && (
                    <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-white rounded-b-2xl">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-navy hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        Anterior
                      </button>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Página {currentPage} de {Math.ceil(auditLogs.length / itemsPerPage)}
                      </span>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(auditLogs.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(auditLogs.length / itemsPerPage)}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-navy hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
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

                          {/* Group Content (User Table) - Scrollable on mobile */}
                          {isExpanded && (
                            <div className="border-t border-slate-50 animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
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
        <div 
          onClick={() => { 
            setIsModalOpen(false); 
            setEditingTenant(null); 
            setFormData(initialFormData); 
            setGeneratedInvite(null); 
          }} 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#001D4A]/40 backdrop-blur-sm animate-in fade-in duration-500 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-xl rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-y-auto max-h-[90vh] border border-slate-100 cursor-default"
          >
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
                    <div className="flex items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                      <div className="flex flex-col text-left min-w-0 flex-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Convite do Gestor</span>
                        <span className="text-[10px] font-bold text-navy truncate block" title={generatedInvite || ''}>
                          {generatedInvite}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyLink()}
                        className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase transition-all flex items-center gap-1.5 shadow-sm ${
                          copySuccess ? 'bg-emerald-500 text-white' : 'bg-navy text-white hover:bg-navy/80 active:scale-95'
                        }`}
                      >
                        {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copySuccess ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                      <div className="flex flex-col text-left min-w-0 flex-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Portal da Usina (Terceirizadas)</span>
                        <span className="text-[10px] font-bold text-primary truncate block">
                          {window.location.origin}/{tenants.find(t => t.id === editingTenant?.id || t.name === formData.tenantName)?.subdomain || 'unidade'}/login
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const target = tenants.find(t => t.id === editingTenant?.id || t.name === formData.tenantName);
                          const sub = target?.subdomain || 'unidade';
                          const portalUrl = `${window.location.origin}/${sub}/login`;
                          navigator.clipboard.writeText(portalUrl);
                          setCopyPortalSuccess(true);
                          setTimeout(() => setCopyPortalSuccess(false), 2000);
                        }}
                        className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase transition-all flex items-center gap-1.5 shadow-sm ${
                          copyPortalSuccess ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/80 active:scale-95'
                        }`}
                      >
                        {copyPortalSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copyPortalSuccess ? 'Copiado!' : 'Copiar'}
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
                        setWebsiteInput('');
                        setDetectedPalette([]);
                        setExtractionFeedback(null);
                      }}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Bloco de Auto-Detecção / Scraping */}
                  <div className="bg-gradient-to-r from-primary/10 via-blue-50/50 to-emerald-50/30 p-4 rounded-2xl border border-primary/20 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        Auto-Detectar Marca & Cores
                      </div>
                      {extractionFeedback && (
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                          extractionFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {extractionFeedback.message}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          placeholder="Cole a URL do site (ex: https://cafealcool.com.br)"
                          value={websiteInput}
                          onChange={e => setWebsiteInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAutoDetectBranding();
                            }
                          }}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-navy placeholder:text-slate-300 focus:outline-none focus:border-primary transition-all shadow-sm"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAutoDetectBranding()}
                        disabled={isExtractingBranding || !websiteInput.trim()}
                        className="px-5 py-3 bg-primary hover:bg-[#009e96] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-md shadow-primary/20 active:scale-95 cursor-pointer"
                      >
                        {isExtractingBranding ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Lendo Site...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Escanear
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleCreateTenant} className="space-y-6">
                    <InputGroup label="Identificação da Usina" icon={<Building2 />} value={formData.tenantName} onChange={(v: any) => setFormData({ ...formData, tenantName: v })} placeholder="Ex: Lins Agro Unidade 02" />
                    <InputGroup label="CNPJ" icon={<ShieldCheck />} value={formData.tenantCnpj} onChange={(v: any) => setFormData({ ...formData, tenantCnpj: v })} placeholder="00.000.000/0000-00" />

                    {/* URL do Logo */}
                    <div className="space-y-2 w-full group">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest leading-none">URL do Logo</label>
                      <div className="relative">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-4 h-4" />
                        <input
                          type="text"
                          value={formData.logoUrl}
                          onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                          placeholder="https://exemplo.com/logo.png"
                          className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-xl text-navy placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-sm shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Bloco de Tríade de Cores */}
                    <div className="space-y-3 p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                          <Palette className="w-4 h-4 text-primary" />
                          Tríade de Cores da Usina (Identidade Visual)
                        </label>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">3 Cores Oficiais</span>
                      </div>

                      {/* 3 Color Pickers */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Cor Primária */}
                        <div 
                          onClick={() => setActiveColorSlot('primary')}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            activeColorSlot === 'primary' ? 'bg-white border-primary shadow-md ring-2 ring-primary/20' : 'bg-white/60 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">1. Primária</span>
                            {activeColorSlot === 'primary' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="relative cursor-pointer shrink-0">
                              <input 
                                type="color" 
                                value={formData.companyColor || '#00B5AD'} 
                                onChange={e => setFormData({ ...formData, companyColor: e.target.value })} 
                                className="sr-only" 
                              />
                              <div 
                                className="w-9 h-9 rounded-lg border border-white/60 shadow-sm flex items-center justify-center transition-transform hover:scale-105"
                                style={{ backgroundColor: formData.companyColor || '#00B5AD' }}
                              />
                            </label>
                            <input
                              type="text"
                              value={formData.companyColor}
                              onChange={e => setFormData({ ...formData, companyColor: e.target.value })}
                              placeholder="#00B5AD"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-navy font-mono font-bold text-xs focus:outline-none focus:border-primary uppercase"
                            />
                          </div>
                          <p className="text-[8px] text-slate-400 font-medium mt-1">Botões de ação e destaques</p>
                        </div>

                        {/* Cor Secundária */}
                        <div 
                          onClick={() => setActiveColorSlot('secondary')}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            activeColorSlot === 'secondary' ? 'bg-white border-primary shadow-md ring-2 ring-primary/20' : 'bg-white/60 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">2. Secundária</span>
                            {activeColorSlot === 'secondary' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="relative cursor-pointer shrink-0">
                              <input 
                                type="color" 
                                value={formData.secondaryColor || '#1996DC'} 
                                onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })} 
                                className="sr-only" 
                              />
                              <div 
                                className="w-9 h-9 rounded-lg border border-white/60 shadow-sm flex items-center justify-center transition-transform hover:scale-105"
                                style={{ backgroundColor: formData.secondaryColor || '#1996DC' }}
                              />
                            </label>
                            <input
                              type="text"
                              value={formData.secondaryColor}
                              onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                              placeholder="#1996DC"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-navy font-mono font-bold text-xs focus:outline-none focus:border-primary uppercase"
                            />
                          </div>
                          <p className="text-[8px] text-slate-400 font-medium mt-1">Gradientes, badges e acentos</p>
                        </div>

                        {/* Cor Terciária / Base */}
                        <div 
                          onClick={() => setActiveColorSlot('tertiary')}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            activeColorSlot === 'tertiary' ? 'bg-white border-primary shadow-md ring-2 ring-primary/20' : 'bg-white/60 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">3. Base / Escura</span>
                            {activeColorSlot === 'tertiary' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="relative cursor-pointer shrink-0">
                              <input 
                                type="color" 
                                value={formData.tertiaryColor || '#001D4A'} 
                                onChange={e => setFormData({ ...formData, tertiaryColor: e.target.value })} 
                                className="sr-only" 
                              />
                              <div 
                                className="w-9 h-9 rounded-lg border border-white/60 shadow-sm flex items-center justify-center transition-transform hover:scale-105"
                                style={{ backgroundColor: formData.tertiaryColor || '#001D4A' }}
                              />
                            </label>
                            <input
                              type="text"
                              value={formData.tertiaryColor}
                              onChange={e => setFormData({ ...formData, tertiaryColor: e.target.value })}
                              placeholder="#001D4A"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-navy font-mono font-bold text-xs focus:outline-none focus:border-primary uppercase"
                            />
                          </div>
                          <p className="text-[8px] text-slate-400 font-medium mt-1">Hero do login, topbar e contraste</p>
                        </div>
                      </div>

                      {/* Paleta Completa Extraída */}
                      {detectedPalette.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mr-1">
                            Paleta Detectada (clique para aplicar em {activeColorSlot === 'primary' ? '1. Primária' : activeColorSlot === 'secondary' ? '2. Secundária' : '3. Base'}):
                          </span>
                          {detectedPalette.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                if (activeColorSlot === 'primary') setFormData({ ...formData, companyColor: c });
                                else if (activeColorSlot === 'secondary') setFormData({ ...formData, secondaryColor: c });
                                else setFormData({ ...formData, tertiaryColor: c });
                              }}
                              className="w-7 h-7 rounded-lg transition-transform hover:scale-110 shadow-sm border border-slate-300 relative group cursor-pointer"
                              style={{ backgroundColor: c }}
                              title={`Aplicar ${c} ao slot ativo`}
                            >
                              <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-navy text-white text-[8px] font-mono rounded pointer-events-none shadow-sm">
                                {c}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preview da Identidade Visual com as 3 Cores */}
                    {(formData.logoUrl || formData.companyColor) && (
                      <div 
                        className="p-5 rounded-2xl border border-white/20 shadow-lg text-white relative overflow-hidden transition-all duration-500"
                        style={{ backgroundColor: formData.tertiaryColor || '#001D4A' }}
                      >
                        {/* Gradiente decorativo combinando as 3 cores */}
                        <div 
                          className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-2xl opacity-40 pointer-events-none"
                          style={{ backgroundColor: formData.companyColor || '#00B5AD' }}
                        />
                        <div 
                          className="absolute right-20 -bottom-10 w-40 h-40 rounded-full blur-2xl opacity-30 pointer-events-none"
                          style={{ backgroundColor: formData.secondaryColor || '#1996DC' }}
                        />

                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Prévia da Identidade Visual (3 Cores)</p>
                            <span 
                              className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: formData.secondaryColor || '#1996DC' }}
                            >
                              Portal da Usina
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center shadow-inner border border-white/20 shrink-0">
                              {formData.logoUrl ? (
                                <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" onError={(e: any) => e.target.style.display = 'none'} />
                              ) : (
                                <span className="text-xl font-black text-white">{formData.tenantName?.[0] || 'U'}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white uppercase tracking-tight truncate">{formData.tenantName || 'Nome da Usina'}</h4>
                              <p className="text-[10px] text-white/60 font-medium">Visual exibido na tela de login, painéis e portaria</p>
                            </div>
                          </div>

                          {/* Chips das 3 cores */}
                          <div className="pt-3 border-t border-white/10 flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: formData.companyColor || '#00B5AD' }} />
                              <span className="text-[9px] font-mono font-bold text-white/90">Primária: {formData.companyColor || '#00B5AD'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: formData.secondaryColor || '#1996DC' }} />
                              <span className="text-[9px] font-mono font-bold text-white/90">Secundária: {formData.secondaryColor || '#1996DC'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: formData.tertiaryColor || '#001D4A' }} />
                              <span className="text-[9px] font-mono font-bold text-white/90">Base: {formData.tertiaryColor || '#001D4A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

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
                      className="w-full py-5 bg-navy text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-xl shadow-navy/20 hover:bg-[#002880] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:translate-y-0 active:scale-95 cursor-pointer"
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
      <MobileNav 
        activeSection={activeTab} 
        setActiveSection={(s) => setActiveTab(s as any)} 
        items={[
          { id: 'dashboard', label: 'Início', icon: <BarChart3 /> },
          { id: 'tenants', label: 'Usinas', icon: <Building2 /> },
          { id: 'users', label: 'Usuários', icon: <Users /> },
          { id: 'monitoring', label: 'Rastro', icon: <Activity /> },
        ]} 
      />
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

