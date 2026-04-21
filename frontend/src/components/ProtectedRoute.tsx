import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { slug } = useTenant();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin opacity-10" />
      </div>
    );
  }

  if (!user) {
    if (isAdmin) {
      return <Navigate to="/admin/login" replace />;
    }
    
    // Se estiver em um subdomínio (ex: usina.localhost), o login é em /login
    // Se estiver no domínio principal com slug no path (ex: localhost/usina), o login é em /:slug/login
    const loginPath = isSubdomain ? '/login' : (slug ? `/${slug}/login` : '/admin/login');
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}

