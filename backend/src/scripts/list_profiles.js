const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://olcezecosvfibgzpawnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY2V6ZWNvc3ZmaWJnenBhd253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUxMzM2NSwiZXhwIjoyMDkxMDg5MzY1fQ.YLtDaSQyA1vwl3QmvNnNGrVOb8w3lwlUxd3kXSoaVMk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProfiles() {
  console.log('Listing all profiles in DB...');
  const { data, error } = await supabase.from('profiles').select('id, full_name, role, tenant_id');
  if (error) {
    console.error('Error:', error);
    return;
  }
  data.forEach(p => console.log(`- ${p.id}: ${p.full_name} (${p.role})`));
}

listProfiles();
