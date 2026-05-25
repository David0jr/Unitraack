import { supabaseAdmin } from '../src/config/supabase';

async function main() {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(1);
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }
  if (data && data.length > 0) {
    console.log("Columns in profiles:", Object.keys(data[0]));
    console.log("Sample record:", data[0]);
  } else {
    console.log("No profiles found to inspect columns.");
  }
}

main();
