export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'GESTOR_SEGURANCA' 
  | 'LIDER_SETOR' 
  | 'PORTARIA' 
  | 'TERCEIRIZADA';

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
