/**
 * Serviço de Notificações do Dispositivo (PWA Web Push e Web Notifications)
 * Envia avisos com o ícone oficial da Usina Lins para a barra de status do celular e desktop.
 */

class DeviceNotificationService {
  /**
   * Verifica se as notificações são suportadas pelo navegador/ambiente
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Retorna o status atual da permissão ('granted', 'denied', 'default')
   */
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Solicita permissão ao usuário para emitir notificações no sistema operacional
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.warn('[DeviceNotification] Falha ao solicitar permissão:', err);
      return false;
    }
  }

  /**
   * Emite uma notificação nativa para a bandeja do celular ou tela do computador
   */
  public async showNotification(title: string, body: string, targetUrl: string = '/') {
    if (!this.isSupported()) return;

    if (Notification.permission === 'default') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if (Notification.permission !== 'granted') return;

    const options: NotificationOptions = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'usina-lins-movimentacao',
      data: { url: targetUrl },
      silent: false
    };

    // 1. Tenta via Service Worker (Melhor suporte no Android e PWA instalado)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, options);
          return;
        }
      } catch (err) {
        console.warn('[DeviceNotification] Falha via ServiceWorker, tentando Notification API padrão:', err);
      }
    }

    // 2. Fallback via Web Notification API direta (Desktop)
    try {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn('[DeviceNotification] Erro ao criar notificação nativa:', err);
    }
  }
}

export const deviceNotificationService = new DeviceNotificationService();
