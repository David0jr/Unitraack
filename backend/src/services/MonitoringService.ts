import { supabaseAdmin } from '../config/supabase';

/**
 * Serviço de Monitoramento em Tempo Real (Digital Twin).
 * Responsável por gerenciar a localização dos ativos, movimentações entre setores e layout do mapa.
 */
export class MonitoringService {
  
  /**
   * Busca dados consolidados de setores, materiais ativos e movimentações recentes.
   * Utilizado para alimentar o Dashboard do Gestor e o Mapa Interativo.
   * @param tenantId ID da unidade industrial
   */
  async getOperationalData(tenantId: string, profileId?: string) {
    console.log(`[MonitoringService] Iniciando busca consolidada para Tenant: ${tenantId}`);
    
    // 1. Buscar todos os setores e subsetores da unidade
    let sectors: any[] = [];
    try {
      console.log('[MonitoringService] Buscando setores...');
      const { data, error } = await supabaseAdmin
        .from('sectors')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      sectors = data || [];
    } catch (err: any) {
      console.error('[MonitoringService] Erro ao buscar setores:', err.message);
    }

    // 2. Buscar materiais com sua localização atual
    let materials: any[] = [];
    try {
      console.log('[MonitoringService] Buscando materiais ativos...');
      const { data, error } = await supabaseAdmin
        .from('materials')
        .select(`
          *,
          request:entry_requests!request_id!inner(
            id,
            profile:profiles!profile_id(full_name, role, theme_color, logo_url, cnpj, phone, representative_name),
            tenant_id,
            status
          )
        `)
        .eq('entry_requests.tenant_id', tenantId);

      if (error) {
        console.warn('[MonitoringService] Falha na busca completa de materiais:', error.message);
        // Fallback simplificado se a query complexa falhar (ex: coluna nova não migrada)
        const { data: simpleData } = await supabaseAdmin.from('materials').select('*').limit(200);
        materials = simpleData || [];
      } else {
        materials = data || [];
      }
    } catch (err: any) {
      console.error('[MonitoringService] Erro catastrófico ao buscar materiais:', err.message);
    }

    // 3. Buscar histórico das últimas 20 movimentações da unidade
    let movements: any[] = [];
    try {
      console.log('[MonitoringService] Buscando movimentações recentes...');
      const { data, error } = await supabaseAdmin
        .from('material_movements')
        .select(`
          *,
          material:materials(name, model),
          from_sector:sectors!from_sector_id(name),
          to_sector:sectors!to_sector_id(name),
          actor:profiles!moved_by(full_name)
        `)
        .eq('tenant_id', tenantId)
        .order('moved_at', { ascending: false })
        .limit(20);

      if (!error) movements = data || [];
    } catch (err: any) {
      console.warn('[MonitoringService] Tabela de movimentações pode não existir ainda.');
    }

    console.log(`[MonitoringService] Resumo: ${sectors.length} setores, ${materials.length} materiais pré-filtro.`);

    const filteredMaterials = materials
        .filter(m => {
          // Normalizar request para o filtro
          const request = Array.isArray(m.request) ? m.request[0] : m.request;
          
          // Identificar tenant_id
          const mTenantId = m.tenant_id || request?.tenant_id;
          
          // Status check
          const matStatus = m.status || request?.status;
          
          const belongsToTenant = !mTenantId || mTenantId === tenantId;
          const belongsToProfile = profileId ? request?.profile?.id === profileId : true;

          return belongsToTenant && belongsToProfile && matStatus === 'IN_PLANTA';
        })
        .map(m => ({
          ...m,
          request: Array.isArray(m.request) ? m.request[0] : m.request
        }));

    const filteredMaterialIds = new Set(filteredMaterials.map(m => m.id));

    return {
      sectors,
      materials: filteredMaterials,
      movements: movements.filter(mov => profileId ? filteredMaterialIds.has(mov.material_id) : true)
    };
  }



  /**
   * Registra a transferência de um equipamento de um setor para outro.
   * Atualiza o estado atual do material e gera um log na tabela de movimentações.
   * @param tenantId ID da unidade
   * @param materialId ID do equipamento
   * @param toSectorId ID do setor de destino
   * @param movedBy ID do usuário que realizou a movimentação
   */
  async transferMaterial(tenantId: string, materialId: string, toSectorId: string, movedBy: string) {
    // 1. Identificar o setor de origem atual
    const { data: material, error: fetchError } = await supabaseAdmin
      .from('materials')
      .select('current_sector_id')
      .eq('id', materialId)
      .single();

    if (fetchError) throw fetchError;

    const fromSectorId = material.current_sector_id;

    // 2. Atualizar a localização (subsetor) do material
    const { error: updateError } = await supabaseAdmin
      .from('materials')
      .update({ current_sector_id: toSectorId })
      .eq('id', materialId);

    if (updateError) throw updateError;

    // 3. Persistir o log da movimentação para fins de auditoria
    const { error: logError } = await supabaseAdmin
      .from('material_movements')
      .insert({
        tenant_id: tenantId,
        material_id: materialId,
        from_sector_id: fromSectorId,
        to_sector_id: toSectorId,
        moved_by: movedBy
      });

    if (logError) throw logError;
  }

  /**
   * Atualiza as coordenadas e dimensões de múltiplos setores no mapa.
   * Setores da unidade que não estiverem na lista terão seu layout limpo (removidos do mapa).
   * @param tenantId ID da unidade
   * @param sectorLayouts Array de layouts (x, y, w, h) por ID de setor
   */
  async updateMapLayout(tenantId: string, sectorLayouts: {id: string, x: number, y: number, w: number, h: number}[]) {
    const activeIds = sectorLayouts.map(l => l.id);

    // 1. Limpar layout de todos os outros setores deste tenant que NÃO estão na lista ativa
    if (activeIds.length > 0) {
      await supabaseAdmin
        .from('sectors')
        .update({
          layout_x: null,
          layout_y: null,
          layout_w: null,
          layout_h: null
        })
        .eq('tenant_id', tenantId)
        .not('id', 'in', `(${activeIds.join(',')})`);
    } else {
      await supabaseAdmin
        .from('sectors')
        .update({
          layout_x: null,
          layout_y: null,
          layout_w: null,
          layout_h: null
        })
        .eq('tenant_id', tenantId);
    }

    // 2. Atualizar ou definir layout dos setores ativos
    for (const layout of sectorLayouts) {
      const { error } = await supabaseAdmin
        .from('sectors')
        .update({
          layout_x: layout.x,
          layout_y: layout.y,
          layout_w: layout.w,
          layout_h: layout.h
        })
        .eq('id', layout.id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
    }
  }

  async updateMaterialPosition(tenantId: string, materialId: string, x: number, y: number) {
    // Verificar se o material pertence ao tenant
    const { data, error: checkError } = await supabaseAdmin
      .from('materials')
      .select('id')
      .eq('id', materialId)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !data) {
      throw new Error('Acesso negado: Este material não pertence à sua unidade.');
    }

    const { error } = await supabaseAdmin
      .from('materials')
      .update({ layout_x: x, layout_y: y })
      .eq('id', materialId);
    
    if (error) throw error;
  }
}

export const monitoringService = new MonitoringService();
