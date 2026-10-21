import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { supabaseAdmin } from '../../config/supabase';

export class CancelMaterialTransfer {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], movedBy: string, tenantId: string): Promise<void> {
    if (!materialIds || materialIds.length === 0) throw new Error('Nenhum material selecionado.');
    
    // 1. Buscar os materiais antes de alterar para identificar os setores envolvidos
    const materials = await Promise.all(
      materialIds.map(id => this.requestRepository.findMaterialById(id))
    );

    // 2. Deletar os registros de movimentação pendente gravados no envio que foram cancelados
    for (const mat of materials) {
      if (mat) {
        const destSectorId = mat.pending_sector_id;
        if (destSectorId) {
          // Deleta a movimentação cancelada para não poluir o histórico nem as movimentações de ambos os setores
          const { error: delErr } = await supabaseAdmin
            .from('material_movements')
            .delete()
            .eq('material_id', mat.id)
            .eq('to_sector_id', destSectorId);

          if (delErr) {
            console.error(`[CancelMaterialTransfer] Erro ao remover movimentação pendente do material ${mat.id}:`, delErr.message);
          }
        }
      }
    }

    // 3. Líder remetente cancela o envio dos materiais, revertendo status para 'IN_PLANTA'
    // e limpando o pending_sector_id. Não loga movimento de transferência.
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
