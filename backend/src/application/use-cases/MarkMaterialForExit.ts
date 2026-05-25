import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { supabaseAdmin } from '../../config/supabase';

export class MarkMaterialForExit {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], tenantId: string, profileId: string, signature?: string): Promise<void> {
    if (!materialIds || materialIds.length === 0) {
      throw new Error('Nenhum material selecionado para baixa.');
    }

    // Buscar setor da Portaria
    const portariaSectorId = await this.requestRepository.findSectorByName(tenantId, 'Portaria');
    
    // Para cada material, devemos garantir que pertence a uma requisição do mesmo tenant
    for (const matId of materialIds) {
      const { data: material, error } = await supabaseAdmin
        .from('materials')
        .select('*, request:entry_requests(tenant_id, sector_id)')
        .eq('id', matId)
        .maybeSingle();
      
      if (error || !material) throw new Error(`Material ${matId} não encontrado.`);
      if (material.request.tenant_id !== tenantId) {
        throw new Error('Acesso negado. Material pertence a outro tenant.');
      }

      // O material deve estar em planta
      if (material.status !== 'IN_PLANTA' && material.status !== 'WAITING_EXIT') {
        throw new Error(`O material ${material.name} não pode receber baixa (status atual: ${material.status}).`);
      }

      await this.requestRepository.updateMaterialStatus(
        matId,
        'WAITING_EXIT',
        undefined, // Não marca exit_at ainda, isso é na portaria
        profileId,
        tenantId,
        material.current_sector_id || material.request.sector_id,
        portariaSectorId || undefined,
        signature
      );
    }
  }
}
