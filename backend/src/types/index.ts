/**
 * @file types/index.ts
 * @description Centralização de definições de tipos e interfaces para o domínio UsinaLins.
 * Segue os princípios de tipagem estrita para garantir segurança em tempo de execução.
 */

/**
 * Papéis de usuário permitidos no sistema.
 */
export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'GESTOR_SEGURANCA' 
  | 'LIDER_SETOR' 
  | 'PORTARIA' 
  | 'TERCEIRIZADA';

/**
 * Status possíveis para uma solicitação de entrada.
 */
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
  | 'CANCELED';

/**
 * Representa o perfil de um usuário no sistema (Profiles).
 */
export interface Profile {
  id: string;
  tenant_id: string | null;
  role: UserRole;
  full_name: string;
  sector?: string | null;
  sector_id?: string | null;
  cnpj?: string | null;
  representative_name?: string | null;
  phone?: string | null;
  company_color?: string | null;
  created_at: string;
}

/**
 * Define a estrutura de uma Unidade/Usina (Tenant).
 */
export interface Tenant {
  id: string;
  name: string;
  cnpj: string;
  created_at: string;
  company_email?: string;
  company_phone?: string;
  logo_url?: string;
  company_color?: string;
  subdomain?: string;
}

/**
 * Interface para estatísticas básicas de uma unidade.
 */
export interface TenantStats extends Tenant {
  gestores?: { count: number }[];
}

/**
 * Solicitação de entrada de terceirizado e seus equipamentos.
 */
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

/**
 * Equipamento vinculado a uma solicitação de entrada.
 */
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

/**
 * Histórico de movimentação de materiais entre setores.
 */
export interface MaterialMovement {
  id: string;
  tenant_id: string;
  material_id: string;
  from_sector_id: string | null;
  to_sector_id: string;
  moved_by: string;
  moved_at: string;
}

/**
 * Define a estrutura de um Setor ou subsetor da unidade industrial.
 */
export interface Sector {
  id: string;
  tenant_id: string;
  name: string;
  parent_id?: string | null;
  created_at: string;
  layout_x?: number;
  layout_y?: number;
  layout_w?: number;
  layout_h?: number;
}
