import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class TransferMaterial {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], fromSectorId: string, toSectorId: string, movedBy: string, tenantId: string, signature?: string, photos?: string[], observation?: string): Promise<void> {
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
      photos, // photos
      toSectorId, // pendingSectorId
      false, // logMovement
      observation // observation
    );
  }
}
