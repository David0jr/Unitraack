import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { supabaseAdmin } from '../../config/supabase';
import { NotificationService } from '../../services/NotificationService';

export class MarkMaterialForExit {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(materialIds: string[], tenantId: string, profileId: string, signature?: string, photos?: string[], observation?: string): Promise<void> {
    if (!materialIds || materialIds.length === 0) {
      throw new Error('Nenhum material selecionado para baixa.');
    }

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
        undefined, // Saída da Usina (to_sector_id null para não conflitar com o setor do Líder de Portaria)
        signature,
        photos,
        observation
      );
    }

    try {
      const { data: firstMat, error: matErr } = await supabaseAdmin
        .from('materials')
        .select('request:entry_requests(*, profile:profiles!profile_id(full_name))')
        .eq('id', materialIds[0])
        .maybeSingle();

      if (matErr) {
        console.error('[MarkMaterialForExit] Erro ao buscar dados da requisição:', matErr.message);
      }

      if (firstMat?.request) {
        const reqObj: any = Array.isArray(firstMat.request) ? firstMat.request[0] : firstMat.request;
        if (reqObj?.id) {
          const { data: allMats } = await supabaseAdmin
            .from('materials')
            .select('status')
            .eq('request_id', reqObj.id);

          const allLeaving = allMats?.every((m: any) => m.status === 'WAITING_EXIT' || m.status === 'OUT_PLANTA');
          if (allLeaving) {
            await this.requestRepository.updateStatus(reqObj.id, 'WAITING_EXIT', undefined, profileId);
          }
        }
        await NotificationService.notifyExitWaiting(reqObj, materialIds.length);
      }
    } catch (e) {
      console.error('[MarkMaterialForExit] Erro ao disparar notificação:', e);
    }
  }
}
