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


export interface TenantStats extends Tenant {
  gestores?: { count: number }[];
}
