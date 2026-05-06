import { IRequestRepository, ListFilters } from '../../domain/repositories/IRequestRepository';

export class ListRequests {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(tenantId: string, filters?: ListFilters) {
    return await this.requestRepository.listByTenant(tenantId, filters);
  }
}
