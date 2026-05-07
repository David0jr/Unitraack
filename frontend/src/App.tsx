import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './features/auth/pages/Login';
import RegisterTerceirizada from './features/auth/pages/RegisterTerceirizada';
import RegisterInternal from './features/auth/pages/RegisterInternal';
import AdminLogin from './features/auth/pages/AdminLogin';
import RoleDispatcher from './features/auth/components/RoleDispatcher';
import NovaSolicitacao from './features/requests/pages/Terceirizada/NovaSolicitacao';
import RegisterGestor from './features/auth/pages/RegisterGestor';

import { TenantProvider, useTenant } from './contexts/TenantContext';

import { useAuth } from './contexts/AuthContext';

function HomeRedirect() {
  const { user, profile } = useAuth();
  const { slug: tenantSlug, isAdmin, isSubdomain } = useTenant();
  
  // Se já estiver logado, manda direto para o painel correto
  if (user && profile) {
    if (profile.role === 'SUPER_ADMIN') {
      return <Navigate to="/admin/painel" replace />;
    }
    const userSlug = profile.tenant?.subdomain || tenantSlug;
    const rolePath = profile.role?.toLowerCase().replace('_', '-');
    
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

/**
 * Componente para garantir que rotas genéricas (sem slug na URL) 
 * só funcionem em ambiente de subdomínio.
 */
/**
 * Componente para garantir que rotas genéricas (sem slug na URL) 
 * só funcionem em ambiente de subdomínio.
 */
function SubdomainOrNotFound({ children }: { children: React.ReactNode }) {
  const { isSubdomain } = useTenant();
  
  // No localhost, se não houver um slug no path (ex: /usina-lins/...),
  // esta rota genérica deve ser tratada como inexistente.
  if (!isSubdomain && window.location.hostname === 'localhost') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <h1 className="text-4xl font-bold text-navy mb-2">404</h1>
        <p className="text-slate-500 text-center">Esta rota requer um identificador de usina válido.</p>
        <p className="text-xs text-slate-400 mt-4">Exemplo: /usina-lins/login</p>
      </div>
    );
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <TenantProvider>
        <AuthProvider>
          <Routes>
            {/* Global Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/painel" element={
              <ProtectedRoute>
                <RoleDispatcher />
              </ProtectedRoute>
            } />

            {/* Tenant Routes */}
            <Route path="/:tenantSlug/login" element={<Login />} />
            <Route path="/login" element={
              <SubdomainOrNotFound>
                <Login />
              </SubdomainOrNotFound>
            } />
            
            <Route path="/:tenantSlug/cadastro" element={<RegisterTerceirizada />} />
            <Route path="/:tenantSlug/registro-interno" element={<RegisterInternal />} />
            <Route path="/:tenantSlug/register-gestor" element={<RegisterGestor />} />
            
            <Route path="/:tenantSlug/:role/painel" element={
              <ProtectedRoute>
                <RoleDispatcher />
              </ProtectedRoute>
            } />

            <Route path="/:tenantSlug/painel" element={
              <ProtectedRoute>
                <RoleDispatcher />
              </ProtectedRoute>
            } />

            <Route path="/painel" element={
              <SubdomainOrNotFound>
                <ProtectedRoute>
                  <RoleDispatcher />
                </ProtectedRoute>
              </SubdomainOrNotFound>
            } />

            <Route path="/:tenantSlug/:role/painel/nova-solicitacao" element={
              <ProtectedRoute>
                <NovaSolicitacao />
              </ProtectedRoute>
            } />

            <Route path="/:tenantSlug/painel/nova-solicitacao" element={
              <ProtectedRoute>
                <NovaSolicitacao />
              </ProtectedRoute>
            } />

            <Route path="/painel/nova-solicitacao" element={
              <SubdomainOrNotFound>
                <ProtectedRoute>
                  <NovaSolicitacao />
                </ProtectedRoute>
              </SubdomainOrNotFound>
            } />

            {/* Smart Redirects for Root and unknown paths */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </AuthProvider>
      </TenantProvider>
    </Router>
  );
}

export default App;
