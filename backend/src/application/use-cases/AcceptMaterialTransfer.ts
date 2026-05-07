import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class AcceptMaterialTransfer {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], sectorId: string, movedBy: string, tenantId: string, signature?: string): Promise<void> {
    if (materialIds.length === 0) throw new Error('Nenhum material selecionado.');
    
    // Líder aceita os materiais, mudando status para 'IN_PLANTA' no seu setor
    await this.requestRepository.updateMultipleMaterialsStatus(
      materialIds,
      'IN_PLANTA',
      undefined,
      movedBy,
      tenantId,
      undefined,
      sectorId,
      signature
    );
  }
}
