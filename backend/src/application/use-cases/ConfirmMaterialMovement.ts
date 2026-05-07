import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { MaterialStatus } from '../../domain/entities/EntryRequest';
import { supabaseAdmin } from '../../config/supabase';

export class ConfirmMaterialMovement {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, materialIds: string[], type: 'ENTRY' | 'EXIT', movedBy: string, signature?: string): Promise<void> {
    const request = await this.requestRepository.findById(requestId);
    
    if (!request) {
      throw new Error('Requisição não encontrada.');
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

      // Mov 1: Entrada na Portaria (Responsável é quem está na portaria: movedBy)
      await this.requestRepository.updateMultipleMaterialsStatus(
          materialIds, 
          status, 
          timestampField, 
          movedBy, 
          request.tenant_id,
          undefined,
          portariaSectorId || undefined,
          signature
      );

      // Mov 2: Encaminhamento para o Setor (Atribuímos ao Líder do Setor que aprovou a entrada)
      await this.requestRepository.updateMultipleMaterialsStatus(
          materialIds, 
          status, 
          undefined,
          request.approved_leader_by || targetRespId, // Atribuímos ao responsável do setor de destino
          request.tenant_id,
          portariaSectorId || undefined,
          targetSectorId || undefined,
          signature
      );
    } else {
      // Saída: Setor Alvo -> Portaria
      await this.requestRepository.updateMultipleMaterialsStatus(
          materialIds, 
          status, 
          timestampField, 
          movedBy, 
          request.tenant_id,
          request.sector_id || undefined,
          portariaSectorId || undefined,
          signature
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
      }
    } else {
      // Se todos os materiais saíram, a requisição é marcada como COMPLETED
      const allOut = materials.every(m => m.status === 'OUT_PLANTA');
      if (allOut) {
        await this.requestRepository.updateStatus(requestId, 'COMPLETED', undefined, movedBy);
      }
    }
  }
}
