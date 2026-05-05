const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://olcezecosvfibgzpawnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY2V6ZWNvc3ZmaWJnenBhd253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUxMzM2NSwiZXhwIjoyMDkxMDg5MzY1fQ.YLtDaSQyA1vwl3QmvNnNGrVOb8w3lwlUxd3kXSoaVMk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  console.log('Checking profiles...');
  const { data: profiles, error } = await supabase.from('profiles').select('*').ilike('full_name', '%David%');
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${profiles.length} profiles.`);
  profiles.forEach(p => {
    console.log(`- ID: ${p.id}, Name: ${p.full_name}, TenantID: ${p.tenant_id}, Role: ${p.role}`);
  });
}

checkUser();
