import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class TransferMaterial {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], fromSectorId: string, toSectorId: string, movedBy: string, tenantId: string, signature?: string, photos?: string[], observation?: string): Promise<void> {
    if (materialIds.length === 0) throw new Error('Nenhum material selecionado.');
    if (fromSectorId && toSectorId && fromSectorId === toSectorId) {
      throw new Error('O setor de destino deve ser diferente do setor de origem do material.');
    }
    
    await this.requestRepository.updateMultipleMaterialsStatus(
      materialIds,
      'MOVING',
      undefined,
      movedBy,
      tenantId,
      fromSectorId,
      toSectorId, // toSectorId
      signature,
      photos, // photos
      toSectorId, // pendingSectorId
      true, // logMovement
      observation // observation
    );
  }
}
