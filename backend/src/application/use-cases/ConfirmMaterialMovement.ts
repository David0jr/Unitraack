import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { MaterialStatus } from '../../domain/entities/EntryRequest';
import { supabaseAdmin } from '../../config/supabase';
import { NotificationService } from '../../services/NotificationService';

export class ConfirmMaterialMovement {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, materialIds: string[], type: 'ENTRY' | 'EXIT', movedBy: string, tenantId: string, signature?: string, photos?: string[], observation?: string): Promise<void> {
    const request = await this.requestRepository.findById(requestId);
    
    if (!request) {
      throw new Error('Requisição não encontrada.');
    }

    // SECURITY: Garantir isolamento de dados (Prevenção IDOR)
    if (request.tenant_id !== tenantId) {
      throw new Error('Acesso negado: Esta requisição pertence a outra unidade industrial.');
    }

    const status: MaterialStatus = type === 'ENTRY' ? 'IN_PLANTA' : 'OUT_PLANTA';
    const timestampField = type === 'ENTRY' ? 'entry_at' : 'exit_at';

    // Buscar o setor de Portaria para vincular à movimentação
    const portariaSectorId = await this.requestRepository.findSectorByName(request.tenant_id, 'Portaria');

    if (type === 'ENTRY') {
      // Helper para buscar o responsável de um setor
      const getSectorResponsible = async (sectorName: string | undefined, isPortaria: boolean = false): Promise<string> => {
        if (isPortaria) return movedBy; // Portaria é sempre quem está operando o sistema no portão
        if (!sectorName) return movedBy;
        
        // 1. Tentar encontrar o Líder do Setor específico (busca flexível)
        const { data: liderData } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('tenant_id', request.tenant_id)
          .eq('role', 'LIDER_SETOR')
          .ilike('sector', `%${sectorName}%`)
          .limit(1);
          
        if (liderData?.[0]) return liderData[0].id;
        
        // 2. Tentar por campo 'sector' (qualquer pessoa do setor - busca flexível)
        const { data: anySectorData } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('tenant_id', request.tenant_id)
          .ilike('sector', `%${sectorName}%`)
          .limit(1);
          
        return anySectorData?.[0]?.id || movedBy;
      };

      // Garantir que temos o ID do setor de destino (fallback por nome se necessário)
      let targetSectorId = request.sector_id;
      if (!targetSectorId && request.sector) {
        targetSectorId = await this.requestRepository.findSectorByName(request.tenant_id, request.sector);
      }

      // Buscar nomes dos setores para a busca
      const { data: sectors } = await supabaseAdmin.from('sectors').select('id, name').in('id', [portariaSectorId, targetSectorId].filter(Boolean));
      const portariaName = sectors?.find(s => s.id === portariaSectorId)?.name;
      const targetName = sectors?.find(s => s.id === targetSectorId)?.name;

      const targetRespId = await getSectorResponsible(targetName);

      // Movimento único: Entrada externa direta para o Setor de Destino
      // Atribuímos a operação a quem está na portaria (movedBy) e registramos a assinatura/fotos
      await this.requestRepository.updateMultipleMaterialsStatus(
          materialIds, 
          status, 
          timestampField,
          movedBy,
          request.tenant_id,
          undefined, // From external (---)
          targetSectorId || undefined,
          signature,
          photos,
          undefined,
          true,
          observation
      );
    } else {
      // Saída definitiva da usina (toSectorId = undefined para indicar SAÍDA)
      const firstMat = await this.requestRepository.findMaterialById(materialIds[0]);
      const currentSectorId = firstMat?.current_sector_id || request.sector_id;

      await this.requestRepository.updateMultipleMaterialsStatus(
          materialIds, 
          status, 
          timestampField, 
          movedBy, 
          request.tenant_id,
          currentSectorId || undefined,
          undefined, // Saída da Planta (to_sector_id nulo para registrar como SAÍDA)
          signature,
          photos,
          undefined,
          true,
          observation
      );
    }

    // Re-buscar para verificar o status global
    const updatedRequest = await this.requestRepository.findById(requestId);
    if (!updatedRequest) return;

    const materials = updatedRequest.materials;
    
    if (type === 'ENTRY') {
      // Se algum material entrou, a requisição passa a estar IN_PLANTA
      // Importante: usamos isFirstEntry para garantir rastro de data/hora mesmo se status já era IN_PLANTA
      const isFirstEntry = (request.status !== 'IN_PLANTA' || !request.gate_checked_at);
      if (materialIds.length > 0 && isFirstEntry) {
        await this.requestRepository.updateStatus(requestId, 'IN_PLANTA', undefined, movedBy);
        NotificationService.notifyInPlanta(updatedRequest, materialIds.length).catch((err) =>
          console.error('[ConfirmMaterialMovement] Erro ao enviar notificacao in_planta:', err)
        );
      }
    } else {
      // Se todos os materiais saíram, a requisição é marcada como COMPLETED
      const allOut = materials.every(m => m.status === 'OUT_PLANTA');
      if (allOut) {
        await this.requestRepository.updateStatus(requestId, 'COMPLETED', undefined, movedBy);
      } else {
        const hasOtherWaiting = materials.some(m => m.status === 'WAITING_EXIT' || m.status === 'EXIT_CONFERENCE');
        if (!hasOtherWaiting) {
          await this.requestRepository.updateStatus(requestId, 'IN_PLANTA', undefined, movedBy);
        }
      }
      NotificationService.notifyExitCompleted(updatedRequest, materialIds.length).catch((err) =>
        console.error('[ConfirmMaterialMovement] Erro ao enviar notificacao exit_completed:', err)
      );
    }
  }
}
