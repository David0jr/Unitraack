import { supabaseAdmin } from './backend/src/config/supabase';

async function checkMovements() {
  const { data: movements, error } = await supabaseAdmin
    .from('material_movements')
    .select('*, material:materials(name), from_sector:sectors!from_sector_id(name), to_sector:sectors!to_sector_id(name)')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recent movements:', JSON.stringify(movements, null, 2));
}

checkMovements();
