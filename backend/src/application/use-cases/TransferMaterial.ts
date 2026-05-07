import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class TransferMaterial {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], fromSectorId: string, toSectorId: string, movedBy: string, tenantId: string, signature?: string): Promise<void> {
    if (materialIds.length === 0) throw new Error('Nenhum material selecionado.');
    
    // Quando um líder transfere, o material entra em status 'MOVING' para o próximo setor
    await this.requestRepository.updateMultipleMaterialsStatus(
      materialIds,
      'MOVING',
      undefined,
      movedBy,
      tenantId,
      fromSectorId,
      toSectorId,
      signature
    );
  }
}
