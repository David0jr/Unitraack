import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class MarkCheckout {
  constructor(private readonly requestRepo: IRequestRepository) {}

  async execute(id: string, userId: string, tenantId: string): Promise<void> {
    const request = await this.requestRepo.findById(id);
    if (!request) {
      throw new Error('Solicitação não encontrada.');
    }
    
    if (request.tenant_id !== tenantId) {
      throw new Error('Sem permissão para esta solicitação.');
    }

    await this.requestRepo.markCheckout(id, userId);
  }
}
