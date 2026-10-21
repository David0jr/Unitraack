import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { NotificationService } from '../../services/NotificationService';

export class CancelByGatekeeper {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, tenantId: string, reason: string, profileId: string): Promise<void> {
    const existing = await this.requestRepository.findById(requestId);
    if (!existing) throw new Error('Solicitação não encontrada.');

    // Validar isolamento de tenant
    if (existing.tenant_id !== tenantId) {
      throw new Error('Acesso negado: Esta requisição não pertence à sua unidade.');
    }

    // Requisições aguardando entrada, em chegada, em análise ou com divergência podem ser canceladas
    const cancelableStatuses = [
      'APPROVED_GESTOR',
      'APPROVED_LIDER',
      'APPROVED',
      'WAITING_ARRIVAL',
      'ARRIVED',
      'IN_ANALYSIS',
      'DISCREPANCY'
    ];

    if (!cancelableStatuses.includes(existing.status)) {
      throw new Error(`Esta solicitação não pode ser cancelada pela portaria. Status atual: ${existing.status}`);
    }

    const defaultReason = reason || 'Cancelado pela Portaria: Não compareceu na data/prazo estimado';

    await this.requestRepository.updateStatus(requestId, 'CANCELED', defaultReason, profileId);

    NotificationService.notifyEntryCancelledByGatekeeper(existing, defaultReason).catch((err) =>
      console.error('[CancelByGatekeeper] Erro ao enviar notificação de cancelamento:', err)
    );
  }
}
