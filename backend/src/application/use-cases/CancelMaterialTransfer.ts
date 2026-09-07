import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class CancelMaterialTransfer {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], movedBy: string, tenantId: string): Promise<void> {
    if (!materialIds || materialIds.length === 0) throw new Error('Nenhum material selecionado.');
    
    // Líder remetente cancela o envio dos materiais, revertendo status para 'IN_PLANTA'
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
