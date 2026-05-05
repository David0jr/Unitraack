import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const { slug, isAdmin, isSubdomain } = useTenant();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin opacity-10" />
      </div>
    );
  }

  if (!user) {
    // Se estiver tentando acessar /admin sem estar logado
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    
    // Se estiver em um subdomínio (ex: usina.localhost), o login é em /login
    // Se estiver no domínio principal com slug no path (ex: localhost/usina), o login é em /:slug/login
    const loginPath = isSubdomain ? '/login' : (slug ? `/${slug}/login` : '/admin/login');
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
    // Nota: isso exige que o slug na URL corresponda ao profile.tenant.subdomain
    if (slug && profile.tenant?.subdomain && slug !== profile.tenant.subdomain && profile.role !== 'SUPER_ADMIN') {
      return <Navigate to={`/${profile.tenant.subdomain}/painel`} replace />;
    }
  }

  return <>{children}</>;
}

