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
   * Calcula total de visitas, equipamentos na planta, movimentações e dados da empresa.
   * @param tenantId ID da unidade industrial
   */
  async getThirdPartyStats(tenantId: string) {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, theme_color, cnpj')
      .eq('tenant_id', tenantId)
      .eq('role', 'TERCEIRIZADA');

    if (error) throw error;

    const stats = await Promise.all(profiles.map(async (p) => {
      // 1. Visitas (Requisições)
      const { data: requests } = await supabaseAdmin
        .from('entry_requests')
        .select('id, created_at, status')
        .eq('profile_id', p.id);

      const totalVisits = requests?.length || 0;
      const lastVisit = requests?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at || null;

      // 2. Equipamentos na Planta (vinculados às requisições desta terceirizada que estão ativas)
      const activeRequestIds = requests?.filter(r => ['IN_PLANTA', 'APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED_PORTARIA'].includes(r.status)).map(r => r.id) || [];
      let equipmentInPlanta = 0;
      let totalMovements = 0;

      if (activeRequestIds.length > 0) {
        const { data: materials } = await supabaseAdmin
          .from('materials')
          .select('id')
          .in('request_id', activeRequestIds);
        equipmentInPlanta = materials?.length || 0;
      }

      // 3. Total de Movimentações (histórico inteiro)
      const allRequestIds = requests?.map(r => r.id) || [];
      if (allRequestIds.length > 0) {
        const { data: materialsAll } = await supabaseAdmin
          .from('materials')
          .select('id, movements:material_movements(id)')
          .in('request_id', allRequestIds);
          
        totalMovements = materialsAll?.reduce((acc: number, mat: any) => acc + (mat.movements?.length || 0), 0) || 0;
      }
      
      return {
        ...p,
        totalVisits,
        lastVisit,
        equipmentInPlanta,
        totalMovements
      };
    }));

    // Ordenar por total de visitas para o ranking padrão
    return stats.sort((a, b) => b.totalVisits - a.totalVisits);
  }
}

export const auditService = new AuditService();
