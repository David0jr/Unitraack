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
    console.log(`[AuditService] Gerando relatório para Tenant: ${tenantId}, Profile: ${profileId || 'Todos'}`);
    
    try {
      // 1. Tentar busca completa com movimentações
      let query = supabaseAdmin
        .from('entry_requests')
        .select(`
          *,
          profile:profiles(full_name, role),
          materials(
            *,
            movements:material_movements(
              *,
              from_sector:sectors!from_sector_id(name),
              to_sector:sectors!to_sector_id(name),
              actor:profiles!moved_by(full_name)
            )
          )
        `)
        .eq('tenant_id', tenantId)
        .in('status', ['APPROVED_LIDER', 'APPROVED_GESTOR', 'COMPLETED'])
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.warn('[AuditService] Falha na busca completa de auditoria, tentando simplificada (sem movimentações)...');
        // Fallback: Busca sem movimentações se a tabela não existir
        let fallbackQuery = supabaseAdmin
          .from('entry_requests')
          .select(`
            *,
            profile:profiles(full_name, role),
            materials(*)
          `)
          .eq('tenant_id', tenantId)
          .in('status', ['APPROVED_LIDER', 'APPROVED_GESTOR', 'COMPLETED'])
          .order('created_at', { ascending: false });

        if (profileId) {
          fallbackQuery = fallbackQuery.eq('profile_id', profileId);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }

      return data || [];
    } catch (err: any) {
      console.error('[AuditService] Erro fatal na auditoria:', err.message);
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
        .eq('status', 'COMPLETED');

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
