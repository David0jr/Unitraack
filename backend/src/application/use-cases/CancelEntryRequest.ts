import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class CancelEntryRequest {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string): Promise<void> {
    const existing = await this.requestRepository.findById(requestId);
    if (!existing) throw new Error('Solicitação não encontrada.');

    if (existing.status !== 'PENDING') {
      throw new Error(`Apenas solicitações em análise podem ser canceladas. Status atual: ${existing.status}`);
    }

    await this.requestRepository.updateStatus(requestId, 'CANCELED');
  }
}
