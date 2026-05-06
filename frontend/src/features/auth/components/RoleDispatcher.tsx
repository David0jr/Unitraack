import { useAuth } from '../../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

import TerceirizadaDashboard from '../../requests/pages/TerceirizadaDashboard';
import LiderDashboard from '../../requests/pages/LiderDashboard';
import PortariaDashboard from '../../requests/pages/PortariaDashboard';
import GestorDashboard from '../../monitoring/pages/GestorDashboard';
import SuperAdminDashboard from '../../admin/pages/SuperAdminDashboard';
import { DashboardProvider } from '../../../contexts/DashboardContext';

export default function RoleDispatcher() {
  const { profile, loading } = useAuth();
  const pathname = window.location.pathname;

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
    window.location.href = '/admin/painel';
    return null;
  }

  // Se for GESTOR/OPERACIONAL mas estiver na rota ADMIN, redireciona para sua usina
  if (profile.role !== 'SUPER_ADMIN' && pathname.startsWith('/admin')) {
    const slug = profile.tenant?.subdomain || 'login';
    const rolePath = profile.role?.toLowerCase().replace('_', '-');
    window.location.href = `/${slug}/${rolePath}/painel`;
    return null;
  }

  // Integridade de Rota: Se estiver em /painel ou rota sem slug/role, redireciona para a rota completa
  const isGenericPainel = pathname === '/painel' || pathname === '/painel/';
  const rolePath = profile.role?.toLowerCase().replace('_', '-');
  const slug = profile.tenant?.subdomain;

  if (profile.role !== 'SUPER_ADMIN' && slug && rolePath && (isGenericPainel || !pathname.includes(`/${rolePath}/`))) {
    // Evita loop infinito se já estiver na rota correta mas o include falhar por algum motivo
    const targetPath = `/${slug}/${rolePath}/painel`;
    if (pathname !== targetPath) {
      window.location.href = targetPath;
      return null;
    }
  }

  // Direcionamento Roteado Componentizado

  switch (profile.role) {
    case 'TERCEIRIZADA':
      return <TerceirizadaDashboard />;
    case 'LIDER_SETOR':
      return <LiderDashboard />;
    case 'PORTARIA':
      return <PortariaDashboard />;
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

