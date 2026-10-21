import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { DashboardSidebar } from '../../requests/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '../../requests/components/dashboard/DashboardHeader';
import { DashboardStats } from '../../requests/components/dashboard/DashboardStats';
import { DiscrepanciesTracker } from '../../requests/components/dashboard/DiscrepanciesTracker';
import { PendingApprovals } from '../../requests/components/dashboard/PendingApprovals';
import AuditSection from '../../requests/components/AuditSection';
import MonitoringDashboard from '../components/MonitoringDashboard';
import TeamManagement from '../../admin/components/TeamManagement';
import InteractiveMap from '../components/InteractiveMap';
import ThirdPartiesReport from '../components/ThirdPartiesReport';
import { MobileNav } from '../../requests/components/dashboard/MobileNav';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Map as MapIcon, 
  BarChart3,
  PieChart
} from 'lucide-react';

export default function GestorDashboard() {
  const { profile: managerProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('approvals');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [auditFilterText, setAuditFilterText] = useState('');
  const [selectedAuditProfileId, setSelectedAuditProfileId] = useState<string | null>(null);

  const handleSectionChange = (section: string, parentId?: string | null) => {
    setActiveSection(section);
    if (parentId !== undefined) {
      setSelectedParentId(parentId);
    }
  };

  const getTeamTab = (section: string): 'register' | 'invite' | 'list' | 'sectors' => {
    if (section === 'team-invite') return 'invite';
    if (section === 'team-members') return 'list';
    if (section === 'team-sectors') return 'sectors';
    return 'register';
  };

  const handleTeamTabChange = (tab: 'register' | 'invite' | 'list' | 'sectors') => {
    const map: Record<string, string> = {
      register: 'team-register',
      invite: 'team-invite',
      list: 'team-members',
      sectors: 'team-sectors'
    };
    setActiveSection(map[tab] || 'team-register');
  };

  const isTeamSection = activeSection === 'team' || activeSection.startsWith('team-');

  const navItems = [
    { id: 'approvals', label: 'Painel', icon: <LayoutDashboard /> },
    { id: 'team', label: 'Equipe', icon: <Users /> },
    { id: 'monitoring', label: 'Rastro', icon: <MapPin /> },
    { id: 'map', label: 'Mapa', icon: <MapIcon /> },
    { id: 'audit', label: 'Auditoria', icon: <BarChart3 /> },
    { id: 'reports', label: 'Relatórios', icon: <PieChart /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] flex-col lg:flex-row">
      <DashboardSidebar 
        activeSection={activeSection} 
        setActiveSection={handleSectionChange}
        selectedParentId={selectedParentId}
        userName={managerProfile?.full_name}
        userRole={managerProfile?.role}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {activeSection !== 'map' && <DashboardHeader section={activeSection} />}
        
        <main className={`flex-1 overflow-y-auto custom-scrollbar ${
          activeSection === 'map' ? 'p-0 lg:p-6 overflow-hidden h-full' : 'p-6 lg:p-10'
        } pb-24 lg:pb-12`}>

          {activeSection === 'approvals' ? (
            <div className="space-y-8 lg:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DashboardStats />
              <DiscrepanciesTracker />
              <PendingApprovals />
            </div>
          ) : isTeamSection ? (
            <TeamManagement 
              tenantId={managerProfile?.tenant_id || ''} 
              usinaCnpj={managerProfile?.cnpj || ''} 
              activeTab={getTeamTab(activeSection)}
              onTabChange={handleTeamTabChange}
            />
          ) : activeSection === 'monitoring' ? (
            <MonitoringDashboard parentSectorId={selectedParentId} />
          ) : activeSection === 'map' ? (
            <div className="h-full w-full animate-in fade-in duration-500">
               <InteractiveMap />
            </div>
          ) : activeSection === 'audit' ? (
            <AuditSection 
              tenantId={managerProfile?.tenant_id || ''} 
              filterText={auditFilterText}
              setFilterText={setAuditFilterText}
              selectedProfileId={selectedAuditProfileId}
              setSelectedProfileId={setSelectedAuditProfileId}
            />
          ) : activeSection === 'reports' ? (
            <ThirdPartiesReport />
          ) : (
            <div className="p-8 md:p-12 text-center bg-white rounded-2xl border border-slate-100">
              <p className="text-navy font-bold text-sm uppercase">Seção em Desenvolvimento</p>
              <p className="text-slate-400 text-xs mt-1">Esta funcionalidade será liberada em breve.</p>
            </div>
          )}
        </main>

        <MobileNav 
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          items={navItems}
        />
      </div>
    </div>
  );
}
