const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://olcezecosvfibgzpawnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY2V6ZWNvc3ZmaWJnenBhd253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUxMzM2NSwiZXhwIjoyMDkxMDg5MzY1fQ.YLtDaSQyA1vwl3QmvNnNGrVOb8w3lwlUxd3kXSoaVMk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSectors() {
  console.log('Checking sectors in DB...');
  const { data: sectors, error } = await supabase.from('sectors').select('*');
  
  if (error) {
    console.error('Error fetching sectors:', error);
    return;
  }

  console.log(`Found ${sectors.length} sectors.`);
  sectors.forEach(s => {
    console.log(`- ID: ${s.id}, Name: ${s.name}, TenantID: ${s.tenant_id}, ParentID: ${s.parent_id}`);
  });

  const { data: tenants, error: tError } = await supabase.from('tenants').select('*');
  if (tError) {
    console.error('Error fetching tenants:', tError);
  } else {
    console.log('Tenants in DB:');
    tenants.forEach(t => {
      console.log(`- ID: ${t.id}, Name: ${t.name}, Slug: ${t.subdomain}`);
    });
  }
}

checkSectors();
