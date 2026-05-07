
import { supabaseAdmin } from '../config/supabase';

async function check() {
    // 1. Pegar a última requisição IN_PLANTA ou COMPLETED
    const { data: requests, error: reqError } = await supabaseAdmin
        .from('entry_requests')
        .select('*, materials(*)')
        .order('gate_checked_at', { ascending: false })
        .limit(1);

    if (reqError) {
        console.error("Erro ao buscar requisição:", reqError);
        return;
    }

    if (!requests || requests.length === 0) {
        console.log("Nenhuma requisição encontrada.");
        return;
    }

    const req = requests[0];
    console.log("--- ÚLTIMA REQUISIÇÃO ---");
    console.log(`ID: ${req.id}`);
    console.log(`Status: ${req.status}`);
    console.log(`Setor Alvo (Texto): ${req.sector}`);
    console.log(`Setor Alvo (ID): ${req.sector_id}`);
    console.log(`Check-in em: ${req.gate_checked_at}`);

    console.log("\n--- MATERIAIS ---");
    req.materials.forEach((m: any) => {
        console.log(`ID: ${m.id} | Nome: ${m.name} | Status: ${m.status} | Setor Atual ID: ${m.current_sector_id}`);
    });

    // 2. Verificar os setores
    const { data: sectors } = await supabaseAdmin.from('sectors').select('id, name');
    console.log("\n--- SETORES NO BANCO ---");
    sectors?.forEach(s => {
        console.log(`ID: ${s.id} | Nome: ${s.name}`);
    });

    // 3. Verificar o último log de movimento para esses materiais
    const materialIds = req.materials.map((m: any) => m.id);
    const { data: movements } = await supabaseAdmin
        .from('material_movements')
        .select('*')
        .in('material_id', materialIds)
        .order('moved_at', { ascending: false });

    console.log("\n--- ÚLTIMOS MOVIMENTOS ---");
    movements?.forEach(mv => {
        console.log(`Material: ${mv.material_id} | De: ${mv.from_sector_id} | Para: ${mv.to_sector_id} | Em: ${mv.moved_at}`);
    });
}

check();
