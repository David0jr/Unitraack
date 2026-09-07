import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class CancelByGatekeeper {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, tenantId: string, reason: string, profileId: string): Promise<void> {
    const existing = await this.requestRepository.findById(requestId);
    if (!existing) throw new Error('Solicitação não encontrada.');

    // Validar isolamento de tenant
    if (existing.tenant_id !== tenantId) {
      throw new Error('Acesso negado: Esta requisição não pertence à sua unidade.');
    }

    // Apenas requisições que estão esperando entrada (aprovadas) podem ser canceladas por não comparecimento
    if (!['APPROVED_GESTOR', 'APPROVED_LIDER', 'APPROVED'].includes(existing.status)) {
      throw new Error(`Apenas solicitações com status de aprovado aguardando entrada podem ser canceladas pela portaria. Status atual: ${existing.status}`);
    }

    const defaultReason = reason || 'Cancelado pela Portaria: Não compareceu na data/prazo estimado';

    await this.requestRepository.updateStatus(requestId, 'CANCELED', defaultReason, profileId);
  }
}
