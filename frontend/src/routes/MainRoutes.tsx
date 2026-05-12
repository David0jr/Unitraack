import { Routes, Route } from "react-router-dom";

import ProtectedRoute from '../guards/ProtectedRoute';

import AdminLogin from '../features/auth/pages/AdminLogin';
import Login from '../features/auth/pages/Login';

import RoleDispatcher from '../features/auth/components/RoleDispatcher';

import RegisterTerceirizada from '../features/auth/pages/RegisterTerceirizada';
import RegisterInternal from '../features/auth/pages/RegisterInternal';
import RegisterGestor from '../features/auth/pages/RegisterGestor';
import NovaSolicitacao from '../features/requests/pages/Terceirizada/NovaSolicitacao';

import SubdomainOrNotFound from '../guards/SubdomainOrNotFound';
import HomeRedirect from '../guards/HomeRedirect';


const MainRoutes = () => {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      
      <Route
        path="/login"
        element={
          <SubdomainOrNotFound>
            <Login />
          </SubdomainOrNotFound>
        }
      />

      <Route
        path="/admin/painel"
        element={
          <ProtectedRoute>
            <RoleDispatcher />
          </ProtectedRoute>
        }
      />

      {/* Tenant Routes */}
      <Route path="/:tenantSlug/login" element={<Login />} />
      
      <Route path="/:tenantSlug/cadastro" element={<RegisterTerceirizada />} />
      <Route
        path="/:tenantSlug/registro-interno"
        element={<RegisterInternal />}
      />
      <Route path="/:tenantSlug/register-gestor" element={<RegisterGestor />} />

      <Route
        path="/:tenantSlug/:role/painel"
        element={
          <ProtectedRoute>
            <RoleDispatcher />
          </ProtectedRoute>
        }
      />

      <Route
        path="/:tenantSlug/painel"
        element={
          <ProtectedRoute>
            <RoleDispatcher />
          </ProtectedRoute>
        }
      />

      <Route
        path="/painel"
        element={
          <SubdomainOrNotFound>
            <ProtectedRoute>
              <RoleDispatcher />
            </ProtectedRoute>
          </SubdomainOrNotFound>
        }
      />

      <Route
        path="/:tenantSlug/:role/painel/nova-solicitacao"
        element={
          <ProtectedRoute>
            <NovaSolicitacao />
          </ProtectedRoute>
        }
      />

      <Route
        path="/:tenantSlug/painel/nova-solicitacao"
        element={
          <ProtectedRoute>
            <NovaSolicitacao />
          </ProtectedRoute>
        }
      />

      <Route
        path="/painel/nova-solicitacao"
        element={
          <SubdomainOrNotFound>
            <ProtectedRoute>
              <NovaSolicitacao />
            </ProtectedRoute>
          </SubdomainOrNotFound>
        }
      />

      {/* Smart Redirects for Root and unknown paths */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
};

export default MainRoutes;
