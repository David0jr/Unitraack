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
  user_id?: string | null;
  read_by?: string[];
  dismissed_by?: string[];
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

  const currentUserId = user?.id || profile?.id;

  // Função auxiliar para mapear cada notificação com o estado exclusivo deste usuário
  const mapUserNotification = useCallback((item: any): NotificationItem | null => {
    if (!item) return null;
    const uid = currentUserId;

    // Se foi dispensada/limpa por este usuário, oculta apenas para ele
    if (uid && Array.isArray(item.dismissed_by) && item.dismissed_by.includes(uid)) {
      return null;
    }

    // Se for exclusiva de outro usuário, oculta
    if (uid && item.user_id && item.user_id !== uid) {
      return null;
    }

    // O status de lida é EXCLUSIVO e individual para este usuário:
    const isReadForThisUser = uid && Array.isArray(item.read_by)
      ? item.read_by.includes(uid)
      : Boolean(item.user_id === uid && item.read);

    return {
      ...item,
      read: isReadForThisUser
    };
  }, [currentUserId]);

  const displayedNotifications = isPortaria
    ? notifications.filter(n => n.type === 'EXIT_WAITING' || n.role === 'PORTARIA')
    : notifications;

  const unreadCount = displayedNotifications.filter(n => !n.read).length;

  const fetchNotificationsFromSupabase = useCallback(async () => {
    if (!profile?.tenant_id) return;
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (profile.role === 'PORTARIA') {
        query = query.or('type.eq.EXIT_WAITING,role.eq.PORTARIA');
      } else if (profile.role === 'LIDER') {
        query = query.neq('type', 'EXIT_WAITING');
        if (profile.sector_id) {
          query = query.or(`sector_id.is.null,sector_id.eq.${profile.sector_id}`);
        }
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const mapped = data
          .map(mapUserNotification)
          .filter((n): n is NotificationItem => n !== null);
        setNotifications(mapped);
      }
    } catch (err) {
      console.warn('[NotificationContext] Falha no fallback Supabase:', err);
    }
  }, [profile?.tenant_id, profile?.role, profile?.sector_id, mapUserNotification]);

  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);
      if (token) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const payload = await response.json();
          const items = Array.isArray(payload.data) ? payload.data : [];
          const mapped = items
            .map(mapUserNotification)
            .filter((n): n is NotificationItem => n !== null);
          setNotifications(mapped);
          return;
        }
      }
      // Fallback resiliente: se a API retornar 404 (ex: deploy pendente no Railway), busca do Supabase
      await fetchNotificationsFromSupabase();
    } catch (err) {
      console.warn('[NotificationContext] API indisponível, acionando fallback Supabase:', err);
      await fetchNotificationsFromSupabase();
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id, fetchNotificationsFromSupabase, mapUserNotification]);

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
          const rawItem = payload.new as any;
          const newNotif = mapUserNotification(rawItem);
          if (!newNotif) return;

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
  }, [profile?.tenant_id, profile?.role, profile?.sector_id, soundEnabled, fetchNotifications, mapUserNotification]);

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
      let apiSuccess = false;
      if (token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          apiSuccess = res.ok;
        } catch (_) {}
      }
      if (!apiSuccess && currentUserId) {
        const { data: currentNotif } = await supabase
          .from('notifications')
          .select('read_by')
          .eq('id', id)
          .maybeSingle();
        const readBy: string[] = Array.isArray(currentNotif?.read_by) ? currentNotif.read_by : [];
        if (!readBy.includes(currentUserId)) {
          readBy.push(currentUserId);
          await supabase.from('notifications').update({ read_by: readBy }).eq('id', id);
        }
      }
    } catch (err) {
      console.error('[NotificationContext] Erro ao marcar como lida:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => isPortaria && n.type !== 'EXIT_WAITING' ? n : { ...n, read: true }));
      const token = getAuthToken();
      let apiSuccess = false;
      if (token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          apiSuccess = res.ok;
        } catch (_) {}
      }
      if (!apiSuccess && currentUserId) {
        for (const notif of notifications) {
          const currentReadBy: string[] = Array.isArray(notif.read_by) ? notif.read_by : [];
          if (!currentReadBy.includes(currentUserId)) {
            currentReadBy.push(currentUserId);
            await supabase.from('notifications').update({ read_by: currentReadBy }).eq('id', notif.id);
          }
        }
      }
    } catch (err) {
      console.error('[NotificationContext] Erro ao marcar todas como lidas:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const itemsToDismiss = [...notifications];
      setNotifications([]);
      const token = getAuthToken();
      let apiSuccess = false;
      if (token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/clear-all`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          apiSuccess = res.ok;
        } catch (_) {}
      }
      if (!apiSuccess && currentUserId) {
        for (const notif of itemsToDismiss) {
          const currentDismissedBy: string[] = Array.isArray(notif.dismissed_by) ? notif.dismissed_by : [];
          if (!currentDismissedBy.includes(currentUserId)) {
            currentDismissedBy.push(currentUserId);
            await supabase.from('notifications').update({ dismissed_by: currentDismissedBy }).eq('id', notif.id);
          }
        }
      }
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
