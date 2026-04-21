import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RegisterTerceirizada from './pages/RegisterTerceirizada';
import RegisterInternal from './pages/RegisterInternal';
import AdminLogin from './pages/AdminLogin';
import RoleDispatcher from './components/RoleDispatcher';
import NovaSolicitacao from './pages/Terceirizada/NovaSolicitacao';
import RegisterGestor from './pages/RegisterGestor';

import { TenantProvider, useTenant } from './contexts/TenantContext';

function HomeRedirect() {
  const { slug, isAdmin, isSubdomain } = useTenant();
  
  if (isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  if (isSubdomain) {
    return <Navigate to="/login" replace />;
  }
  
  if (slug) {
    return <Navigate to={`/${slug}/login`} replace />;
  }
  
  return <Navigate to="/admin/login" replace />;
}

function LoginDispatcher() {
  const { slug } = useTenant();
  return slug ? <Login /> : <Navigate to="/admin/login" replace />;
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
            <Route path="/login" element={<LoginDispatcher />} />
            
            <Route path="/:tenantSlug/cadastro" element={<RegisterTerceirizada />} />
            <Route path="/:tenantSlug/registro-interno" element={<RegisterInternal />} />
            <Route path="/:tenantSlug/register-gestor" element={<RegisterGestor />} />
            
            <Route path="/:tenantSlug/painel" element={
              <ProtectedRoute>
                <RoleDispatcher />
              </ProtectedRoute>
            } />

            <Route path="/painel" element={
              <ProtectedRoute>
                <RoleDispatcher />
              </ProtectedRoute>
            } />

            <Route path="/:tenantSlug/painel/nova-solicitacao" element={
              <ProtectedRoute>
                <NovaSolicitacao />
              </ProtectedRoute>
            } />

            <Route path="/painel/nova-solicitacao" element={
              <ProtectedRoute>
                <NovaSolicitacao />
              </ProtectedRoute>
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
