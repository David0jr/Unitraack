import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class ConfirmEntry {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, checkInBy: string): Promise<void> {
    const request = await this.requestRepository.findById(requestId);
    
    if (!request) {
      throw new Error('Requisição não encontrada.');
    }

    if (request.status !== 'APPROVED_LIDER' && request.status !== 'APPROVED_GESTOR') {
      throw new Error('Requisição não possui aprovação necessária para entrada.');
    }

    await this.requestRepository.updateStatus(requestId, 'IN_PLANTA', undefined, checkInBy);
  }
}
