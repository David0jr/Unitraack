import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class DeleteEntryRequest {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, userRole?: string): Promise<void> {
    const existing = await this.requestRepository.findById(requestId);
    if (!existing) throw new Error('Solicitação não encontrada.');

    // Se for Super Admin, permite deletar qualquer coisa (para manutenção do sistema)
    if (userRole === 'SUPER_ADMIN') {
      await this.requestRepository.delete(requestId);
      return;
    }

    // Apenas permite deletar se estiver cancelada ou recusada
    const deletableStatuses = ['REJECTED_LIDER', 'REJECTED_GESTOR', 'CANCELED', 'REJECTED'];
    if (!deletableStatuses.includes(existing.status)) {
      throw new Error(`Apenas solicitações canceladas ou recusadas podem ser excluídas do histórico. Status atual: ${existing.status}`);
    }
    
    await this.requestRepository.delete(requestId);
  }
}
