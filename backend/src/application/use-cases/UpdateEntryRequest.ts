import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { EntryRequest, Material } from '../../domain/entities/EntryRequest';

export class UpdateEntryRequest {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, requestData: Partial<EntryRequest>, materials: Partial<Material>[], tenantId: string, userRole?: string, profileId?: string): Promise<void> {
    const existing = await this.requestRepository.findById(requestId);
    if (!existing) throw new Error('Solicitação não encontrada.');

    // SECURITY: Garantir isolamento de dados
    if (existing.tenant_id !== tenantId) {
      throw new Error('Acesso negado: Esta requisição pertence a outra unidade industrial.');
    }

    if (userRole === 'TERCEIRIZADA' && existing.profile_id !== profileId) {
      throw new Error('Acesso negado: Você não pode modificar uma requisição de outra empresa.');
    }

    // Só permite editar se não estiver em estados finais ou dentro da planta
    // Só permite editar se não for finalizado ou já cancelado
    if (['IN_PLANTA', 'COMPLETED', 'CANCELED'].includes(existing.status)) {
      throw new Error(`Não é possível editar uma solicitação com status ${existing.status}`);
    }

    // Se foi editado, volta para o início do fluxo (PENDING) 
    // independente se era APPROVED ou PENDING antes.
    requestData.status = 'PENDING';
    requestData.rejection_reason = null;

    // TODO: Notificar o líder do setor sobre a re-submissão
    console.log(`[UpdateEntryRequest] Notificando líder do setor ${existing.sector_id} sobre a edição da requisição ${requestId}`);

    await this.requestRepository.updateFullRequest(requestId, requestData, materials);
  }
}
