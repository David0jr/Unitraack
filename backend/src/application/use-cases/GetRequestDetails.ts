import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class GetRequestDetails {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string, tenantId: string) {
    const request = await this.requestRepository.findById(requestId);
    if (!request) throw new Error('Requisição não encontrada.');
    
    // Validar isolamento de tenant
    if (request.tenant_id !== tenantId) {
      throw new Error('Acesso negado: Esta requisição não pertence à sua unidade.');
    }
    
    return request;
  }
}
