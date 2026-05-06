import { supabaseAdmin } from './src/config/supabase';

async function check() {
  const { data, error } = await supabaseAdmin.from('materials').select('status').limit(1);
  if (error) {
    console.log('Error:', error.message, error.code);
  } else {
    console.log('Column "status" exists!');
  }
}

check();
