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
  async getOperationalData(tenantId: string) {
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
      // Tentamos buscar com current_sector_id, mas se falhar (coluna não existe), buscamos apenas os básicos
      const { data, error } = await supabaseAdmin
        .from('materials')
        .select(`
          *,
          request:entry_requests(
            id,
            profile:profiles(full_name, role),
            tenant_id
          )
        `);

      if (error) {
        console.warn('[MonitoringService] Falha na busca completa de materiais, tentando simplificada...');
        const { data: simpleData, error: simpleError } = await supabaseAdmin
          .from('materials')
          .select('*')
          .limit(100);
        
        if (simpleError) throw simpleError;
        materials = simpleData || [];
      } else {
        materials = data || [];
      }
    } catch (err: any) {
      console.error('[MonitoringService] Erro ao buscar materiais:', err.message);
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

    console.log(`[MonitoringService] Resumo: ${sectors.length} setores, ${materials.length} materiais.`);

    return {
      sectors,
      materials: materials.filter(m => {
        // Filtro defensivo para tenant_id
        const mTenantId = (m.request as any)?.tenant_id || m.tenant_id;
        return !mTenantId || mTenantId === tenantId;
      }),
      movements
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
   * @param tenantId ID da unidade
   * @param sectorLayouts Array de layouts (x, y, w, h) por ID de setor
   */
  async updateMapLayout(tenantId: string, sectorLayouts: {id: string, x: number, y: number, w: number, h: number}[]) {
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

  /**
   * Atualiza a posição manual de um material (ícone) no mapa.
   * @param materialId ID do material
   * @param x Posição X (layout)
   * @param y Posição Y (layout)
   */
  async updateMaterialPosition(materialId: string, x: number, y: number) {
    const { error } = await supabaseAdmin
      .from('materials')
      .update({ layout_x: x, layout_y: y })
      .eq('id', materialId);
    
    if (error) throw error;
  }
}

export const monitoringService = new MonitoringService();
