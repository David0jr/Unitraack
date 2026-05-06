import { EntryRequest, Material, RequestStatus } from '../entities/EntryRequest';

export interface ListFilters {
  status?: RequestStatus | RequestStatus[];
  profile_id?: string;
  sector_id?: string;
  sector_ids?: string[];
  sector?: string;
}

export interface IRequestRepository {
  create(request: Partial<EntryRequest>, materials: Partial<Material>[]): Promise<string>;
  findById(id: string): Promise<(EntryRequest & { materials: Material[] }) | null>;
  listByTenant(tenantId: string, filters?: ListFilters): Promise<EntryRequest[]>;
  updateStatus(id: string, status: RequestStatus, reason?: string, updatedBy?: string): Promise<void>;
  updateFullRequest(id: string, request: Partial<EntryRequest>, materials: Partial<Material>[]): Promise<void>;
  delete(id: string): Promise<void>;
  markCheckout(id: string, checkOutBy: string): Promise<void>;
  updateMaterialStatus(materialId: string, status: any, timestampField?: 'entry_at' | 'exit_at', movedBy?: string, tenantId?: string, fromSectorId?: string, toSectorId?: string): Promise<void>;
  updateMultipleMaterialsStatus(materialIds: string[], status: any, timestampField?: 'entry_at' | 'exit_at', movedBy?: string, tenantId?: string, fromSectorId?: string, toSectorId?: string): Promise<void>;
  getAuditHistory(tenantId: string): Promise<any[]>;
  findSectorByName(tenantId: string, name: string): Promise<string | null>;
}
