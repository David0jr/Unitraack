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
  ChevronLeft,
  ArrowLeft,
  Activity,
  User,
  Sparkles,
  Palette,
  Check,
  Power,
  PowerOff,
  UserCheck,
  UserX,
  Briefcase,
  ShieldAlert,
  SlidersHorizontal,
  Mail,
  Phone,
  FileText,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import { MobileNav } from '../../requests/components/dashboard/MobileNav';
import { NotificationDropdown } from '../../requests/components/dashboard/NotificationDropdown';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  cnpj: string;
  logo_url?: string;
  company_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
  active?: boolean;
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
  sector?: string;
  cnpj?: string;
  representative_name?: string;
  phone?: string;
  registration_number?: string;
  is_active?: boolean;
  created_at: string;
  tenant?: {
    id: string;
    name: string;
    subdomain?: string;
    active?: boolean;
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

  // Filtros & Estado para Gerenciamento de Usuários
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserTenantId, setSelectedUserTenantId] = useState<string>('');
  const [userCategoryFilter, setUserCategoryFilter] = useState<'all' | 'internal' | 'terceirizada'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingTenantId, setUpdatingTenantId] = useState<string | null>(null);

  // Estados para Modais Personalizados do Sistema (Substituindo alertas nativos do navegador)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'success' | 'primary';
    icon?: 'power-off' | 'power' | 'trash' | 'user-x' | 'user-check';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [infoDialog, setInfoDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    copyableText?: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [dialogLoading, setDialogLoading] = useState(false);
  const [infoCopySuccess, setInfoCopySuccess] = useState(false);

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
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
      setInfoDialog({
        isOpen: true,
        title: 'URL Necessária',
        message: 'Por favor, digite ou cole o link do site da usina (ex: https://usinalins.com.br) para realizar o escaneamento automático de identidade visual.',
        type: 'info'
      });
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
        const loadedTenants = await tenantsRes.json();
        setTenants(loadedTenants);
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

  const handleToggleTenantStatus = (tenantId: string, currentActive: boolean) => {
    const targetTenant = tenants.find(t => t.id === tenantId);
    const nextStatus = !currentActive;

    setConfirmDialog({
      isOpen: true,
      title: currentActive ? 'Desativar Acesso da Usina' : 'Reativar Acesso da Usina',
      message: currentActive
        ? `Deseja realmente desativar o acesso da "${targetTenant?.name || 'Usina'}"?`
        : `Deseja reativar o acesso da "${targetTenant?.name || 'Usina'}"?`,
      subMessage: currentActive
        ? 'Nenhum dado será apagado. Colaboradores e gestores receberão o aviso "Sistema temporariamente desativado" ao tentarem acessar o portal.'
        : 'O portal voltará a ficar disponível imediatamente para todos os gestores, colaboradores e empresas credenciadas.',
      confirmText: currentActive ? 'Sim, Desativar' : 'Sim, Reativar',
      cancelText: 'Cancelar',
      variant: currentActive ? 'warning' : 'success',
      icon: currentActive ? 'power-off' : 'power',
      onConfirm: async () => {
        setDialogLoading(true);
        setUpdatingTenantId(tenantId);
        try {
          const resp = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants/${tenantId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ active: nextStatus })
          });

          const d = await resp.json();
          if (resp.ok) {
            setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, active: nextStatus } : t));
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            setInfoDialog({
              isOpen: true,
              title: nextStatus ? 'Usina Reativada!' : 'Usina Desativada!',
              message: `O status da unidade "${targetTenant?.name || 'Usina'}" foi alterado para ${nextStatus ? 'Ativa' : 'Desativada'} com sucesso.`,
              type: nextStatus ? 'success' : 'warning'
            });
          } else {
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            setInfoDialog({
              isOpen: true,
              title: 'Erro na Operação',
              message: d.error || 'Erro ao alterar status da usina.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error('Erro ao alternar status da usina:', err);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          setInfoDialog({
            isOpen: true,
            title: 'Erro de Conexão',
            message: 'Erro de conexão com o servidor ao tentar alterar o status da usina.',
            type: 'error'
          });
        } finally {
          setDialogLoading(false);
          setUpdatingTenantId(null);
        }
      }
    });
  };

  const handleToggleUserStatus = (userId: string, currentActive: boolean) => {
    const targetUser = allUsers.find(u => u.id === userId);
    const nextStatus = !currentActive;

    if (userId === user?.id && !nextStatus) {
      setInfoDialog({
        isOpen: true,
        title: 'Ação Bloqueada',
        message: 'Você não pode desativar seu próprio acesso de Super Administrador.',
        type: 'warning'
      });
      return;
    }

    const isTerceirizada = targetUser?.role === 'TERCEIRIZADA';
    const entityLabel = isTerceirizada ? 'a empresa terceirizada' : 'o colaborador';

    setConfirmDialog({
      isOpen: true,
      title: nextStatus ? `Reativar ${isTerceirizada ? 'Empresa' : 'Colaborador'}` : `Desativar ${isTerceirizada ? 'Empresa' : 'Colaborador'}`,
      message: nextStatus
        ? `Deseja reativar o acesso de "${targetUser?.full_name || 'Usuário'}"?`
        : `Deseja realmente desativar o acesso de "${targetUser?.full_name || 'Usuário'}"?`,
      subMessage: nextStatus
        ? 'O acesso ao sistema será restabelecido imediatamente.'
        : `Ao ser desativado, ${entityLabel} não conseguirá realizar login até que seu status seja reativado pela administração.`,
      confirmText: nextStatus ? 'Sim, Reativar' : 'Sim, Desativar',
      cancelText: 'Cancelar',
      variant: nextStatus ? 'success' : 'warning',
      icon: nextStatus ? 'user-check' : 'user-x',
      onConfirm: async () => {
        setDialogLoading(true);
        setUpdatingUserId(userId);
        try {
          const resp = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ is_active: nextStatus })
          });

          const d = await resp.json();
          if (resp.ok) {
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: nextStatus } : u));
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            setInfoDialog({
              isOpen: true,
              title: nextStatus ? 'Acesso Reativado!' : 'Acesso Desativado!',
              message: `O acesso de "${targetUser?.full_name}" foi ${nextStatus ? 'reativado' : 'desativado'} com sucesso.`,
              type: nextStatus ? 'success' : 'warning'
            });
          } else {
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            setInfoDialog({
              isOpen: true,
              title: 'Erro na Operação',
              message: d.error || 'Erro ao alterar status do usuário.',
              type: 'error'
            });
          }
        } catch (err) {
          console.error('Erro ao alternar status do usuário:', err);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          setInfoDialog({
            isOpen: true,
            title: 'Erro de Conexão',
            message: 'Erro de conexão com o servidor ao tentar alterar o status do usuário.',
            type: 'error'
          });
        } finally {
          setDialogLoading(false);
          setUpdatingUserId(null);
        }
      }
    });
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
          setInfoDialog({
            isOpen: true,
            title: isEditing ? 'Usina Atualizada!' : 'Usina Cadastrada!',
            message: isEditing ? 'Os dados da unidade foram atualizados com sucesso.' : 'A nova unidade industrial foi cadastrada no sistema.',
            type: 'success'
          });
        }
        fetchData();

      } else {
        const d = await resp.json();
        setInfoDialog({
          isOpen: true,
          title: 'Erro ao Salvar Usina',
          message: d.error || 'Ocorreu um erro ao salvar a usina.',
          type: 'error'
        });
      }
    } catch (e) {
      setInfoDialog({
        isOpen: true,
        title: 'Erro de Conexão',
        message: 'Erro ao comunicar com o servidor para salvar a usina.',
        type: 'error'
      });
    } finally { setCreating(false); }
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
    const tenant = tenants.find(t => t.id === tenantId);
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
        setInfoDialog({
          isOpen: true,
          title: 'Convite Gerado & Copiado!',
          message: `O link de auto-cadastro para o Gestor de Segurança da "${tenant?.name || 'Usina'}" foi gerado e copiado para sua área de transferência com sucesso!`,
          copyableText: link,
          type: 'success'
        });
      } else {
        const d = await resp.json();
        setInfoDialog({
          isOpen: true,
          title: 'Erro ao Gerar Convite',
          message: d.error || 'Não foi possível gerar o link de convite.',
          type: 'error'
        });
      }
    } catch (e) {
      setInfoDialog({
        isOpen: true,
        title: 'Erro de Conexão',
        message: 'Erro ao conectar ao servidor para gerar o convite.',
        type: 'error'
      });
    }
  };

  const handleDeleteTenant = (id: string) => {
    const target = tenants.find(t => t.id === id);

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Unidade Industrial',
      message: `Tem certeza que deseja excluir definitivamente a usina "${target?.name || 'Unidade'}"?`,
      subMessage: 'Esta ação não pode ser desfeita. Se houver usuários ou histórico vinculado, a exclusão será bloqueada para preservar o histórico.',
      confirmText: 'Sim, Excluir Unidade',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        setDialogLoading(true);
        try {
          const resp = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
          });

          if (resp.ok) {
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            setInfoDialog({
              isOpen: true,
              title: 'Usina Excluída!',
              message: `A usina "${target?.name || 'Unidade'}" foi excluída com sucesso.`,
              type: 'success'
            });
            fetchData();
          } else {
            const d = await resp.json();
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            setInfoDialog({
              isOpen: true,
              title: 'Não Foi Possível Excluir',
              message: d.error || 'Erro ao excluir unidade.',
              type: 'error'
            });
          }
        } catch (e) {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          setInfoDialog({
            isOpen: true,
            title: 'Erro de Conexão',
            message: 'Erro ao tentar conectar ao servidor para excluir usina.',
            type: 'error'
          });
        } finally {
          setDialogLoading(false);
        }
      }
    });
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

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard /> },
    { id: 'tenants', label: 'Usinas', icon: <Building2 /> },
    { id: 'users', label: 'Usuários', icon: <Users /> },
    { id: 'monitoring', label: 'Auditoria', icon: <BarChart3 /> },
  ];

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Início / Painel';
      case 'tenants':
        return 'Gerenciar Usinas · Unidades Federadas';
      case 'users':
        return 'Gerenciamento de Usuários · Acessos e Permissões';
      case 'monitoring':
        return 'Auditoria & Rastro Global';
      default:
        return 'Painel de Controle';
    }
  };

  const userInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'D';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] flex-col lg:flex-row font-brand antialiased text-navy">
      {/* Sidebar background with deep navy - Exactly matching Gestor Dashboard */}
      <aside className={`hidden lg:flex ${isSidebarOpen ? 'w-60' : 'w-20'} bg-navy flex-col shrink-0 border-r border-white/10 shadow-2xl z-50 select-none relative transition-all duration-300 ease-in-out`}>
        {/* Botão de Recolher / Expandir Menu */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-5 w-7 h-7 bg-white border border-slate-200/80 rounded-full shadow-md flex items-center justify-center text-slate-600 hover:text-navy hover:scale-105 transition-all z-50 cursor-pointer"
          title={isSidebarOpen ? "Recolher menu" : "Expandir menu"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
        </button>

        {/* Topo / Logo */}
        <div className={`px-4 h-16 flex items-center ${!isSidebarOpen ? 'justify-center' : 'gap-3'} border-b border-white/10 shrink-0 overflow-hidden`}>
          {!isSidebarOpen ? (
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-primary/30">
              <LayoutDashboard className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-primary/30">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-sm tracking-tight">Unitraack</span>
                <span className="text-[10px] text-primary font-semibold tracking-wider uppercase mt-0.5">Global Admin</span>
              </div>
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-[18px] h-[18px] shrink-0" />} 
            label="Início / Painel" 
            isCollapsed={!isSidebarOpen} 
          />
          <NavButton 
            active={activeTab === 'tenants'} 
            onClick={() => setActiveTab('tenants')} 
            icon={<Building2 className="w-[18px] h-[18px] shrink-0" />} 
            label="Gerenciar Usinas" 
            isCollapsed={!isSidebarOpen} 
          />
          <NavButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={<Users className="w-[18px] h-[18px] shrink-0" />} 
            label="Gerenciamento de Usuários" 
            isCollapsed={!isSidebarOpen} 
          />
          <NavButton 
            active={activeTab === 'monitoring'} 
            onClick={() => setActiveTab('monitoring')} 
            icon={<BarChart3 className="w-[18px] h-[18px] shrink-0" />} 
            label="Auditoria & Rastro" 
            isCollapsed={!isSidebarOpen} 
          />
        </nav>

        {/* Rodapé: Encerramento de Sessão */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <button 
            onClick={signOut} 
            title={!isSidebarOpen ? "Encerrar Sessão" : undefined}
            className={`w-full flex items-center ${!isSidebarOpen ? 'justify-center p-2.5' : 'gap-2.5 px-3.5 py-2.5'} rounded-xl text-white/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-medium cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Encerrar Sessão</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-6 md:px-10 flex items-center justify-between sticky top-0 z-40 shadow-xs select-none">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-navy tracking-tight">
              {getHeaderTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Perfil do Usuário à esquerda */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {userInitial}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-navy truncate max-w-[160px]">
                  {profile?.full_name || 'David Silva (Owner)'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]">
                  Super Administrador
                </span>
              </div>
            </div>

            {/* Barrinha divisora */}
            <div className="h-6 w-px bg-slate-200"></div>

            {/* Ícone de notificação */}
            <NotificationDropdown />

            {/* Botão de sair */}
            <button 
              onClick={signOut}
              className="flex items-center justify-center h-8 w-8 bg-rose-50 text-rose-500 rounded-full border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-xs group cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 pb-24 lg:pb-12 bg-[#F8FAFC]">
          <div className="space-y-8 animate-in fade-in duration-500">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* 3 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-5 mb-8">
                  <StatCard 
                    label="Usinas Integradas" 
                    value={stats?.totalTenants.toString() || '0'} 
                    icon={<Building2 className="w-5 h-5" />}
                    color="bg-sky-50 text-sky-600 border border-sky-100/80"
                  />
                  <StatCard 
                    label="Usuários no SaaS" 
                    value={stats?.totalUsers.toString() || '0'} 
                    icon={<Users className="w-5 h-5" />}
                    color="bg-emerald-50 text-emerald-600 border border-emerald-100/80"
                  />
                  <StatCard 
                    label="Requisições Ativas" 
                    value={stats?.totalRequests.toString() || '0'} 
                    icon={<BarChart3 className="w-5 h-5" />}
                    color="bg-amber-50 text-amber-600 border border-amber-100/80"
                  />
                </div>

                {/* Seção de Usinas - Visualização Pura de Informações */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-navy text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span>Unidades Industriais Integradas</span>
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200/80 px-3 py-1 rounded-xl shadow-xs">
                        {tenants.length} {tenants.length === 1 ? 'registro' : 'registros'}
                      </span>
                    </div>
                  </div>

                  {tenants.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                      <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-navy">Nenhuma usina cadastrada</p>
                      <p className="text-xs text-slate-400 mt-1">Acesse a aba "Gerenciar Usinas" no menu lateral para cadastrar e gerenciar unidades.</p>
                    </div>
                  ) : (
                    tenants.map(t => (
                      <div 
                        key={t.id} 
                        className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all"
                      >
                        <div className="w-full">
                          <div className="flex items-center gap-3 mb-4">
                            <div 
                              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-xs overflow-hidden shrink-0"
                              style={{ backgroundColor: t.tertiary_color || t.company_color || '#001D4A' }}
                            >
                              {t.logo_url ? (
                                <img src={t.logo_url} alt={t.name} className="w-full h-full object-contain p-1.5" onError={(e: any) => e.target.style.display = 'none'} />
                              ) : (
                                t.name[0]
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5">
                                <h4 className="font-bold text-navy text-sm">{t.name}</h4>
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Regularizado
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {t.cnpj}
                              </p>
                            </div>
                          </div>

                          {/* Grid de Informações idêntico ao Gestor */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <p className="text-[10px] text-slate-400 font-medium">Subdomínio / Link</p>
                              <p className="text-xs font-semibold text-navy mt-0.5 truncate">{t.subdomain}.localhost</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <p className="text-[10px] text-slate-400 font-medium">Gestores / Emissão</p>
                              <p className="text-xs font-semibold text-navy mt-0.5">
                                {Number(t.gestores?.[0]?.count || 0)} gestor(es) · {new Date(t.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
                              <p className="text-[10px] text-slate-400 font-medium mb-1">Paleta Visual</p>
                              <div className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-full shadow-xs border border-white" style={{ backgroundColor: t.company_color || '#00B5AD' }} title="Primária" />
                                <span className="w-3.5 h-3.5 rounded-full shadow-xs border border-white" style={{ backgroundColor: t.secondary_color || '#1996DC' }} title="Secundária" />
                                <span className="w-3.5 h-3.5 rounded-full shadow-xs border border-white" style={{ backgroundColor: t.tertiary_color || '#001D4A' }} title="Terciária" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tenants' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-navy">Gerenciar Usinas</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Central de controle, edição e cadastramento de unidades federadas.</p>
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
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer w-fit"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Cadastrar Unidade</span>
                  </button>
                </div>

                {/* Toolbar: Busca & Alternador de Modo de Visualização */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative w-full max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar por nome, CNPJ ou subdomínio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl shadow-xs text-xs font-medium text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs self-end sm:self-auto">
                    {filteredTenants.length} {filteredTenants.length === 1 ? 'usina' : 'usinas'}
                  </span>
                </div>

                {filteredTenants.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-navy">Nenhuma usina encontrada</p>
                    <p className="text-xs text-slate-400 mt-1">Tente ajustar os termos de busca ou clique em "Cadastrar Unidade" para adicionar uma nova.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTenants.map(t => (
                      <div 
                        key={t.id} 
                        className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                          <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-4">
                              <div 
                                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-xs overflow-hidden shrink-0"
                                style={{ backgroundColor: t.tertiary_color || t.company_color || '#001D4A' }}
                              >
                                {t.logo_url ? (
                                  <img src={t.logo_url} alt={t.name} className="w-full h-full object-contain p-1.5" onError={(e: any) => e.target.style.display = 'none'} />
                                ) : (
                                  t.name[0]
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h4 className="font-bold text-navy text-sm">{t.name}</h4>
                                  {t.active !== false ? (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      Ativa / Regularizada
                                    </span>
                                  ) : (
                                    <span className="bg-amber-50 text-amber-800 border border-amber-300 rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      Temporariamente Desativada
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                  {t.cnpj}
                                </p>
                              </div>
                            </div>

                            {/* Grid de Informações completas */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-medium">Subdomínio / Link</p>
                                <p className="text-xs font-semibold text-navy mt-0.5 truncate">{t.subdomain}.localhost</p>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-medium">Gestores / Emissão</p>
                                <p className="text-xs font-semibold text-navy mt-0.5">
                                  {Number(t.gestores?.[0]?.count || 0)} gestor(es) · {new Date(t.created_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400 font-medium mb-1">Paleta Visual</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-3.5 h-3.5 rounded-full shadow-xs border border-white" style={{ backgroundColor: t.company_color || '#00B5AD' }} title="Primária" />
                                  <span className="w-3.5 h-3.5 rounded-full shadow-xs border border-white" style={{ backgroundColor: t.secondary_color || '#1996DC' }} title="Secundária" />
                                  <span className="w-3.5 h-3.5 rounded-full shadow-xs border border-white" style={{ backgroundColor: t.tertiary_color || '#001D4A' }} title="Terciária" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Ações completas de Gestão da Usina */}
                          <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
                            {/* Botão de Ativação / Desativação da Usina */}
                            <button
                              onClick={() => handleToggleTenantStatus(t.id, t.active !== false)}
                              disabled={updatingTenantId === t.id}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                                t.active !== false
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/80 hover:border-amber-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/80 hover:border-emerald-300'
                              }`}
                              title={t.active !== false ? "Desativar Acesso da Usina (Suspender Temporariamente)" : "Reativar Acesso da Usina"}
                            >
                              {updatingTenantId === t.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : t.active !== false ? (
                                <PowerOff className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Power className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span className="hidden sm:inline">
                                {t.active !== false ? 'Desativar Usina' : 'Ativar Usina'}
                              </span>
                            </button>

                            <button
                              onClick={() => generateAndCopyNewLink(t.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium border border-slate-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Copiar Link de Convite para Gestor"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Convite Gestor</span>
                            </button>
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/${t.subdomain}/login`;
                                window.open(url, '_blank');
                                navigator.clipboard.writeText(url);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Acessar Portal da Usina (abre em nova aba e copia URL)"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Portal</span>
                            </button>
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200/80 transition-all cursor-pointer shadow-xs hover:text-primary active:scale-95"
                              title="Editar Unidade"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTenant(t.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200/80 transition-all cursor-pointer shadow-xs hover:bg-rose-100 active:scale-95"
                              title="Excluir Unidade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-navy">Trilha de Auditoria & Rastro</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Rastreamento de movimentações e integridade de dados por unidade.</p>
                </div>

                <div className="flex items-center gap-2 min-w-[260px]">
                  <select 
                    value={selectedMonitoringTenant}
                    onChange={(e) => setSelectedMonitoringTenant(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl shadow-xs text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="">Selecione uma Usina...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!selectedMonitoringTenant ? (
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                    <Search className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy">Aguardando Seleção da Usina</h3>
                    <p className="text-slate-400 max-w-md mx-auto text-xs mt-1">
                      Selecione uma usina acima para carregar o histórico completo de movimentações de materiais.
                    </p>
                  </div>
                </div>
              ) : loadingLogs ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-slate-400 text-xs font-medium mt-3">Carregando registros de auditoria...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy">Sem Movimentações</h3>
                    <p className="text-slate-400 max-w-md mx-auto text-xs mt-1">
                      Nenhuma movimentação de materiais registrada nesta unidade até o momento.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Horário / Data</th>
                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Responsável</th>
                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Ação / Material</th>
                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {Array.isArray(auditLogs) && auditLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-navy">{new Date(log.moved_at).toLocaleTimeString('pt-BR')}</span>
                              <span className="text-[10px] text-slate-400">{new Date(log.moved_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-navy border border-slate-200">
                                {log.actor?.full_name?.[0] || 'U'}
                              </div>
                              <span className="font-semibold text-navy">{log.actor?.full_name || 'Usuário do Sistema'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-navy">{log.material?.name || 'Item não identificado'}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400">De: {log.from_sector?.name || 'ENTRADA'}</span>
                                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                <span className="text-[10px] text-primary font-medium">Para: {log.to_sector?.name || 'Destino'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200/80">
                              Confirmado
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Math.ceil(auditLogs.length / itemsPerPage) > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-2xl">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:text-navy hover:bg-slate-50 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                      >
                        Anterior
                      </button>
                      <span className="text-xs text-slate-500">
                        Página {currentPage} de {Math.ceil(auditLogs.length / itemsPerPage)}
                      </span>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(auditLogs.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(auditLogs.length / itemsPerPage)}
                        className="px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:text-navy hover:bg-slate-50 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
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
            <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
              {/* Header Limpo e Direto */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-navy">Gerenciamento de Usuários</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Controle de colaboradores internos e empresas terceirizadas por unidade industrial.
                  </p>
                </div>
              </div>

              {/* SE NENHUMA UNIDADE SELECIONADA: Mostra a grade limpa para escolher a Usina */}
              {!selectedUserTenantId ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                  <div className="max-w-lg mb-6">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Etapa 1</span>
                    <h3 className="text-base font-bold text-navy mt-1">Selecione uma Unidade Industrial</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Clique na usina que deseja consultar para visualizar e gerenciar sua equipe e empresas parceiras.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tenants.map(t => {
                      const tenantUsers = allUsers.filter(u => u.tenant?.id === t.id && u.role !== 'SUPER_ADMIN');
                      const colaboradoresCount = tenantUsers.filter(u => u.role !== 'TERCEIRIZADA').length;
                      const terceirizadasCount = tenantUsers.filter(u => u.role === 'TERCEIRIZADA').length;

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserTenantId(t.id);
                            setExpandedSections([]); // Cards fechados por padrão!
                          }}
                          className="flex flex-col justify-between p-5 rounded-2xl border border-slate-200/80 hover:border-primary/50 bg-white hover:bg-slate-50/50 hover:shadow-md transition-all text-left group cursor-pointer"
                        >
                          <div className="flex items-start gap-3.5">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0 overflow-hidden"
                              style={{ backgroundColor: t.tertiary_color || t.company_color || '#001D4A' }}
                            >
                              {t.logo_url ? (
                                <img src={t.logo_url} alt={t.name} className="w-full h-full object-contain p-1.5" onError={(e: any) => e.target.style.display = 'none'} />
                              ) : (
                                t.name[0]
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-navy text-sm truncate group-hover:text-primary transition-colors">
                                {t.name}
                              </h4>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">
                                CNPJ: {t.cnpj}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="text-slate-500 font-medium">
                              <span>{colaboradoresCount} colaboradores</span>
                              <span className="mx-1.5 text-slate-300">·</span>
                              <span>{terceirizadasCount} terceirizadas</span>
                            </div>
                            <span className="text-primary font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Gerenciar <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* SE UMA UNIDADE FOI SELECIONADA */
                (() => {
                  const targetTenant = tenants.find(t => t.id === selectedUserTenantId);
                  if (!targetTenant) {
                    return (
                      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80">
                        <p className="text-sm font-semibold text-navy">Unidade não encontrada.</p>
                        <button
                          type="button"
                          onClick={() => setSelectedUserTenantId('')}
                          className="mt-3 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Selecionar outra unidade
                        </button>
                      </div>
                    );
                  }

                  // Usuários desta usina (excluindo qualquer conta Super Admin)
                  const tenantUsers = allUsers.filter(u => u.tenant?.id === targetTenant.id && u.role !== 'SUPER_ADMIN');

                  // Aplicação dos filtros locais desta usina
                  const filtered = tenantUsers.filter(u => {
                    if (userSearchTerm.trim()) {
                      const term = userSearchTerm.toLowerCase();
                      const matchName = u.full_name?.toLowerCase().includes(term);
                      const matchEmail = u.email?.toLowerCase().includes(term);
                      const matchRole = u.role?.toLowerCase().includes(term);
                      const matchSector = u.sector?.toLowerCase().includes(term);
                      const matchCnpj = u.cnpj?.includes(term);
                      const matchRep = u.representative_name?.toLowerCase().includes(term);
                      if (!matchName && !matchEmail && !matchRole && !matchSector && !matchCnpj && !matchRep) {
                        return false;
                      }
                    }

                    if (userCategoryFilter === 'internal' && u.role === 'TERCEIRIZADA') return false;
                    if (userCategoryFilter === 'terceirizada' && u.role !== 'TERCEIRIZADA') return false;

                    if (userStatusFilter === 'active' && u.is_active === false) return false;
                    if (userStatusFilter === 'inactive' && u.is_active !== false) return false;

                    return true;
                  });

                  const colaboradores = filtered.filter(u => u.role !== 'TERCEIRIZADA');
                  const terceirizadas = filtered.filter(u => u.role === 'TERCEIRIZADA');

                  const isSearchActive = userSearchTerm.trim() !== '';
                  // Por padrão recolhidos / fechados, exceto se usuário expandiu manualmente ou digitou na busca
                  const isColaboradoresExpanded = expandedSections.includes('colaboradores') || (isSearchActive && colaboradores.length > 0);
                  const isTerceirizadasExpanded = expandedSections.includes('terceirizadas') || (isSearchActive && terceirizadas.length > 0);

                  return (
                    <div className="space-y-4">
                      {/* Botão de Navegação / Voltar para lista de usinas */}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedUserTenantId('')}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-navy text-xs font-bold transition-all shadow-xs cursor-pointer group"
                        >
                          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-navy" />
                          <span>Voltar para Lista de Usinas</span>
                        </button>
                      </div>

                      {/* Barra de Identificação da Usina Selecionada & Seletor de Troca */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0 overflow-hidden"
                            style={{ backgroundColor: targetTenant.tertiary_color || targetTenant.company_color || '#001D4A' }}
                          >
                            {targetTenant.logo_url ? (
                              <img src={targetTenant.logo_url} alt={targetTenant.name} className="w-full h-full object-contain p-1.5" onError={(e: any) => e.target.style.display = 'none'} />
                            ) : (
                              targetTenant.name[0]
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-base font-bold text-navy">{targetTenant.name}</h3>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                              <span className="font-mono">CNPJ: {targetTenant.cnpj}</span>
                              <span className="text-slate-300">·</span>
                              <span>{tenantUsers.filter(u => u.role !== 'TERCEIRIZADA').length} colaboradores</span>
                              <span className="text-slate-300">·</span>
                              <span>{tenantUsers.filter(u => u.role === 'TERCEIRIZADA').length} terceirizadas</span>
                            </div>
                          </div>
                        </div>

                        {/* Seletor para alternar entre usinas */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                            Alternar Empresa:
                          </span>
                          <select
                            value={selectedUserTenantId}
                            onChange={(e) => {
                              setSelectedUserTenantId(e.target.value);
                              setExpandedSections([]); // Mantém fechado por padrão
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-navy shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer max-w-[200px] truncate"
                          >
                            {tenants.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Barra de Filtros & Busca */}
                      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                        {/* Busca */}
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar por nome, email, cargo, setor ou empresa..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>

                        {/* Filtros Limpos: Categoria e Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Categoria */}
                          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl shrink-0">
                            <button
                              type="button"
                              onClick={() => setUserCategoryFilter('all')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                userCategoryFilter === 'all'
                                  ? 'bg-white text-navy shadow-xs'
                                  : 'text-slate-500 hover:text-navy'
                              }`}
                            >
                              Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserCategoryFilter('internal')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                userCategoryFilter === 'internal'
                                  ? 'bg-white text-primary shadow-xs'
                                  : 'text-slate-500 hover:text-navy'
                              }`}
                            >
                              <Building2 className="w-3.5 h-3.5 text-primary" />
                              <span>Colaboradores</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserCategoryFilter('terceirizada')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                userCategoryFilter === 'terceirizada'
                                  ? 'bg-white text-blue-600 shadow-xs'
                                  : 'text-slate-500 hover:text-navy'
                              }`}
                            >
                              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                              <span>Terceirizadas</span>
                            </button>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl shrink-0">
                            <button
                              type="button"
                              onClick={() => setUserStatusFilter('all')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                userStatusFilter === 'all' ? 'bg-white text-navy shadow-xs' : 'text-slate-500 hover:text-navy'
                              }`}
                            >
                              Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserStatusFilter('active')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                userStatusFilter === 'active' ? 'bg-white shadow-xs font-bold text-emerald-700' : 'text-slate-500 hover:text-emerald-700'
                              }`}
                            >
                              Ativos
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserStatusFilter('inactive')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                userStatusFilter === 'inactive' ? 'bg-white shadow-xs font-bold text-rose-700' : 'text-slate-500 hover:text-rose-700'
                              }`}
                            >
                              Desativados
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Estado Vazio se nenhum registro corresponder */}
                      {filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-xs">
                          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                          <p className="text-sm font-bold text-navy">Nenhum registro encontrado</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Não encontramos colaboradores ou terceirizadas com os filtros selecionados.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* 1. SEÇÃO DE COLABORADORES INTERNOS (Recolhido por padrão) */}
                          {userCategoryFilter !== 'terceirizada' && (
                            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden transition-all">
                              <button
                                type="button"
                                onClick={() => toggleSection('colaboradores')}
                                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/70 transition-colors group cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                    <Building2 className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-navy text-sm">
                                        Colaboradores & Gestão da Usina
                                      </h4>
                                      <span className="text-xs text-slate-400 font-medium">
                                        ({colaboradores.length})
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      Gestores de segurança, líderes de setor e equipe de portaria
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
                                    {colaboradores.filter(c => c.is_active !== false).length} ativos
                                  </span>
                                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover:text-navy transition-all ${isColaboradoresExpanded ? 'rotate-180 bg-primary/10 text-primary' : ''}`}>
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                </div>
                              </button>

                              {isColaboradoresExpanded && (
                                <div className="border-t border-slate-100">
                                  {colaboradores.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-slate-400">
                                      Nenhum colaborador encontrado nesta seção com os filtros atuais.
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                          <tr>
                                            <th className="px-5 py-3">Colaborador</th>
                                            <th className="px-5 py-3">Cargo / Perfil</th>
                                            <th className="px-5 py-3">Setor</th>
                                            <th className="px-5 py-3 text-center">Status</th>
                                            <th className="px-5 py-3 text-right">Ação</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                          {colaboradores.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                              <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                                                    {u.full_name?.[0]?.toUpperCase() || '?'}
                                                  </div>
                                                  <div className="flex flex-col">
                                                    <span className="font-semibold text-navy text-xs">{u.full_name}</span>
                                                    <span className="text-[11px] text-slate-400 mt-0.5">{u.email}</span>
                                                    {u.registration_number && (
                                                      <span className="text-[10px] text-slate-400 font-mono">Matrícula: {u.registration_number}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="px-5 py-3.5">
                                                <span className="text-xs font-medium text-slate-700">
                                                  {u.role === 'GESTOR_SEGURANCA' ? 'Gestor de Segurança' :
                                                   u.role === 'LIDER_SETOR' ? 'Líder de Setor' :
                                                   u.role === 'PORTARIA' ? 'Portaria & Acesso' : u.role}
                                                </span>
                                              </td>
                                              <td className="px-5 py-3.5">
                                                <span className="text-xs text-slate-600">
                                                  {u.sector || 'Todos os setores'}
                                                </span>
                                              </td>
                                              <td className="px-5 py-3.5 text-center">
                                                {u.is_active !== false ? (
                                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Ativo
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                    Desativado
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-5 py-3.5 text-right">
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleUserStatus(u.id, u.is_active !== false)}
                                                  disabled={updatingUserId === u.id}
                                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 ${
                                                    u.is_active !== false
                                                      ? 'border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                                                      : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                                  }`}
                                                  title={u.is_active !== false ? "Desativar acesso do colaborador" : "Reativar acesso do colaborador"}
                                                >
                                                  {updatingUserId === u.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                  ) : u.is_active !== false ? (
                                                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                                                  ) : (
                                                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                  )}
                                                  <span>{u.is_active !== false ? 'Desativar' : 'Ativar'}</span>
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. SEÇÃO DE EMPRESAS TERCEIRIZADAS (Recolhido por padrão) */}
                          {userCategoryFilter !== 'internal' && (
                            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden transition-all">
                              <button
                                type="button"
                                onClick={() => toggleSection('terceirizadas')}
                                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/70 transition-colors group cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Briefcase className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-navy text-sm">
                                        Empresas Terceirizadas Credenciadas
                                      </h4>
                                      <span className="text-xs text-slate-400 font-medium">
                                        ({terceirizadas.length})
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      Prestadoras de serviços com acesso credenciado à planta
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
                                    {terceirizadas.filter(t => t.is_active !== false).length} ativas
                                  </span>
                                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover:text-navy transition-all ${isTerceirizadasExpanded ? 'rotate-180 bg-blue-100 text-blue-700' : ''}`}>
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                </div>
                              </button>

                              {isTerceirizadasExpanded && (
                                <div className="border-t border-slate-100">
                                  {terceirizadas.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-slate-400">
                                      Nenhuma empresa terceirizada encontrada com os filtros atuais.
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                          <tr>
                                            <th className="px-5 py-3">Empresa Terceirizada</th>
                                            <th className="px-5 py-3">CNPJ</th>
                                            <th className="px-5 py-3">Representante & Contato</th>
                                            <th className="px-5 py-3 text-center">Status</th>
                                            <th className="px-5 py-3 text-right">Ação</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                          {terceirizadas.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                              <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                                    <Briefcase className="w-4 h-4" />
                                                  </div>
                                                  <div className="flex flex-col">
                                                    <span className="font-bold text-navy text-xs">{u.full_name}</span>
                                                    <span className="text-[11px] text-slate-400 mt-0.5">{u.email}</span>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="px-5 py-3.5">
                                                <span className="font-mono text-xs text-slate-700">
                                                  {u.cnpj || '—'}
                                                </span>
                                              </td>
                                              <td className="px-5 py-3.5">
                                                <div className="flex flex-col text-xs">
                                                  <span className="font-medium text-slate-700">
                                                    {u.representative_name || 'Responsável não informado'}
                                                  </span>
                                                  {u.phone && (
                                                    <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                      <Phone className="w-3 h-3 text-slate-400" />
                                                      {u.phone}
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-5 py-3.5 text-center">
                                                {u.is_active !== false ? (
                                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Ativa
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                    Desativada
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-5 py-3.5 text-right">
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleUserStatus(u.id, u.is_active !== false)}
                                                  disabled={updatingUserId === u.id}
                                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 ${
                                                    u.is_active !== false
                                                      ? 'border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                                                      : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                                  }`}
                                                  title={u.is_active !== false ? "Desativar empresa terceirizada" : "Reativar empresa terceirizada"}
                                                >
                                                  {updatingUserId === u.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                  ) : u.is_active !== false ? (
                                                    <PowerOff className="w-3.5 h-3.5 text-rose-600" />
                                                  ) : (
                                                    <Power className="w-3.5 h-3.5 text-emerald-600" />
                                                  )}
                                                  <span>{u.is_active !== false ? 'Desativar Empresa' : 'Ativar Empresa'}</span>
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}
          </div>
        </main>

        <MobileNav 
          activeSection={activeTab}
          setActiveSection={(s: any) => setActiveTab(s)}
          items={navItems}
        />
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

      {/* Modal Personalizado de Confirmação (Substitui confirm() nativo do navegador) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Botão fechar modal */}
            <button
              onClick={() => {
                if (!dialogLoading) {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
              }}
              disabled={dialogLoading}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-navy flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Ícone contextual */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${
                confirmDialog.variant === 'danger'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-rose-100'
                  : confirmDialog.variant === 'warning'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200/80 shadow-amber-100'
                  : confirmDialog.variant === 'success'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-emerald-100'
                  : 'bg-primary/10 text-primary border border-primary/20 shadow-primary/5'
              }`}>
                {confirmDialog.icon === 'trash' && <Trash2 className="w-7 h-7" />}
                {confirmDialog.icon === 'power-off' && <PowerOff className="w-7 h-7" />}
                {confirmDialog.icon === 'power' && <Power className="w-7 h-7" />}
                {confirmDialog.icon === 'user-x' && <UserX className="w-7 h-7" />}
                {confirmDialog.icon === 'user-check' && <UserCheck className="w-7 h-7" />}
                {!confirmDialog.icon && <AlertCircle className="w-7 h-7" />}
              </div>

              {/* Título */}
              <h3 className="text-lg font-bold text-navy tracking-tight mb-2">
                {confirmDialog.title}
              </h3>

              {/* Mensagem principal */}
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                {confirmDialog.message}
              </p>

              {/* Sub-mensagem explicativa / aviso */}
              {confirmDialog.subMessage && (
                <div className="w-full bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3.5 mb-6 text-left">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {confirmDialog.subMessage}
                  </p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  type="button"
                  disabled={dialogLoading}
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {confirmDialog.cancelText || 'Cancelar'}
                </button>
                <button
                  type="button"
                  disabled={dialogLoading}
                  onClick={() => confirmDialog.onConfirm()}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                      : confirmDialog.variant === 'warning'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                      : confirmDialog.variant === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                      : 'bg-navy hover:bg-[#002880] shadow-navy/25'
                  }`}
                >
                  {dialogLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    confirmDialog.confirmText || 'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Personalizado de Informação / Alerta / Cópia (Substitui alert() nativo do navegador) */}
      {infoDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Botão fechar modal */}
            <button
              onClick={() => setInfoDialog(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-navy flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Ícone contextual */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${
                infoDialog.type === 'error'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-rose-100'
                  : infoDialog.type === 'warning'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200/80 shadow-amber-100'
                  : infoDialog.type === 'success'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-emerald-100'
                  : 'bg-blue-50 text-blue-600 border border-blue-200/80 shadow-blue-100'
              }`}>
                {infoDialog.type === 'error' && <AlertCircle className="w-7 h-7" />}
                {infoDialog.type === 'warning' && <ShieldAlert className="w-7 h-7" />}
                {infoDialog.type === 'success' && <CheckCircle2 className="w-7 h-7" />}
                {(!infoDialog.type || infoDialog.type === 'info') && <Globe className="w-7 h-7" />}
              </div>

              {/* Título */}
              <h3 className="text-lg font-bold text-navy tracking-tight mb-2">
                {infoDialog.title}
              </h3>

              {/* Mensagem principal */}
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {infoDialog.message}
              </p>

              {/* Caixa Especial para Texto Copiável / Link de Convite */}
              {infoDialog.copyableText && (
                <div className="w-full mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Link do Convite Gerado
                    </span>
                    <p className="text-xs font-mono text-slate-700 truncate select-all bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                      {infoDialog.copyableText}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (infoDialog.copyableText) {
                        navigator.clipboard.writeText(infoDialog.copyableText);
                        setInfoCopySuccess(true);
                        setTimeout(() => setInfoCopySuccess(false), 2000);
                      }
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      infoCopySuccess
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : 'bg-white hover:bg-slate-100 text-navy border border-slate-200 shadow-xs'
                    }`}
                  >
                    {infoCopySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Botão Entendido */}
              <button
                type="button"
                onClick={() => setInfoDialog(prev => ({ ...prev, isOpen: false }))}
                className="w-full mt-6 py-3.5 bg-navy hover:bg-[#002880] text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-navy/20 transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
}

function NavButton({ active, onClick, icon, label, isCollapsed }: NavButtonProps) {
  return (
    <button 
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-3 gap-3'} rounded-2xl text-xs font-medium transition-all cursor-pointer ${
        active
          ? 'bg-primary text-white font-semibold shadow-md shadow-primary/20' 
          : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {!isCollapsed && <span className="truncate">{label}</span>}
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
    <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-xs`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl md:text-3xl font-bold text-navy tracking-tight mt-1">{value}</p>
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

