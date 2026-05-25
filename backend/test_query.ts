import { supabaseAdmin } from './src/config/supabase';

async function test() {
  const { data, error } = await supabaseAdmin
    .from('material_movements')
    .select(`
        id,
        moved_at,
        photos,
        signature,
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
    .eq('tenant_id', 'd2af505f-28e9-4796-97b9-b43b700670b7')
    .or('moved_by.eq.d2af505f-28e9-4796-97b9-b43b700670b7');

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success:', data.length);
  }
}

test();
