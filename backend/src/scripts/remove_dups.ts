import { supabaseAdmin } from '../config/supabase';

async function removeDups() {
    // 1. Fetch the sector ID for 'Portaria'
    const { data: portariaSectors, error: sectorError } = await supabaseAdmin
        .from('sectors')
        .select('id')
        .ilike('name', 'Portaria')
        .limit(1);
    
    if (sectorError || !portariaSectors || portariaSectors.length === 0) {
        console.error("Erro ao buscar setor Portaria:", sectorError);
        return;
    }
    const portariaId = portariaSectors[0].id;
    
    // 2. Find recent movements to Portaria where from is null
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    
    const { data: movements, error: movError } = await supabaseAdmin
        .from('material_movements')
        .select('*')
        .eq('to_sector_id', portariaId)
        .is('from_sector_id', null)
        .gte('moved_at', oneHourAgo);

    if (movError) {
        console.error("Erro ao buscar movimentos:", movError);
        return;
    }
    
    console.log(`Found ${movements.length} duplicated movements to Portaria.`);
    
    for (const mov of movements) {
        console.log(`Deleting movement ID: ${mov.id} for material: ${mov.material_id}`);
        await supabaseAdmin
            .from('material_movements')
            .delete()
            .eq('id', mov.id);
    }
    
    console.log("Done.");
}

removeDups();
