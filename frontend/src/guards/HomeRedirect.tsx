import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTenant } from "../contexts/TenantContext";

export default function HomeRedirect() {
  const { user, profile } = useAuth();
  const { slug: tenantSlug } = useTenant();

  // Se já estiver logado, manda direto para o painel correto
  if (user && profile) {
    if (profile.role === "SUPER_ADMIN") {
      return <Navigate to="/admin/painel" replace />;
    }
    const userSlug = profile.tenant?.subdomain || tenantSlug;
    const rolePath = profile.role?.toLowerCase().replace("_", "-");

    if (userSlug && rolePath) {
      return <Navigate to={`/${userSlug}/${rolePath}/painel`} replace />;
    }
    if (userSlug) {
      return <Navigate to={`/${userSlug}/painel`} replace />;
    }
    // Fallback de segurança se não houver slug (não deveria acontecer)
    return <Navigate to="/admin/login" replace />;
  }

  // Se não houver nada (no slug, no subdomain, no login),
  // o único destino válido sem contexto é o login administrativo global.
  return <Navigate to="/admin/login" replace />;
}
