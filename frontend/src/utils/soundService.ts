/**
 * Serviço de Áudio e Vibração para Notificações do Sistema Usina Lins (PWA & Desktop)
 * Utiliza a Web Audio API sintetizada nativamente para garantir que o som funcione
 * 100% offline, sem depender de downloads de arquivos de áudio externos e com latência zero.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isUnlocked = false;

  constructor() {
    this.initUnlockListener();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    return this.audioCtx;
  }

  /**
   * Navegadores móveis e desktop bloqueiam áudio até a primeira interação do usuário.
   * Este listener desbloqueia o AudioContext no primeiro toque/clique em qualquer lugar da tela.
   */
  private initUnlockListener() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else if (ctx && ctx.state === 'running') {
        this.isUnlocked = true;
      }

      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  /**
   * Toca o sino/chime cristalino característico de nova notificação.
   * Acorde harmonioso em dois tempos (F#5 -> B5) com decay exponencial.
   */
  public playNotificationSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 1ª Nota: F#5 (739.99 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(739.99, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // 2ª Nota mais alta e brilhante: B5 (987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);

      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);

      // Vibração no celular se compatível
      this.triggerVibration();
    } catch (err) {
      console.warn('[SoundService] Não foi possível reproduzir som de notificação:', err);
    }
  }

  /**
   * Dispara padrão de vibração tátil no celular (PWA Android)
   */
  public triggerVibration() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([180, 80, 180]);
      } catch (e) {
        // Ignora caso dispositivo bloqueie
      }
    }
  }
}

export const soundService = new SoundService();
