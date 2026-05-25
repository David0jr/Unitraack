import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class TransferMaterial {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], fromSectorId: string, toSectorId: string, movedBy: string, tenantId: string, signature?: string): Promise<void> {
    if (materialIds.length === 0) throw new Error('Nenhum material selecionado.');
    
    await this.requestRepository.updateMultipleMaterialsStatus(
      materialIds,
      'MOVING',
      undefined,
      movedBy,
      tenantId,
      fromSectorId,
      undefined, // toSectorId
      signature,
      undefined, // photos
      toSectorId, // pendingSectorId
      false // logMovement
    );
  }
}
