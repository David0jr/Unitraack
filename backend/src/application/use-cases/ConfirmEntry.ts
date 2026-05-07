import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class ConfirmEntry {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, checkInBy: string, tenantId: string): Promise<void> {
    const request = await this.requestRepository.findById(requestId);
    
    if (!request) {
      throw new Error('Requisição não encontrada.');
    }

    // SECURITY: Valida se a requisição pertence à usina do usuário
    if (request.tenant_id !== tenantId) {
      throw new Error('Acesso negado: Esta solicitação pertence a outra unidade.');
    }

    if (request.status !== 'APPROVED_LIDER' && request.status !== 'APPROVED_GESTOR') {
      throw new Error('Requisição não possui aprovação necessária para entrada.');
    }

    await this.requestRepository.updateStatus(requestId, 'IN_PLANTA', undefined, checkInBy);
  }
}
