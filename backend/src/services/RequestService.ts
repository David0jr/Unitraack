import { supabaseAdmin } from '../config/supabase';
import { EntryRequest, Material, RequestStatus } from '../types';

export class RequestService {
  
  async createRequest(data: Partial<EntryRequest>, materials: Partial<Material>[]): Promise<string> {
    // 1. Inserir requisição principal
    const { data: request, error: reqError } = await supabaseAdmin
      .from('entry_requests')
      .insert(data)
      .select()
      .single();

    if (reqError) throw reqError;

    // 2. Inserir materiais se existirem
    if (materials.length > 0) {
      const materialsToInsert = materials.map(m => ({
        ...m,
        request_id: request.id
      }));

      const { error: matError } = await supabaseAdmin
        .from('materials')
        .insert(materialsToInsert);

      if (matError) {
        console.error("Erro ao inserir materiais:", matError.message);
        // Não lançamos erro aqui para não invalidar a requisição principal, 
        // mas em um sistema real poderíamos usar uma transação.
      }
    }

    return request.id;
  }

  async listByTenant(tenantId: string, filters: any = {}): Promise<EntryRequest[]> {
    console.log(`[RequestService] Listando requisições para Tenant: ${tenantId}`);
    
    try {
      let query = supabaseAdmin
        .from('entry_requests')
        .select(`
          *,
          profile:profiles(full_name),
          sector_info:sectors(*)
        `)
        .eq('tenant_id', tenantId);

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.sector_id) {
        query = query.eq('sector_id', filters.sector_id);
      } else if (filters.sector) {
        query = query.eq('sector', filters.sector);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.warn('[RequestService] Falha na busca completa de requisições, tentando simplificada...');
        const { data: simpleData, error: simpleError } = await supabaseAdmin
          .from('entry_requests')
          .select('*, profile:profiles(full_name)')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
          
        if (simpleError) throw simpleError;
        return simpleData || [];
      }
      
      console.log(`[RequestService] Requisições encontradas: ${data?.length || 0}`);
      return data || [];
    } catch (err: any) {
      console.error('[RequestService] Erro fatal ao listar requisições:', err.message);
      return [];
    }
  }



  async updateStatus(requestId: string, status: RequestStatus, rejectionReason?: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('entry_requests')
      .update({ status, rejection_reason: rejectionReason || null })
      .eq('id', requestId);

    if (error) throw error;
  }

  async markCheckout(requestId: string, checkOutBy: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('entry_requests')
      .update({ 
        status: 'COMPLETED', 
        exit_at: new Date().toISOString(),
        check_out_by: checkOutBy
      })
      .eq('id', requestId);

    if (error) throw error;
  }

  async findById(requestId: string): Promise<EntryRequest | null> {
    const { data, error } = await supabaseAdmin
      .from('entry_requests')
      .select('*, profile:profiles(*), materials(*)')
      .eq('id', requestId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async deleteRequest(requestId: string): Promise<void> {
    // 1. Deletar materiais primeiro (Foreign Key constraint usually handles this if set to CASCADE, but let's be explicit if not)
    const { error: matError } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('request_id', requestId);
    
    if (matError) throw matError;

    // 2. Deletar requisição
    const { error: reqError } = await supabaseAdmin
      .from('entry_requests')
      .delete()
      .eq('id', requestId);

    if (reqError) throw reqError;
  }

  async updateFullRequest(requestId: string, data: Partial<EntryRequest>, materials: Partial<Material>[]): Promise<void> {
    // 1. Atualizar a requisição principal
    const { error: reqError } = await supabaseAdmin
      .from('entry_requests')
      .update(data)
      .eq('id', requestId);

    if (reqError) throw reqError;

    // 2. Limpar materiais antigos
    const { error: deleteMatError } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('request_id', requestId);

    if (deleteMatError) throw deleteMatError;

    // 3. Inserir novos materiais
    if (materials.length > 0) {
      const materialsToInsert = materials.map(m => ({
        ...m,
        request_id: requestId
      }));

      const { error: matError } = await supabaseAdmin
        .from('materials')
        .insert(materialsToInsert);

      if (matError) throw matError;
    }
  }
}

export const requestService = new RequestService();
