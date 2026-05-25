import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class RejectMaterialTransfer {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], movedBy: string, tenantId: string): Promise<void> {
    if (materialIds.length === 0) throw new Error('Nenhum material selecionado.');
    
    // Líder recusa os materiais, mudando status de volta para 'IN_PLANTA' (no setor de origem)
    // e limpando o pending_sector_id. Não loga movimento.
    await this.requestRepository.updateMultipleMaterialsStatus(
      materialIds,
      'IN_PLANTA',
      undefined,
      movedBy,
      tenantId,
      undefined,
      undefined,
      undefined,
      undefined,
      null, // pendingSectorId cleared
      false // logMovement = false
    );
  }
}
