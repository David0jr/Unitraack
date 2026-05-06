import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
    // 1. Encontrar uma requisição e seus materiais
    const { data: requests, error: reqError } = await supabase
        .from('entry_requests')
        .select('id, tenant_id, materials(id)')
        .limit(1);

    if (reqError) {
        console.error("Erro ao buscar requisições:", reqError);
        return;
    }

    if (!requests || requests.length === 0) {
        console.log("Nenhuma requisição encontrada.");
        return;
    }

    const request = requests[0] as any;
    const materialIds = request.materials.map((m: any) => m.id);
    const tenantId = request.tenant_id;

    // 2. Encontrar um perfil (actor)
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

    if (profError) {
        console.error("Erro ao buscar perfis:", profError);
        return;
    }

    const movedBy = profiles[0].id;

    console.log(`Testando com:
    Request ID: ${request.id}
    Material IDs: ${materialIds}
    Tenant ID: ${tenantId}
    Moved By: ${movedBy}`);

    // Simular o que updateMultipleMaterialsStatus faz
    const status = 'IN_PLANTA';
    const timestampField = 'entry_at';
    const updateData: any = { status };
    updateData[timestampField] = new Date().toISOString();
    updateData.check_in_by = movedBy;

    console.log("Tentando atualizar materials...");
    const { error: matError } = await supabase
      .from('materials')
      .update(updateData)
      .in('id', materialIds);

    if (matError) {
        console.error("ERRO na tabela materials:", matError);
    } else {
        console.log("Sucesso na tabela materials.");
    }

    console.log("Tentando inserir material_movements...");
    const movements = materialIds.map((mId: string) => ({
        material_id: mId,
        moved_by: movedBy,
        moved_at: new Date().toISOString()
        // tenant_id: tenantId // Omitindo como está no código atual
    }));

    const { error: moveError } = await supabase.from('material_movements').insert(movements);

    if (moveError) {
        console.error("ERRO na tabela material_movements:", moveError);
    } else {
        console.log("Sucesso na tabela material_movements.");
    }
}

test();
