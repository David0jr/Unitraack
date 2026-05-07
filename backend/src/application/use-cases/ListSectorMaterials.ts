import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { Material, MaterialStatus } from '../../domain/entities/EntryRequest';

export class ListSectorMaterials {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(tenantId: string, sectorId: string, status?: MaterialStatus): Promise<Material[]> {
    return this.requestRepository.listMaterialsBySector(tenantId, sectorId, status);
  }
}
