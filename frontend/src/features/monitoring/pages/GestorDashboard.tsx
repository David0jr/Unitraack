import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useDashboard } from '../../../contexts/DashboardContext';
import { Search } from 'lucide-react';

// Novas Sub-componentes Modularizadas
import { DashboardSidebar } from '../../requests/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '../../requests/components/dashboard/DashboardHeader';
import { DashboardStats } from '../../requests/components/dashboard/DashboardStats';
import { PendingApprovals } from '../../requests/components/dashboard/PendingApprovals';
import { AdminSidebar } from '../../requests/components/dashboard/AdminSidebar';

// Componentes Complexos Existentes
import TeamManagement from '../../admin/components/TeamManagement';
import MonitoringDashboard from '../components/MonitoringDashboard';
import InteractiveMap from '../components/InteractiveMap';
import AuditSection from '../../requests/components/AuditSection';

/**
 * Painel Principal do Gestor de Segurança.
 * Gerencia o estado visual (navegação) e delega a lógica de dados para o DashboardContext.
 */
export default function GestorDashboard() {
  const { user } = useAuth();
  const {} = useDashboard();
  const [activeSection, setActiveSection] = useState<string>('approvals');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [auditFilterText, setAuditFilterText] = useState('');
  const [selectedAuditProfileId, setSelectedAuditProfileId] = useState<string | null>(null);
  const { sectors } = useDashboard();
  const [managerProfile, setManagerProfile] = useState<{tenant_id: string, cnpj?: string, full_name?: string, role?: string} | null>(null);

  const selectedParent = sectors.find(s => s.id === selectedParentId);

  // Perfil específico permanece local por ser dados de sessão prolongada
  useEffect(() => {
    async function fetchManagerProfile() {
      if (!user) return;
      // Buscamos o perfil e incluímos o CNPJ do Tenant associado
      const { data } = await supabase
        .from('profiles')
        .select('tenant_id, full_name, role, tenant:tenants(cnpj)')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setManagerProfile({
          tenant_id: data.tenant_id,
          full_name: data.full_name,
          role: data.role,
          cnpj: (data as any).tenant?.cnpj
        });
      }
    }
    fetchManagerProfile();
  }, [user]);

  const handleSetSection = (section: string, parentId: string | null = null) => {
    setActiveSection(section);
    setSelectedParentId(parentId);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-brand antialiased text-navy overflow-hidden">
      
      {/* Sidebar Vertical (Modularizada) */}
      <DashboardSidebar 
        activeSection={activeSection} 
        setActiveSection={handleSetSection}
        selectedParentId={selectedParentId}
        userName={managerProfile?.full_name}
        userRole={managerProfile?.role}
      />

      <div className="flex-1 h-screen overflow-y-auto">
        
        {/* Header Superior (Modularizada) */}
        <DashboardHeader section={activeSection} />

        <main className="max-w-7xl mx-auto px-10 py-12">
        
          {/* Título e Subtítulo Sensível ao Contexto */}
          <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">
                {activeSection === 'approvals' && <>Análise e <span className="text-primary italic">Conformidade</span></>}
                {activeSection === 'team' && <>Gestão de <span className="text-primary italic">Diretores</span></>}
                {activeSection === 'monitoring' && (
                  <>
                    Monitoramento <span className="text-primary italic">{selectedParent ? selectedParent.name : 'Operacional'}</span>
                  </>
                )}
                {activeSection === 'map' && <>Gêmeo Digital <span className="text-primary italic">Indústria 4.0</span></>}
                {activeSection === 'audit' && <>Central de <span className="text-primary italic">Auditoria</span></>}
              </h2>
              <p className="text-slate-400 font-medium">
                {activeSection === 'approvals' && 'Controle centralizado de todas as operações de entrada de terceiros.'}
                {activeSection === 'team' && 'Gerenciamento de acessos e permissões administrativas.'}
                {activeSection === 'monitoring' && (selectedParent ? `Acompanhamento específico da unidade ${selectedParent.name}.` : 'Acompanhamento em tempo real de ativos e movimentações.')}
                {activeSection === 'map' && 'Visualização espacial e layout dinâmico das unidades.'}
                {activeSection === 'audit' && 'Rastreabilidade completa e histórico de permanência.'}
              </p>
            </div>

            {activeSection === 'audit' && !selectedAuditProfileId && (
              <div className="relative group animate-in fade-in zoom-in-95 duration-500">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="BUSCAR EMPRESA OU TÉCNICO..."
                  value={auditFilterText}
                  onChange={e => setAuditFilterText(e.target.value)}
                  className="pl-11 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-navy uppercase tracking-widest placeholder:text-slate-300 focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all w-full md:w-80 shadow-sm"
                />
              </div>
            )}
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
            <MonitoringDashboard parentSectorId={selectedParentId} />
          ) : activeSection === 'map' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <InteractiveMap />
            </div>
          ) : (
            <AuditSection 
              tenantId={managerProfile?.tenant_id || ''} 
              filterText={auditFilterText}
              setFilterText={setAuditFilterText}
              selectedProfileId={selectedAuditProfileId}
              setSelectedProfileId={setSelectedAuditProfileId}
            />
          )}
        </main>
      </div>
    </div>
  );
}

