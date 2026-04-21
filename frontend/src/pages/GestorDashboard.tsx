import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useDashboard } from '../contexts/DashboardContext';

// Novas Sub-componentes Modularizadas
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { PendingApprovals } from '../components/dashboard/PendingApprovals';
import { AdminSidebar } from '../components/dashboard/AdminSidebar';

// Componentes Complexos Existentes
import TeamManagement from '../components/TeamManagement';
import MonitoringDashboard from '../components/MonitoringDashboard';
import InteractiveMap from '../components/InteractiveMap';
import AuditSection from '../components/AuditSection';

/**
 * Painel Principal do Gestor de Segurança.
 * Gerencia o estado visual (navegação) e delega a lógica de dados para o DashboardContext.
 */
export default function GestorDashboard() {
  const { user } = useAuth();
  const {} = useDashboard();
  const [activeSection, setActiveSection] = useState<'approvals' | 'team' | 'monitoring' | 'map' | 'audit'>('approvals');
  const [managerProfile, setManagerProfile] = useState<{tenant_id: string, cnpj: string, full_name?: string, role?: string} | null>(null);

  // Perfil específico permanece local por ser dados de sessão prolongada
  useEffect(() => {
    async function fetchManagerProfile() {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('tenant_id, cnpj, full_name, role')
        .eq('id', user.id)
        .single();
      if (data) setManagerProfile(data);
    }
    fetchManagerProfile();
  }, [user]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-brand antialiased text-navy overflow-hidden">
      
      {/* Sidebar Vertical (Modularizada) */}
      <DashboardSidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        userName={managerProfile?.full_name}
        userRole={managerProfile?.role}
      />

      <div className="flex-1 h-screen overflow-y-auto">
        
        {/* Header Superior (Modularizada) */}
        <DashboardHeader section={activeSection} />

        <main className="max-w-7xl mx-auto px-10 py-12">
        
          {/* Título e Subtítulo Sensível ao Contexto */}
          <section className="mb-10">
            <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">
              {activeSection === 'approvals' && <>Análise e <span className="text-primary italic">Conformidade</span></>}
              {activeSection === 'team' && <>Gestão de <span className="text-primary italic">Diretores</span></>}
              {activeSection === 'monitoring' && <>Monitoramento <span className="text-primary italic">Operacional</span></>}
              {activeSection === 'map' && <>Gêmeo Digital <span className="text-primary italic">Indústria 4.0</span></>}
              {activeSection === 'audit' && <>Central de <span className="text-primary italic">Auditoria</span></>}
            </h2>
            <p className="text-slate-400 font-medium">
              {activeSection === 'approvals' && 'Controle centralizado de todas as operações de entrada de terceiros.'}
              {activeSection === 'team' && 'Gerenciamento de acessos e permissões administrativas.'}
              {activeSection === 'monitoring' && 'Acompanhamento em tempo real de ativos e movimentações.'}
              {activeSection === 'map' && 'Visualização espacial e layout dinâmico das unidades.'}
              {activeSection === 'audit' && 'Rastreabilidade completa e histórico de permanência.'}
            </p>
          </section>

          {/* Área de Conteúdo Dinâmico */}
          {activeSection === 'approvals' ? (
            <div className="animate-in fade-in duration-500">
              <DashboardStats />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <PendingApprovals />
                </div>
                <div className="lg:col-span-1">
                  <AdminSidebar tenantId={managerProfile?.tenant_id || ''} />
                </div>
              </div>
            </div>
          ) : activeSection === 'team' ? (
            <TeamManagement 
              tenantId={managerProfile?.tenant_id || ''} 
              usinaCnpj={managerProfile?.cnpj || ''} 
            />
          ) : activeSection === 'monitoring' ? (
            <MonitoringDashboard />
          ) : activeSection === 'map' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <InteractiveMap />
            </div>
          ) : (
            <AuditSection 
              tenantId={managerProfile?.tenant_id || ''} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
