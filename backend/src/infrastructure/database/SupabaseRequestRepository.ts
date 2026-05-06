import { supabaseAdmin } from '../../config/supabase';
import { EntryRequest, Material, RequestStatus } from '../../domain/entities/EntryRequest';
import { IRequestRepository, ListFilters } from '../../domain/repositories/IRequestRepository';

export class SupabaseRequestRepository implements IRequestRepository {
  
  async create(request: Partial<EntryRequest>, materials: Partial<Material>[]): Promise<string> {
    const { data: req, error: reqError } = await supabaseAdmin
      .from('entry_requests')
      .insert(request)
      .select()
      .single();

    if (reqError) throw reqError;

    if (materials.length > 0) {
      const materialsToInsert = materials.map(m => ({
        ...m,
        request_id: req.id
      }));

      const { error: matError } = await supabaseAdmin
        .from('materials')
        .insert(materialsToInsert);

      if (matError) {
        console.error("[SupabaseRequestRepository] Erro ao inserir materiais:", matError.message);
      }
    }

    return req.id;
  }

  async findById(id: string): Promise<(EntryRequest & { materials: Material[] }) | null> {
    const { data, error } = await supabaseAdmin
      .from('entry_requests')
      .select('*, profile:profiles!profile_id(*), materials(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async listByTenant(tenantId: string, filters: ListFilters = {}): Promise<EntryRequest[]> {
    let query = supabaseAdmin
      .from('entry_requests')
      .select(`
        *,
        profile:profiles!profile_id(full_name, theme_color, cnpj, phone, representative_name, logo_url),
        materials(*)
      `)
      .eq('tenant_id', tenantId);

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    
    if (filters.profile_id) query = query.eq('profile_id', filters.profile_id);
    
    if (filters.sector_ids && filters.sector_ids.length > 0) {
      query = query.in('sector_id', filters.sector_ids);
    } else if (filters.sector_id) {
      query = query.eq('sector_id', filters.sector_id);
    } else if (filters.sector) {
      query = query.eq('sector', filters.sector);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error("[SupabaseRequestRepository.listByTenant] Erro SQL:", error);
      throw error;
    }
    return data || [];
  }

  async updateStatus(id: string, status: RequestStatus, reason?: string, updatedBy?: string): Promise<void> {
    const updateData: any = { status, rejection_reason: reason || null };
    
    if (updatedBy) {
      if (status === 'APPROVED_LIDER') updateData.approved_leader_by = updatedBy;
      if (status === 'APPROVED_GESTOR') updateData.approved_gestor_by = updatedBy;
      if (status === 'IN_PLANTA') {
        updateData.check_in_by = updatedBy;
        updateData.gate_checked_at = new Date().toISOString();
      }
      if (status === 'COMPLETED') updateData.check_out_by = updatedBy;
    }

    const { error } = await supabaseAdmin
      .from('entry_requests')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  async updateFullRequest(id: string, request: Partial<EntryRequest>, materials: Partial<Material>[]): Promise<void> {
    const { error: reqError } = await supabaseAdmin
      .from('entry_requests')
      .update(request)
      .eq('id', id);

    if (reqError) throw reqError;

    await supabaseAdmin
      .from('materials')
      .delete()
      .eq('request_id', id);

    if (materials.length > 0) {
      const materialsToInsert = materials.map(m => ({
        ...m,
        request_id: id
      }));

      const { error: matError } = await supabaseAdmin
        .from('materials')
        .insert(materialsToInsert);

      if (matError) throw matError;
    }
  }

  async delete(id: string): Promise<void> {
    // 1. Buscar os materiais da requisição para limpar dependências
    const { data: mats } = await supabaseAdmin.from('materials').select('id').eq('request_id', id);
    
    if (mats && mats.length > 0) {
      const matIds = mats.map(m => m.id);
      // 2. Limpar histórico de movimentos (FK constraint)
      await supabaseAdmin.from('material_movements').delete().in('material_id', matIds);
    }

    // 3. Limpar materiais
    const { error: matError } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('request_id', id);

    if (matError) {
      console.error(`[SupabaseRequestRepository.delete] Erro ao deletar materiais da requisição ${id}:`, matError.message);
    }

    const { error } = await supabaseAdmin
      .from('entry_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[SupabaseRequestRepository.delete] Erro ao deletar requisição ${id}:`, error.message);
      throw error;
    }
  }

  async markCheckout(id: string, checkOutBy: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('entry_requests')
      .update({ 
        status: 'COMPLETED', 
        exit_at: new Date().toISOString(),
        check_out_by: checkOutBy
      })
      .eq('id', id);

    if (error) throw error;
  }

  async updateMaterialStatus(materialId: string, status: any, timestampField?: 'entry_at' | 'exit_at', movedBy?: string, tenantId?: string, fromSectorId?: string, toSectorId?: string): Promise<void> {
    const updateData: any = { status };
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString();
    }
    
    if (movedBy) {
        if (status === 'IN_PLANTA') updateData.check_in_by = movedBy;
        if (status === 'OUT_PLANTA') updateData.check_out_by = movedBy;
    }

    if (toSectorId) {
        updateData.current_sector_id = toSectorId;
    }

    const { error } = await supabaseAdmin
      .from('materials')
      .update(updateData)
      .eq('id', materialId);

    if (error) throw error;

    if (movedBy) {
        // Log movement
        const { error: moveError } = await supabaseAdmin.from('material_movements').insert({
            material_id: materialId,
            moved_by: movedBy,
            moved_at: new Date().toISOString(),
            tenant_id: tenantId,
            from_sector_id: fromSectorId,
            to_sector_id: toSectorId
        });
        if (moveError) console.error("[SupabaseRequestRepository.updateMaterialStatus] Erro ao logar movimento:", moveError.message);
    }
  }

  async updateMultipleMaterialsStatus(materialIds: string[], status: any, timestampField?: 'entry_at' | 'exit_at', movedBy?: string, tenantId?: string, fromSectorId?: string, toSectorId?: string): Promise<void> {
    const updateData: any = { status };
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString();
    }

    if (movedBy) {
        if (status === 'IN_PLANTA') updateData.check_in_by = movedBy;
        if (status === 'OUT_PLANTA') updateData.check_out_by = movedBy;
    }

    if (toSectorId) {
        updateData.current_sector_id = toSectorId;
    }

    const { error } = await supabaseAdmin
      .from('materials')
      .update(updateData)
      .in('id', materialIds);

    if (error) throw error;

    if (movedBy) {
        const movements = materialIds.map(mId => ({
            material_id: mId,
            moved_by: movedBy,
            moved_at: new Date().toISOString(),
            tenant_id: tenantId,
            from_sector_id: fromSectorId,
            to_sector_id: toSectorId
        }));
        const { error: moveError } = await supabaseAdmin.from('material_movements').insert(movements);
        if (moveError) console.error("[SupabaseRequestRepository.updateMultipleMaterialsStatus] Erro ao logar movimentos:", moveError.message);
    }
  }

  async getAuditHistory(tenantId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('material_movements')
      .select(`
        id,
        moved_at,
        material:materials!inner(
          name,
          request:entry_requests!inner(
            tenant_id
          )
        ),
        actor:profiles(full_name),
        from_sector:sectors!material_movements_from_sector_id_fkey(name),
        to_sector:sectors!material_movements_to_sector_id_fkey(name)
      `)
      .eq('material.request.tenant_id', tenantId)
      .order('moved_at', { ascending: false });

    if (error) {
      console.error('[SupabaseRequestRepository.getAuditHistory] Erro:', error.message);
      throw error;
    }

    return data || [];
  }

  async findSectorByName(tenantId: string, name: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('sectors')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('name', name)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0].id;
  }
}
