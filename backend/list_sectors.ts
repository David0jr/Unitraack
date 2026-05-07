import { supabaseAdmin } from './src/config/supabase';

async function list() {
  const { data, error } = await supabaseAdmin.from('sectors').select('*').is('parent_id', null);
  if (error) {
    console.error(error);
    return;
  }
  console.log('Sectors:', data);
}

list();
