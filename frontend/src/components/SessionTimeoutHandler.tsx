import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import Swal from 'sweetalert2';

// 30 minutos de inatividade total (padrão de segurança corporativo)
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export const SessionTimeoutHandler: React.FC = () => {
  const { user, signOut } = useAuth();
  const { slug, isSubdomain } = useTenant();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // Se o usuário não estiver logado, não precisa monitorar
    if (!user) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        console.warn('[Security] Sessão expirada por inatividade prolongada (30 min).');
        
        try {
          await signOut();
        } catch (e) {
          console.error('[Security] Erro ao deslogar por inatividade:', e);
        }

        // Alerta amigável e profissional para o operador
        Swal.fire({
          icon: 'warning',
          title: 'Sessão Expirada',
          text: 'Por medidas de segurança patrimonial, sua sessão foi encerrada após 30 minutos de inatividade.',
          confirmButtonColor: '#0f766e',
          confirmButtonText: 'Fazer Login Novamente'
        }).then(() => {
          const loginPath = isSubdomain ? '/login' : (slug ? `/${slug}/login` : '/admin/login');
          window.location.href = loginPath;
        });
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Eventos monitorados (mouse, teclado, touch em tablets de guarita e scroll)
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Throttle para evitar chamadas excessivas em movimento contínuo de mouse
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimer();
          throttleTimeout = null;
        }, 1000); // Checa no máximo 1x por segundo
      }
    };

    // Inicia o timer
    resetTimer();

    // Registra os listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, signOut, slug, isSubdomain]);

  return null; // Componente lógico, sem renderização visual
};
