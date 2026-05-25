import { supabaseAdmin } from './src/config/supabase';

async function test() {
  const { data, error } = await supabaseAdmin
    .from('material_movements')
    .select(`
        id,
        actor:profiles(full_name, matricula)
      `)
    .limit(1);

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success:', data);
  }
}

test();
