import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { RequestStatus } from '../../domain/entities/EntryRequest';

export type ReviewAction = 'APPROVE' | 'REJECT';

export class ReviewEntryRequest {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, action: ReviewAction, role: string, reviewerId: string, tenantId: string, reason?: string): Promise<void> {
    // Verificar se a requisição existe e pertence ao tenant
    const request = await this.requestRepository.findById(requestId);
    if (!request) throw new Error('Requisição não encontrada.');
    if (request.tenant_id !== tenantId) {
      throw new Error('Acesso negado: Esta requisição não pertence à sua unidade.');
    }

    let newStatus: RequestStatus;

    if (role === 'LIDER_SETOR') {
      newStatus = action === 'APPROVE' ? 'APPROVED_LIDER' : 'REJECTED_LIDER';
    } else if (role === 'GESTOR_SEGURANCA') {
      newStatus = action === 'APPROVE' ? 'APPROVED_GESTOR' : 'REJECTED_GESTOR';
    } else {
      throw new Error('Papel de usuário inválido para esta ação.');
    }

    await this.requestRepository.updateStatus(requestId, newStatus, reason, reviewerId);
  }
}
