import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { RequestStatus } from '../../domain/entities/EntryRequest';

export type ReviewAction = 'APPROVE' | 'REJECT';

export class ReviewEntryRequest {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, action: ReviewAction, role: string, reviewerId: string, reason?: string): Promise<void> {
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
