import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class GetAuditHistory {
  constructor(private requestRepo: IRequestRepository) {}

  async execute(tenantId: string, sectorId?: string, actorId?: string) {
    if (!tenantId) throw new Error('ID da empresa é obrigatório.');
    return await this.requestRepo.getAuditHistory(tenantId, sectorId, actorId);
  }
}
