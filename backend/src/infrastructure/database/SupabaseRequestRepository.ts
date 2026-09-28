import { supabaseAdmin } from '../../config/supabase';
import { EntryRequest, Material, RequestStatus, MaterialStatus } from '../../domain/entities/EntryRequest';
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
    const updateData: any = { status };
    if (reason !== undefined) {
      updateData.rejection_reason = reason || null;
    }
    
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

  async updateMaterialStatus(materialId: string, status: any, timestampField?: 'entry_at' | 'exit_at', movedBy?: string, tenantId?: string, fromSectorId?: string, toSectorId?: string, signature?: string, photos?: string[], observation?: string): Promise<void> {
    const updateData: any = { status };
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString();
    }
    
    if (movedBy) {
        if (status === 'IN_PLANTA') updateData.check_in_by = movedBy;
        if (status === 'OUT_PLANTA') updateData.check_out_by = movedBy;
    }

    if (toSectorId && status !== 'MOVING' && status !== 'WAITING_EXIT') {
        updateData.current_sector_id = toSectorId;
    }
    
    // Nota: Por enquanto estamos salvando a string da foto (base64 ou url) diretamente.
    // Futuramente, as fotos base64 devem ser armazenadas em um Bucket do Supabase (Storage) 
    // e apenas a URL salva no banco.
    let photoUrls: string[] | null = photos && photos.length > 0 ? photos : null;

    const { error: matError } = await supabaseAdmin
      .from('materials')
      .update(updateData)
      .eq('id', materialId);
      
    if (matError) throw matError;

    // Se temos movedBy e tenantId, logamos na tabela material_movements
    if (movedBy && tenantId) {
      const movement = {
        material_id: materialId,
        tenant_id: tenantId,
        from_sector_id: fromSectorId || null,
        to_sector_id: toSectorId || null,
        moved_by: movedBy,
        moved_at: new Date().toISOString(),
        signature: signature || null,
        photos: photoUrls || null,
        observation: observation || null
      };
      const { error: moveError } = await supabaseAdmin.from('material_movements').insert(movement);
      if (moveError) console.error("[SupabaseRequestRepository.updateMaterialStatus] Erro ao logar movimento:", moveError.message);
    }
  }

  async updateMultipleMaterialsStatus(materialIds: string[], status: any, timestampField?: 'entry_at' | 'exit_at', movedBy?: string, tenantId?: string, fromSectorId?: string, toSectorId?: string, signature?: string, photos?: string[], pendingSectorId?: string | null, logMovement: boolean = true, observation?: string): Promise<void> {
    const updateData: any = { status };
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString();
    }

    if (movedBy) {
        if (status === 'IN_PLANTA') updateData.check_in_by = movedBy;
        if (status === 'OUT_PLANTA') updateData.check_out_by = movedBy;
    }

    if (toSectorId && status !== 'MOVING' && status !== 'WAITING_EXIT') {
        updateData.current_sector_id = toSectorId;
    }
    if (pendingSectorId !== undefined) {
        updateData.pending_sector_id = pendingSectorId;
    }

    const { error } = await supabaseAdmin
      .from('materials')
      .update(updateData)
      .in('id', materialIds);

    if (error) throw error;

    if (movedBy && logMovement) {
        const movements = materialIds.map(mId => ({
            material_id: mId,
            moved_by: movedBy,
            moved_at: new Date().toISOString(),
            tenant_id: tenantId,
            from_sector_id: fromSectorId || null,
            to_sector_id: toSectorId || null,
            signature: signature || null,
            photos: (photos && photos.length > 0) ? photos : null,
            observation: observation || null
        }));
        const { error: moveError } = await supabaseAdmin.from('material_movements').insert(movements);
        if (moveError) console.error("[SupabaseRequestRepository.updateMultipleMaterialsStatus] Erro ao logar movimentos:", moveError.message);
    }
  }

  async getAuditHistory(tenantId: string, sectorId?: string, actorId?: string, onlyPortaria?: boolean): Promise<any[]> {
    console.log(`[SupabaseRequestRepository.getAuditHistory] Buscando logs para tenant: ${tenantId}, onlyPortaria: ${!!onlyPortaria}`);
    let query = supabaseAdmin
      .from('material_movements')
      .select(`
        id,
        moved_at,
        photos,
        signature,
        observation,
        from_sector_id,
        to_sector_id,
        material:materials!inner(
          id,
          name,
          brand,
          model,
          serial_number,
          description,
          request:entry_requests!inner(
            id,
            tenant_id,
            sector,
            driver_name,
            plate,
            status,
            rejection_reason,
            profile:profiles!profile_id(
              full_name,
              theme_color,
              logo_url
            )
          )
        ),
        actor:profiles(full_name, role, registration_number),
        from_sector:sectors!material_movements_from_sector_id_fkey(id, name),
        to_sector:sectors!material_movements_to_sector_id_fkey(id, name)
      `)
      .eq('tenant_id', tenantId);

    if (onlyPortaria) {
      const portariaSectorId = await this.findSectorByName(tenantId, 'Portaria');
      if (portariaSectorId) {
        query = query.or(`from_sector_id.is.null,to_sector_id.is.null,to_sector_id.eq.${portariaSectorId}`);
      } else {
        query = query.or('from_sector_id.is.null,to_sector_id.is.null');
      }
    } else if (sectorId || actorId) {
      const conditions = [];
      if (sectorId) {
        conditions.push(`from_sector_id.eq.${sectorId}`);
        conditions.push(`to_sector_id.eq.${sectorId}`);
      }
      if (actorId) {
        conditions.push(`moved_by.eq.${actorId}`);
      }
      query = query.or(conditions.join(','));
    }

    const { data, error } = await query.order('moved_at', { ascending: false });

    if (error) {
      console.error('[SupabaseRequestRepository.getAuditHistory] Erro:', error.message);
      throw error;
    }

    console.log(`[SupabaseRequestRepository.getAuditHistory] Encontrados ${data?.length || 0} registros.`);
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

  async listMaterialsBySector(tenantId: string, sectorId: string, status?: MaterialStatus): Promise<Material[]> {
    let query = supabaseAdmin
      .from('materials')
      .select(`
        *,
        request:entry_requests!inner(*, profile:profiles!profile_id(*)),
        movements:material_movements(
          id,
          moved_at,
          photos,
          signature,
          observation,
          from_sector:sectors!material_movements_from_sector_id_fkey(id, name),
          to_sector:sectors!material_movements_to_sector_id_fkey(id, name),
          actor:profiles(full_name, registration_number)
        )
      `)
      .eq('request.tenant_id', tenantId)
      .or(`current_sector_id.eq.${sectorId},pending_sector_id.eq.${sectorId}`);

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['IN_PLANTA', 'MOVING']);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async findMaterialById(id: string): Promise<Material | null> {
    const { data, error } = await supabaseAdmin
      .from('materials')
      .select(`
        *,
        request:entry_requests!inner(*, profile:profiles!profile_id(*)),
        movements:material_movements(
          id,
          moved_at,
          photos,
          signature,
          observation,
          from_sector:sectors!material_movements_from_sector_id_fkey(id, name),
          to_sector:sectors!material_movements_to_sector_id_fkey(id, name),
          actor:profiles(full_name, registration_number)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
