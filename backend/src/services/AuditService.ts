import { supabaseAdmin } from '../config/supabase';

/**
 * Serviço de Auditoria e Traçabilidade.
 * Fornece métodos para reconstruir o histórico de permanência e movimentação de ativos terrestres.
 */
export class AuditService {
  
  /**
   * Recupera o relatório completo de auditoria para um tenant, opcionalmente filtrado por perfil.
   * Reconstrói a trajetória de cada equipamento através dos setores e movimentações registradas.
   * @param tenantId ID da unidade industrial
   * @param profileId ID do perfil (terceirizado) para filtro opcional
   */
  async getTenantAudit(tenantId: string, profileId?: string) {
    console.log(`[AuditService] Gerando relatório: Tenant=${tenantId}, Profile=${profileId || 'Todos'}`);
    
    try {
      const statuses = ['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED_PORTARIA', 'IN_PLANTA', 'COMPLETED'];
      
      let query = supabaseAdmin
        .from('entry_requests')
        .select(`
          *,
          profile:profiles!profile_id(full_name, role, cnpj, phone, representative_name, logo_url, company_color),
          gate_checked_by_profile:profiles!check_in_by(full_name, role),
          approved_leader_profile:profiles!approved_leader_by(full_name, role),
          approved_gestor_profile:profiles!approved_gestor_by(full_name, role),
          sector:sectors!sector_id(name),
          materials:materials(
            *,
            movements:material_movements(
              *,
              from_sector:sectors!material_movements_from_sector_id_fkey(name),
              to_sector:sectors!material_movements_to_sector_id_fkey(name),
              actor:profiles!moved_by(full_name, role)
            )
          )
        `)
        .eq('tenant_id', tenantId)
        .in('status', statuses)
        .order('created_at', { ascending: false });

      if (profileId && profileId !== 'null' && profileId !== 'undefined') {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('[AuditService] Erro na busca completa:', error);
        // Fallback simplificado
        let fallbackQuery = supabaseAdmin
          .from('entry_requests')
          .select(`
            *,
            profile:profiles!profile_id(full_name, role, cnpj, phone, representative_name, logo_url, company_color),
            materials:materials(
              *,
              movements:material_movements(
                *,
                from_sector:sectors!material_movements_from_sector_id_fkey(name),
                to_sector:sectors!material_movements_to_sector_id_fkey(name),
                actor:profiles!moved_by(full_name, role)
              )
            )
          `)
          .eq('tenant_id', tenantId)
          .in('status', statuses)
          .order('created_at', { ascending: false });

        if (profileId && profileId !== 'null' && profileId !== 'undefined') {
          fallbackQuery = fallbackQuery.eq('profile_id', profileId);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }

      console.log(`[AuditService] Encontrados ${data?.length || 0} registros.`);
      return data || [];
    } catch (err: any) {
      console.error('[AuditService] Erro fatal:', err.message);
      return [];
    }
  }


  /**
   * Consolida métricas de desempenho e frequência de empresas terceirizadas.
   * Calcula total de visitas e última interação registrada.
   * @param tenantId ID da unidade industrial
   */
  async getThirdPartyStats(tenantId: string) {
    // 1. Identifica todos os perfis cadastrados como TERCEIRIZADA na unidade
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('tenant_id', tenantId)
      .eq('role', 'TERCEIRIZADA');

    if (error) throw error;

    // 2. Calcula as métricas quantitativas para cada empresa mapeada
    const stats = await Promise.all(profiles.map(async (p) => {
      const { data: requests } = await supabaseAdmin
        .from('entry_requests')
        .select('id, created_at, exit_at')
        .eq('profile_id', p.id)
        .in('status', ['APPROVED_PORTARIA', 'IN_PLANTA', 'COMPLETED'])
        .order('created_at', { ascending: false });

      const totalVisits = requests?.length || 0;
      
      return {
        ...p,
        totalVisits,
        lastVisit: requests?.[0]?.created_at || null
      };
    }));

    return stats;
  }
}

export const auditService = new AuditService();
