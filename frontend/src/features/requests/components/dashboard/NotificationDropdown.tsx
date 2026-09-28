import React, { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, CheckCheck, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useNotifications } from '../../../../contexts/NotificationContext';
import type { NotificationItem } from '../../../../contexts/NotificationContext';
import { useAuth } from '../../../../contexts/AuthContext';

export type { NotificationItem };

export const NotificationDropdown: React.FC = () => {
  const { profile } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    soundEnabled,
    toggleSound,
    playNotificationSound
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPortaria = profile?.role === 'PORTARIA';

  // Para a equipe de portaria/controle de acesso, foca em avisos de saída de equipamentos
  const displayedNotifications = isPortaria 
    ? notifications.filter(n => n.type === 'EXIT_WAITING' || n.role === 'PORTARIA')
    : notifications;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sanitiza títulos removendo qualquer emoji legado
  const cleanTitle = (title: string) => {
    if (!title) return '';
    return title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const safeStr = (!dateStr.includes('Z') && !dateStr.includes('+')) ? `${dateStr}Z` : dateStr;
      const date = new Date(safeStr);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Agora';
      if (diffMin < 60) return `Há ${diffMin} min`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `Há ${diffHours}h`;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  const getTypeDotColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'DISCREPANCY':
        return 'bg-rose-500';
      case 'ARRIVAL':
        return 'bg-blue-500';
      case 'ANALYSIS':
        return 'bg-amber-500';
      case 'IN_PLANTA':
      case 'EXIT_COMPLETED':
        return 'bg-emerald-500';
      case 'EXIT_WAITING':
      case 'EXIT_CONFERENCE':
        return 'bg-blue-600';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative flex items-center justify-center h-9 w-9 rounded-xl border transition-all shadow-sm ${
          unreadCount > 0 
            ? 'border-emerald-200 bg-emerald-50/50 text-navy hover:bg-emerald-50' 
            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
        }`}
        title="Notificações e Avisos Sonoros"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-navy animate-bounce duration-1000' : 'text-slate-600'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header limpo e profissional */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">
                {isPortaria ? 'Avisos da Portaria' : 'Notificações'}
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Botão de Som / Mudo */}
              <button
                onClick={toggleSound}
                className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                  soundEnabled 
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                    : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600'
                }`}
                title={soundEnabled ? 'Alerta sonoro ativado (Clique para mutar)' : 'Alerta sonoro desativado (Clique para ativar)'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-medium text-slate-500 hover:text-navy transition-colors flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-white"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Lidas</span>
                </button>
              )}

              {displayedNotifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-white"
                  title="Limpar todas as notificações"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {displayedNotifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-semibold text-slate-500">
                  Nenhuma notificação no momento
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Você está em dia com todas as atualizações.
                </p>
                <div className="mt-4">
                  <button
                    onClick={playNotificationSound}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-primary" /> Testar Som do Alerta
                  </button>
                </div>
              </div>
            ) : (
              displayedNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.read && markAsRead(item.id)}
                  className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                    !item.read ? 'bg-emerald-50/20' : 'bg-white'
                  }`}
                >
                  {/* Ponto indicador de status */}
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getTypeDotColor(item.type)}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-navy truncate">
                        {cleanTitle(item.title)}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                      {item.message}
                    </p>
                  </div>

                  {!item.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
