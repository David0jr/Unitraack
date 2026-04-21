import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

import TerceirizadaDashboard from '../pages/TerceirizadaDashboard';
import LiderDashboard from '../pages/LiderDashboard';
import PortariaDashboard from '../pages/PortariaDashboard';
import GestorDashboard from '../pages/GestorDashboard';
import SuperAdminDashboard from '../pages/SuperAdminDashboard';
import { DashboardProvider } from '../contexts/DashboardContext';

export default function RoleDispatcher() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchRole() {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted) {
          if (error) {
            console.error("Erro ao buscar role:", error);
            setRole('TERCEIRIZADA'); // Fallback
          } else if (data) {
            setRole(data.role);
          } else {
            console.warn("Perfil não encontrado para o usuário.");
            setRole('TERCEIRIZADA'); // Fallback para novos usuários
          }
        }
      } catch (err) {
        console.error("Crash ao buscar role:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRole();
    return () => { isMounted = false };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Direcionamento Roteado Componentizado
  switch (role) {
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
          Contate a administração. Role detectado: {role || 'Nenhum'}
        </div>
      );
  }
}
