import { supabaseAdmin } from '../config/supabase';
import { Sector } from '../types';

/**
 * Serviço de Gestão de Setores.
 * Gerencia a hierarquia organizacional da unidade (Setores Pai e Subsetores).
 */
export class SectorService {
  
  /**
   * Lista todos os setores cadastrados para uma unidade específica.
   * Ordena alfabeticamente pelo nome.
   * @param tenantId ID da unidade industrial
   */
  async listByTenant(tenantId: string): Promise<Sector[]> {
    const { data: sectors, error } = await supabaseAdmin
      .from('sectors')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116') return []; 
      throw error;
    }
    return sectors as Sector[];
  }

  /**
   * Cria um novo setor ou subsetor vinculado a uma unidade.
   * @param tenantId ID da unidade industrial
   * @param name Nome do setor (ex: Almoxarifado, Caldeira)
   * @param parentId ID do setor pai (opcional, para hierarquia)
   */
  async create(tenantId: string, name: string, parentId?: string): Promise<Sector> {
    const { data, error } = await supabaseAdmin
      .from('sectors')
      .insert({ 
        tenant_id: tenantId, 
        name,
        parent_id: parentId || null
      })
      .select()
      .single();

    if (error) throw error;
    return data as Sector;
  }

  /**
   * Remove um setor permanentemente do sistema.
   * @param id ID do setor a ser excluído
   * @param tenantId ID da unidade (garante segurança multi-tenant)
   */
  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('sectors')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }
}

export const sectorService = new SectorService();
