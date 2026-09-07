import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../features/requests/api/dashboardService';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Interface para os dados consolidados do Dashboard.
 */
interface DashboardState {
  requests: any[];
  sectors: any[];
  materials: any[];
  movements: any[];
  stats: {
    pending: number;
    active: number;
    completed: number;
  };
  loading: boolean;
  error: string | null;
}

interface DashboardContextType extends DashboardState {
  refreshData: () => Promise<void>;
  updateMaterialPosition: (materialId: string, x: number, y: number) => Promise<void>;
  updateMapLayout: (layouts: any[]) => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string, reason: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [state, setState] = useState<DashboardState>({
    requests: [],
    sectors: [],
    materials: [],
    movements: [],
    stats: { pending: 0, active: 0, completed: 0 },
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!token) return;
    
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Buscar dados em paralelo para performance e resiliência
      const [monitoringRes, requestsRes] = await Promise.allSettled([
        dashboardService.getMonitoring(),
        dashboardService.getDashboard()
      ]);

      let sectors = [];
      let materials = [];
      let movements = [];
      let requests = [];

      if (monitoringRes.status === 'fulfilled') {
        const monitoringData = monitoringRes.value.data || {};
        sectors = monitoringData.sectors || [];
        materials = monitoringData.materials || [];
        movements = monitoringData.movements || [];
      } else {
        console.warn('Falha ao carregar dados de monitoramento:', monitoringRes.reason);
      }

      if (requestsRes.status === 'fulfilled') {
        requests = requestsRes.value.data || [];
      } else {
        console.warn('Falha ao carregar dados de requisições:', requestsRes.reason);
      }

      // Cálculo de estatísticas rápidas
      const stats = {
        pending: Array.isArray(requests) ? requests.filter((r: any) => r.status === 'PENDING').length : 0,
        active: materials.length,
        completed: movements.length
      };

      setState({
        requests,
        sectors,
        materials,
        movements,
        stats,
        loading: false,
        error: (monitoringRes.status === 'rejected' && requestsRes.status === 'rejected') ? 'Falha total na conexão.' : null
      });
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setState(prev => ({ ...prev, loading: false, error: 'Falha ao sincronizar dados operacionais.' }));
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    
    // Conecta no Supabase Realtime para ouvir mudanças nas tabelas operacionais
    const channel = supabase
      .channel('gestor_dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        console.log('[Realtime] materials changed, refreshing...');
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'material_movements' }, () => {
        console.log('[Realtime] material_movements changed, refreshing...');
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entry_requests' }, () => {
        console.log('[Realtime] entry_requests changed, refreshing...');
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const approveRequest = async (requestId: string) => {
    await dashboardService.approveRequest(requestId);
    await fetchData();
  };

  const rejectRequest = async (requestId: string, reason: string) => {
    await dashboardService.rejectRequest(requestId, reason);
    await fetchData();
  };

  const updateMaterialPosition = async (materialId: string, x: number, y: number) => {
    await dashboardService.updateMaterialPosition(materialId, x, y);
    // Update local otimista ou refresh
    await fetchData();
  };

  const updateMapLayout = async (layouts: any[]) => {
    await dashboardService.updateMapLayout(layouts);
    await fetchData();
  };

  return (
    <DashboardContext.Provider value={{ 
      ...state, 
      refreshData: fetchData,
      approveRequest,
      rejectRequest,
      updateMaterialPosition,
      updateMapLayout
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard deve ser usado dentro de um DashboardProvider');
  return context;
};
