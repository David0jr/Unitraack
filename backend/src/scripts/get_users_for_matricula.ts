import { supabaseAdmin } from '../config/supabase';

async function main() {
  try {
    const { data: users, error } = await supabaseAdmin.from('users').select('id, name, email');
    if (error) throw error;
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    process.exit(0);
  }
}

main();
