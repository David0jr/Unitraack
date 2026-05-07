
import { supabaseAdmin } from '../config/supabase';

async function fix() {
    console.log("--- INICIANDO CORREÇÃO DE SETOR_ID NOS PERFIS ---");

    // 1. Buscar todos os perfis com sector preenchido mas sector_id nulo
    const { data: profiles, error: profError } = await supabaseAdmin
        .from('profiles')
        .select('id, tenant_id, sector, sector_id')
        .is('sector_id', null)
        .not('sector', 'is', null);

    if (profError) {
        console.error("Erro ao buscar perfis:", profError);
        return;
    }

    console.log(`Encontrados ${profiles?.length || 0} perfis para corrigir.`);

    for (const profile of profiles || []) {
        console.log(`Corrigindo perfil: ${profile.id} (Setor: ${profile.sector})`);
        
        // 2. Tentar encontrar o setor pelo nome
        const { data: sectors, error: secError } = await supabaseAdmin
            .from('sectors')
            .select('id')
            .eq('tenant_id', profile.tenant_id)
            .ilike('name', profile.sector)
            .limit(1);

        if (secError) {
            console.error(`Erro ao buscar setor para ${profile.sector}:`, secError);
            continue;
        }

        if (sectors && sectors.length > 0) {
            const sectorId = sectors[0].id;
            console.log(`  -> Setor encontrado: ${sectorId}. Atualizando perfil...`);
            
            const { error: updError } = await supabaseAdmin
                .from('profiles')
                .update({ sector_id: sectorId })
                .eq('id', profile.id);

            if (updError) {
                console.error(`  -> Erro ao atualizar perfil ${profile.id}:`, updError);
            } else {
                console.log(`  -> Sucesso!`);
            }
        } else {
            console.log(`  -> Setor '${profile.sector}' não encontrado na tabela 'sectors'.`);
            
            // Opcional: Criar o setor se não existir? 
            // Por enquanto vamos apenas logar, pois setores costumam ser pré-definidos.
        }
    }

    console.log("\n--- CORREÇÃO FINALIZADA ---");
}

fix();
