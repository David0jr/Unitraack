import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class AcceptMaterialTransfer {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], sectorId: string, movedBy: string, tenantId: string, signature?: string): Promise<void> {
    if (materialIds.length === 0) throw new Error('Nenhum material selecionado.');
    
    // Precisamos pegar o setor de origem (que está no current_sector_id antes de aceitarmos)
    const firstMaterial = await this.requestRepository.findMaterialById(materialIds[0]);
    const fromSectorId = firstMaterial?.current_sector_id;

    // Líder aceita os materiais, mudando status para 'IN_PLANTA' no seu setor
    await this.requestRepository.updateMultipleMaterialsStatus(
      materialIds,
      'IN_PLANTA',
      undefined,
      movedBy,
      tenantId,
      fromSectorId || undefined,
      sectorId,
      signature,
      undefined, // photos
      null, // pendingSectorId cleared
      true // logMovement
    );
  }
}
