export type RequestStatus = 
  | 'PENDING' 
  | 'APPROVED'
  | 'REJECTED'
  | 'APPROVED_LIDER' 
  | 'REJECTED_LIDER' 
  | 'APPROVED_GESTOR' 
  | 'REJECTED_GESTOR' 
  | 'IN_PLANTA'
  | 'COMPLETED'
  | 'CANCELED'
  | 'DISCREPANCY';

export interface EntryRequest {
  id: string;
  tenant_id: string;
  profile_id: string;
  sector: string;
  sector_id?: string | null;
  entry_date: string;
  status: RequestStatus;
  rejection_reason?: string | null;
  approved_leader_by?: string | null;
  approved_gestor_by?: string | null;
  check_in_by?: string | null;
  check_out_by?: string | null;
  gate_checked_at?: string | null;
  exit_at?: string | null;
  created_at: string;
}

export type MaterialStatus = 'PENDING' | 'IN_PLANTA' | 'OUT_PLANTA';

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
  status: MaterialStatus;
  entry_at?: string | null;
  exit_at?: string | null;
}
