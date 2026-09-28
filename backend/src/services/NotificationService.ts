import { supabaseAdmin } from '../config/supabase';
import { AppNotification } from '../types';

export class NotificationService {
  /**
   * Cria uma notificação no sistema e persiste no Supabase.
   */
  static async create(data: {
    tenant_id: string;
    title: string;
    message: string;
    type: AppNotification['type'];
    request_id?: string;
    sector_id?: string | null;
    role?: string | null;
    user_id?: string | null;
  }): Promise<AppNotification | null> {
    try {
      const { data: inserted, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          tenant_id: data.tenant_id,
          title: data.title,
          message: data.message,
          type: data.type,
          request_id: data.request_id || null,
          sector_id: data.sector_id || null,
          role: data.role || null,
          user_id: data.user_id || null,
          read: false
        })
        .select()
        .single();

      if (error) {
        console.error('[NotificationService.create] Erro ao criar notificação:', error);
        return null;
      }
      return inserted;
    } catch (err) {
      console.error('[NotificationService.create] Exceção:', err);
      return null;
    }
  }

  /**
   * Notifica Líderes e Gestores sobre a chegada de um equipamento/empresa na Portaria.
   */
  static async notifyArrival(request: any): Promise<void> {
    const companyName = request.profile?.full_name || 'Empresa';
    const sector = request.sector || 'Setor';
    const driver = request.driver_name ? ` (Motorista: ${request.driver_name})` : '';
    const plate = request.plate ? ` [Placa: ${request.plate}]` : '';

    await this.create({
      tenant_id: request.tenant_id,
      request_id: request.id,
      sector_id: request.sector_id,
      type: 'ARRIVAL',
      title: 'Chegada na Portaria',
      message: `${companyName}${plate} acabou de chegar na portaria para atendimento no setor ${sector}${driver}.`
    });
  }

  /**
   * Notifica Líderes e Gestores que a inspeção/análise foi iniciada na Portaria.
   */
  static async notifyAnalysis(request: any): Promise<void> {
    const companyName = request.profile?.full_name || 'Empresa';
    const sector = request.sector || 'Setor';

    await this.create({
      tenant_id: request.tenant_id,
      request_id: request.id,
      sector_id: request.sector_id,
      type: 'ANALYSIS',
      title: 'Em Análise na Portaria',
      message: `A equipe de portaria iniciou a conferência e inspeção dos itens da empresa ${companyName} (${sector}).`
    });
  }

  /**
   * Notifica Líderes e Gestores que os itens foram liberados e estão fisicamente Em Planta.
   */
  static async notifyInPlanta(request: any, itemsCount: number): Promise<void> {
    const companyName = request.profile?.full_name || 'Empresa';
    const sector = request.sector || 'Setor';

    await this.create({
      tenant_id: request.tenant_id,
      request_id: request.id,
      sector_id: request.sector_id,
      type: 'IN_PLANTA',
      title: 'Entrada Liberada - Em Planta',
      message: `Entrada autorizada! ${itemsCount} equipamento(s) da empresa ${companyName} entraram na planta e estão a caminho do setor ${sector}.`
    });
  }

  /**
   * Notifica divergência na portaria
   */
  static async notifyDiscrepancy(request: any, reason: string): Promise<void> {
    const companyName = request.profile?.full_name || 'Empresa';
    const sector = request.sector || 'Setor';

    await this.create({
      tenant_id: request.tenant_id,
      request_id: request.id,
      sector_id: request.sector_id,
      type: 'DISCREPANCY',
      title: 'Divergência na Portaria',
      message: `Divergência detectada para ${companyName} (${sector}): ${reason}`
    });
  }

  /**
   * Notifica que a saída de equipamentos foi autorizada e está aguardando no portão.
   */
  static async notifyExitWaiting(request: any, itemsCount: number): Promise<void> {
    const companyName = request.profile?.full_name || 'Empresa';
    const sector = request.sector || 'Setor';

    await this.create({
      tenant_id: request.tenant_id,
      request_id: request.id,
      sector_id: request.sector_id,
      role: 'PORTARIA',
      type: 'EXIT_WAITING',
      title: 'Equipamento a Caminho do Controle de Acesso',
      message: `${itemsCount} equipamento(s) da empresa ${companyName} saindo do setor ${sector} para conferência de saída e baixa.`
    });
  }

  /**
   * Notifica início de conferência de saída na Portaria.
   */
  static async notifyExitConference(request: any): Promise<void> {
    const companyName = request.profile?.full_name || 'Empresa';
    const sector = request.sector || 'Setor';

    await this.create({
      tenant_id: request.tenant_id,
      request_id: request.id,
      sector_id: request.sector_id,
      type: 'EXIT_CONFERENCE',
      title: 'Conferência de Saída na Portaria',
      message: `A portaria iniciou a conferência física para saída dos equipamentos da empresa ${companyName} (${sector}).`
    });
  }

  /**
   * Notifica que os equipamentos saíram da usina.
   */
  static async notifyExitCompleted(request: any, itemsCount: number): Promise<void> {
    const companyName = request.profile?.full_name || 'Empresa';
    const sector = request.sector || 'Setor';

    await this.create({
      tenant_id: request.tenant_id,
      request_id: request.id,
      sector_id: request.sector_id,
      type: 'EXIT_COMPLETED',
      title: 'Saída da Usina Concluída',
      message: `Saída concluída! ${itemsCount} equipamento(s) da empresa ${companyName} saíram da planta industrial.`
    });
  }

  /**
   * Notifica o líder do setor de destino sobre uma nova transferência de equipamento.
   */
  static async notifyTransferRequested(
    tenantId: string, 
    fromSectorId: string, 
    toSectorId: string, 
    itemsCount: number
  ): Promise<void> {
    try {
      const { data: fromSector } = await supabaseAdmin.from('sectors').select('name').eq('id', fromSectorId).maybeSingle();
      const { data: toSector } = await supabaseAdmin.from('sectors').select('name').eq('id', toSectorId).maybeSingle();
      
      const fromName = fromSector?.name || 'Outro Setor';
      const toName = toSector?.name || 'Seu Setor';

      await this.create({
        tenant_id: tenantId,
        sector_id: toSectorId,
        type: 'INFO',
        title: 'Transferência Recebida em Trânsito',
        message: `O setor ${fromName} enviou ${itemsCount} equipamento(s) para o seu setor (${toName}). Acesse "Meu Setor" para conferir e realizar o aceite.`
      });
    } catch (err) {
      console.error('[NotificationService.notifyTransferRequested] Erro:', err);
    }
  }

  /**
   * Notifica o líder do setor de destino que o envio foi cancelado pelo líder de origem.
   */
  static async notifyTransferCancelled(
    tenantId: string,
    fromSectorId: string,
    toSectorId: string,
    materialNames: string
  ): Promise<void> {
    try {
      const { data: fromSector } = await supabaseAdmin.from('sectors').select('name').eq('id', fromSectorId).maybeSingle();
      const fromName = fromSector?.name || 'Outro Setor';

      await this.create({
        tenant_id: tenantId,
        sector_id: toSectorId,
        type: 'INFO',
        title: 'Transferência Cancelada pelo Outro Líder',
        message: `O líder do setor ${fromName} cancelou o envio do(s) equipamento(s): ${materialNames}. A transferência foi desfeita e o material retornou à origem.`
      });
    } catch (err) {
      console.error('[NotificationService.notifyTransferCancelled] Erro:', err);
    }
  }

  /**
   * Lista as notificações mais recentes para o usuário / setor / tenant.
   * Se for PORTARIA, retorna EXCLUSIVAMENTE notificações de equipamentos saindo de setores para baixa (EXIT_WAITING).
   */
  static async listByTenant(
    tenantId: string, 
    sectorId?: string, 
    userRole?: string, 
    limit: number = 30
  ): Promise<AppNotification[]> {
    try {
      let query = supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userRole === 'PORTARIA') {
        query = query.or('type.eq.EXIT_WAITING,role.eq.PORTARIA');
      } else if (userRole === 'LIDER_SETOR') {
        query = query.neq('type', 'EXIT_WAITING');
        if (sectorId) {
          query = query.or(`sector_id.is.null,sector_id.eq.${sectorId}`);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error('[NotificationService.listByTenant] Erro:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('[NotificationService.listByTenant] Exceção:', err);
      return [];
    }
  }

  /**
   * Marca uma notificação específica como lida.
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Marca todas as notificações do tenant como lidas (filtrando por role se for portaria).
   */
  static async markAllAsRead(tenantId: string, role?: string): Promise<boolean> {
    try {
      let query = supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('tenant_id', tenantId);

      if (role === 'PORTARIA') {
        query = query.eq('type', 'EXIT_WAITING');
      }

      const { error } = await query;
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Limpa/remove todas as notificações do tenant (filtrando por role se for portaria).
   */
  static async clearAll(tenantId: string, role?: string): Promise<boolean> {
    try {
      let query = supabaseAdmin
        .from('notifications')
        .delete()
        .eq('tenant_id', tenantId);

      if (role === 'PORTARIA') {
        query = query.eq('type', 'EXIT_WAITING');
      }

      const { error } = await query;
      if (error) {
        console.error('[NotificationService.clearAll] Erro ao limpar:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[NotificationService.clearAll] Exceção:', err);
      return false;
    }
  }
}

