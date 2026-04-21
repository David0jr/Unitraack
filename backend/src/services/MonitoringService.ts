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
    // 1. Buscar todos os setores e subsetores da unidade
    const { data: sectors, error: sectorError } = await supabaseAdmin
      .from('sectors')
      .select('*, parent:sectors(name)')
      .eq('tenant_id', tenantId);

    if (sectorError) throw sectorError;

    // 2. Buscar materiais com sua localização atual e dados vinculados (Terceirizada/Perfil)
    const { data: materials, error: matError } = await supabaseAdmin
      .from('materials')
      .select(`
        *,
        request:entry_requests(
          id,
          profile:profiles(full_name, role),
          tenant_id
        )
      `)
      .not('current_sector_id', 'is', null);

    if (matError) throw matError;

    // 3. Buscar histórico das últimas 20 movimentações da unidade
    const { data: movements, error: moveError } = await supabaseAdmin
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

    if (moveError) throw moveError;

    return {
      sectors,
      materials,
      movements: movements || []
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
