import { supabaseAdmin } from './src/config/supabase';

async function checkColumns() {
  const { data, error } = await supabaseAdmin
    .from('entry_requests')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Erro ao buscar colunas:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Colunas encontradas em entry_requests:", Object.keys(data[0]));
  } else {
    console.log("Nenhum dado em entry_requests para identificar colunas.");
  }
  
  const { data: matData, error: matError } = await supabaseAdmin
    .from('materials')
    .select('*')
    .limit(1);
    
  if (matData && matData.length > 0) {
    console.log("Colunas encontradas em materials:", Object.keys(matData[0]));
  }

  const { data: movData, error: movError } = await supabaseAdmin
    .from('material_movements')
    .select('*')
    .limit(1);

  if (movData && movData.length > 0) {
    console.log("Colunas encontradas em material_movements:", Object.keys(movData[0]));
  }
}

checkColumns();
