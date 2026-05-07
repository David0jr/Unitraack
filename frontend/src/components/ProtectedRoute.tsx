import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const { slug, isSubdomain } = useTenant();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin opacity-10" />
      </div>
    );
  }

  if (!user) {
    // 1. Se estiver explicitamente em uma rota administrativa
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    
    // 2. Tentar recuperar o slug da URL atual para manter o contexto da Usina
    // Se a URL for /lins/terceirizada/painel, o slug é 'lins'
    const currentSlug = slug || profile?.tenant?.subdomain;

    const loginPath = isSubdomain ? '/login' : (currentSlug ? `/${currentSlug}/login` : '/login');
    
    // Evita loop se já estiver no login
    if (location.pathname === loginPath || location.pathname === '/login' || location.pathname === '/admin/login') {
      return null;
    }

    return <Navigate to={loginPath} replace />;
  }

  // Validação de Role vs Path
  if (profile) {
    // 1. Tentar acessar /admin sem ser SUPER_ADMIN
    if (location.pathname.startsWith('/admin') && profile.role !== 'SUPER_ADMIN') {
      const targetSlug = profile.tenant?.subdomain;
      return <Navigate to={targetSlug ? `/${targetSlug}/painel` : '/painel'} replace />;
    }

    // 2. Tentar acessar painel de outra usina (se estiver logado em usina-a mas tentar entrar em /usina-b/painel)
    if (slug && profile.tenant?.subdomain && slug !== profile.tenant.subdomain && profile.role !== 'SUPER_ADMIN') {
      return <Navigate to={`/${profile.tenant.subdomain}/painel`} replace />;
    }
  } else if (!loading && user) {
    // SECURITY: Se houver user mas não houver profile após carregar, a conta é inválida para o sistema
    console.warn('[ProtectedRoute] Usuário autenticado sem perfil. Redirecionando...');
    return <Navigate to="/login" state={{ error: 'Perfil não encontrado.' }} replace />;
  }

  return <>{children}</>;
}

