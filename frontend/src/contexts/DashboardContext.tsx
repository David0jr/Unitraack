import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from './AuthContext';

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
      
      // 1. Buscar Monitoramento (Mapa + Operativo)
      const monitoringRes = await dashboardService.getMonitoring();

      // 2. Buscar Requisições (Aprovação)
      const requestsRes = await dashboardService.getDashboard();

      const { sectors, materials, movements } = monitoringRes.data;
      const requests = requestsRes.data;

      // Cálculo de estatísticas rápidas
      const stats = {
        pending: requests.filter((r: any) => r.status === 'PENDING').length,
        active: materials.length,
        completed: movements.length // Simplificação para demonstração
      };

      setState({
        requests,
        sectors,
        materials,
        movements,
        stats,
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setState(prev => ({ ...prev, loading: false, error: 'Falha ao sincronizar dados operacionais.' }));
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    // Refresh automático a cada 60 segundos (Opcional, dependendo da necessidade de Real-Time)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
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
