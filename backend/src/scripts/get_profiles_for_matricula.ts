import { supabaseAdmin } from '../config/supabase';

async function main() {
  try {
    const { data: profiles, error } = await supabaseAdmin.from('profiles').select('id, full_name, role');
    if (error) throw error;
    console.log(JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error('Error fetching profiles:', error);
  } finally {
    process.exit(0);
  }
}

main();
