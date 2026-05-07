import { useAuth } from '../../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

import TerceirizadaDashboard from '../../requests/pages/TerceirizadaDashboard';
import LiderDashboard from '../../requests/pages/LiderDashboard';
import PortariaDashboard from '../../requests/pages/PortariaDashboard';
import GestorDashboard from '../../monitoring/pages/GestorDashboard';
import SuperAdminDashboard from '../../admin/pages/SuperAdminDashboard';
import { DashboardProvider } from '../../../contexts/DashboardContext';
import { useTenant } from '../../../contexts/TenantContext';

export default function RoleDispatcher() {
  const { profile, loading } = useAuth();
  const { slug } = useTenant();
  const location = useLocation();
  const pathname = location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-8 text-center text-red-800 font-brand">
        Perfil não encontrado. Verifique sua conexão ou contate o suporte.
      </div>
    );
  }

  // Integridade de Rota: Se for ADMIN mas estiver em rota de USINA, redireciona para Admin Global
  if (profile.role === 'SUPER_ADMIN' && !pathname.startsWith('/admin')) {
    return <Navigate to="/admin/painel" replace />;
  }

  // Se for GESTOR/OPERACIONAL mas estiver na rota ADMIN, redireciona para sua usina
  if (profile.role !== 'SUPER_ADMIN' && pathname.startsWith('/admin')) {
    const slug = profile.tenant?.subdomain || 'login';
    const rolePath = profile.role?.toLowerCase().replace('_', '-');
    return <Navigate to={`/${slug}/${rolePath}/painel`} replace />;
  }

  // Integridade de Rota: Se estiver em /painel ou rota sem slug/role, redireciona para a rota completa
  const isGenericPainel = pathname === '/painel' || pathname === '/painel/';
  const rolePath = profile.role?.toLowerCase().replace('_', '-');
  
  // Prioriza o slug do perfil (banco de dados) sobre o slug da URL (volátil)
  const effectiveSlug = profile.tenant?.subdomain || slug;

  if (profile.role !== 'SUPER_ADMIN' && effectiveSlug && rolePath && (isGenericPainel || !pathname.includes(`/${rolePath}/`))) {
    const targetPath = `/${effectiveSlug}/${rolePath}/painel`;
    if (pathname !== targetPath) {
      return <Navigate to={targetPath} replace />;
    }
  }

  // Direcionamento Roteado Componentizado

  switch (profile.role) {
    case 'TERCEIRIZADA':
      return <TerceirizadaDashboard />;
    case 'LIDER_SETOR':
      return (
        <DashboardProvider>
          <LiderDashboard />
        </DashboardProvider>
      );
    case 'PORTARIA':
      return (
        <DashboardProvider>
          <PortariaDashboard />
        </DashboardProvider>
      );
    case 'GESTOR_SEGURANCA':
      return (
        <DashboardProvider>
          <GestorDashboard />
        </DashboardProvider>
      );
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-8 text-center text-red-800">
          Você não possui um perfil válido atribuído no sistema da UsinaLins. <br />
          Contate a administração. Role detectado: {profile.role || 'Nenhum'}
        </div>
      );
  }
}

