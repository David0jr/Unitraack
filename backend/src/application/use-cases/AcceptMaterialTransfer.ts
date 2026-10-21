import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { supabaseAdmin } from '../../config/supabase';

export class AcceptMaterialTransfer {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], sectorId: string, movedBy: string, tenantId: string, signature?: string, photos?: string[], observation?: string): Promise<void> {
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
      photos,
      null, // pendingSectorId cleared
      false, // Não duplicar: o envio já registrou o rastro de movimentação de fromSectorId para sectorId
      observation
    );

    // Complementar o registro de movimentação com o visto e evidências do líder recebedor
    for (const mId of materialIds) {
      const { data: latestMove } = await supabaseAdmin
        .from('material_movements')
        .select('id, observation, photos')
        .eq('material_id', mId)
        .eq('to_sector_id', sectorId)
        .order('moved_at', { ascending: false })
        .limit(1);

      if (latestMove?.[0]?.id) {
        const moveId = latestMove[0].id;
        const currentObs = latestMove[0].observation ? `${latestMove[0].observation} | ` : '';
        const existingPhotos = latestMove[0].photos || [];
        const combinedPhotos = photos && photos.length > 0 ? [...existingPhotos, ...photos] : existingPhotos;
        const note = signature ? `Recebido e aceito no destino (Visto: ${signature})` : 'Recebido e aceito no destino';

        await supabaseAdmin
          .from('material_movements')
          .update({
            observation: `${currentObs}${note}`,
            photos: combinedPhotos.length > 0 ? combinedPhotos : null
          })
          .eq('id', moveId);
      }
    }
  }
}
