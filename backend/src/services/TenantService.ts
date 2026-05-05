import { supabaseAdmin } from '../config/supabase';
import { Tenant, TenantStats } from '../types';

export class TenantService {
  
  async listAll(): Promise<TenantStats[]> {
    const { data: tenants, error } = await supabaseAdmin
      .from('tenants')
      .select(`
        *,
        gestores:profiles(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return tenants as TenantStats[];
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    console.log(`[TenantService] Searching for subdomain: "${subdomain}"`);
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .ilike('subdomain', subdomain.trim())
      .maybeSingle();

    if (error) {
      console.error('[TenantService] Query Error:', error);
      throw error;
    }
    
    if (tenant) {
      console.log(`[TenantService] Found tenant: ${tenant.name}`);
    } else {
      console.log(`[TenantService] No tenant found for slug: ${subdomain}`);
    }
    
    return tenant as Tenant;
  }

  async create(name: string, cnpj: string): Promise<Tenant> {
    // Gera um slug automático a partir do nome
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '-') // Troca caracteres especiais por hífen
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens no início/fim

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .insert({ name, cnpj, subdomain: slug })
      .select()
      .single();

    if (error) throw error;
    return tenant as Tenant;
  }

  async findByCnpj(cnpj: string): Promise<Tenant | null> {
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('cnpj', cnpj)
      .maybeSingle();

    if (error) throw error;
    return tenant as Tenant;
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return tenant as Tenant;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const tenantService = new TenantService();
