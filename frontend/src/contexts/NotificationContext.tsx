import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getAuthToken } from '../utils/subdomain';
import { soundService } from '../utils/soundService';
import { deviceNotificationService } from '../utils/deviceNotificationService';
import { Bell, Volume2, VolumeX, X, ShieldAlert, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface NotificationItem {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: 'ARRIVAL' | 'ANALYSIS' | 'IN_PLANTA' | 'EXIT_WAITING' | 'EXIT_CONFERENCE' | 'EXIT_COMPLETED' | 'DISCREPANCY' | 'INFO';
  read: boolean;
  role?: string | null;
  sector_id?: string | null;
  request_id?: string | null;
  created_at: string;
}

interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: NotificationItem['type'];
  time: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  soundEnabled: boolean;
  toggleSound: () => void;
  devicePermission: NotificationPermission;
  requestDevicePermission: () => Promise<boolean>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  playNotificationSound: () => void;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeToast, setActiveToast] = useState<NotificationToast | null>(null);
  
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('usinalins_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [devicePermission, setDevicePermission] = useState<NotificationPermission>(() => {
    return deviceNotificationService.getPermission();
  });

  const isPortaria = profile?.role === 'PORTARIA';

  // Solicita permissão nativa do navegador/dispositivo discretamente na primeira interação
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requestOnInteraction = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        deviceNotificationService.requestPermission().then(() => {
          setDevicePermission(deviceNotificationService.getPermission());
        });
      }
    };
    window.addEventListener('click', requestOnInteraction, { once: true });
    return () => window.removeEventListener('click', requestOnInteraction);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('usinalins_sound_enabled', String(next));
      } catch (e) {}
      if (next) {
        soundService.playNotificationSound();
      }
      return next;
    });
  }, []);

  const requestDevicePermission = useCallback(async () => {
    const granted = await deviceNotificationService.requestPermission();
    setDevicePermission(deviceNotificationService.getPermission());
    if (granted && soundEnabled) {
      soundService.playNotificationSound();
      await deviceNotificationService.showNotification(
        'Notificações Ativadas!',
        'Você receberá alertas sonoros e visuais de movimentações no aparelho.'
      );
    }
    return granted;
  }, [soundEnabled]);

  const displayedNotifications = isPortaria
    ? notifications.filter(n => n.type === 'EXIT_WAITING' || n.role === 'PORTARIA')
    : notifications;

  const unreadCount = displayedNotifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !profile?.tenant_id) return;

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const payload = await response.json();
        setNotifications(Array.isArray(payload.data) ? payload.data : []);
      }
    } catch (err) {
      console.error('[NotificationContext] Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  // Carrega notificações iniciais ao logar
  useEffect(() => {
    if (user && profile?.tenant_id) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?.id, profile?.tenant_id, fetchNotifications]);

  // Listener Realtime global do Postgres para novas notificações
  useEffect(() => {
    if (!profile?.tenant_id) return;

    const channelName = `realtime_notifications_tenant_${profile.tenant_id}`;
    console.log(`[NotificationContext] Subscribing to Realtime channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        async (payload) => {
          const newNotif = payload.new as NotificationItem;
          console.log('[NotificationContext] Nova notificação recebida em tempo real:', newNotif);

          // Filtro de relevância de perfil
          let isRelevant = true;
          if (profile.role === 'PORTARIA') {
            isRelevant = newNotif.type === 'EXIT_WAITING' || newNotif.type === 'ARRIVAL' || newNotif.role === 'PORTARIA';
          } else if (profile.role === 'LIDER') {
            if (newNotif.sector_id && profile.sector_id && newNotif.sector_id !== profile.sector_id) {
              isRelevant = false;
            }
          }

          if (!isRelevant) return;

          // Atualiza lista em memória
          setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);

          // 1. Toca o som característico / vibração
          if (soundEnabled) {
            soundService.playNotificationSound();
          }

          // 2. Dispara notificação do sistema / PWA no aparelho móvel e desktop
          const cleanTitle = newNotif.title ? newNotif.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() : 'Usina Lins';
          await deviceNotificationService.showNotification(
            cleanTitle,
            newNotif.message || 'Houve uma nova movimentação no sistema.'
          );

          // 3. Exibe Toast elegante no topo da tela do aplicativo
          setActiveToast({
            id: newNotif.id,
            title: cleanTitle,
            message: newNotif.message,
            type: newNotif.type,
            time: Date.now()
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id, profile?.role, profile?.sector_id, soundEnabled, fetchNotifications]);

  // Auto-fechamento do Toast em 6 segundos
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      const token = getAuthToken();
      if (!token) return;
      await fetch(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('[NotificationContext] Erro ao marcar como lida:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => isPortaria && n.type !== 'EXIT_WAITING' ? n : { ...n, read: true }));
      const token = getAuthToken();
      if (!token) return;
      await fetch(`${import.meta.env.VITE_API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('[NotificationContext] Erro ao marcar todas como lidas:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      const token = getAuthToken();
      if (!token) return;
      await fetch(`${import.meta.env.VITE_API_URL}/notifications/clear-all`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('[NotificationContext] Erro ao limpar notificações:', err);
    }
  };

  const playNotificationSound = useCallback(() => {
    soundService.playNotificationSound();
  }, []);

  const getToastIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'DISCREPANCY':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'ARRIVAL':
      case 'IN_PLANTA':
      case 'EXIT_COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'EXIT_WAITING':
      case 'EXIT_CONFERENCE':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        soundEnabled,
        toggleSound,
        devicePermission,
        requestDevicePermission,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        refreshNotifications: fetchNotifications,
        playNotificationSound
      }}
    >
      {children}

      {/* Floating In-App Toast Alerta em tempo real com som */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-[99999] max-w-sm w-[calc(100vw-40px)] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-navy/95 backdrop-blur-md text-white p-4 rounded-2xl border border-white/10 shadow-2xl flex items-start gap-3.5">
            <div className="p-2 bg-white/10 rounded-xl shrink-0">
              {getToastIcon(activeToast.type)}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary truncate">
                  {activeToast.title}
                </h4>
                <span className="text-[9px] font-bold text-white/40 uppercase">Agora</span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed mt-1 line-clamp-2">
                {activeToast.message}
              </p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-white/40 hover:text-white transition-colors p-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
