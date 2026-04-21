export type RequestStatus = 
  | 'PENDING' 
  | 'APPROVED_LIDER' 
  | 'REJECTED_LIDER' 
  | 'APPROVED_GESTOR' 
  | 'REJECTED_GESTOR' 
  | 'COMPLETED' 
  | 'REJECTED';

export interface EntryRequest {
  id: string;
  tenant_id: string;
  profile_id: string;
  sector: string;
  sector_id?: string | null;
  entry_date: string;
  status: RequestStatus;
  rejection_reason?: string | null;
  exit_at?: string | null;
  check_out_by?: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  request_id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  description?: string | null;
  condition: 'NOVO' | 'USADO';
  code?: string | null;
  image_url?: string | null;
}
