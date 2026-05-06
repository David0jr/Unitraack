import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class NotifyDiscrepancy {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, reason: string): Promise<void> {
    const existing = await this.requestRepository.findById(requestId);
    if (!existing) throw new Error('Solicitação não encontrada.');

    // Altera o status para DISCREPANCY e registra o motivo
    await this.requestRepository.updateStatus(requestId, 'DISCREPANCY', reason);
    
    // TODO: Disparar notificação (Push/Email) para o Gestor de Segurança
    console.log(`[NotifyDiscrepancy] Gestor de Segurança notificado sobre divergência na requisição ${requestId}. Motivo: ${reason}`);
  }
}
