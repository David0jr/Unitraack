const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://olcezecosvfibgzpawnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY2V6ZWNvc3ZmaWJnenBhd253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUxMzM2NSwiZXhwIjoyMDkxMDg5MzY1fQ.YLtDaSQyA1vwl3QmvNnNGrVOb8w3lwlUxd3kXSoaVMk';

const supabase = createClient(supabaseUrl, supabaseKey);

const tenantId = 'd2af505f-28e9-4796-97b9-b43b700670b7'; // Usina Lins

async function checkMonitoringData() {
  console.log('Simulating getOperationalData for Usina Lins...');
  
  // 1. Sectors
  const { data: sectors, error: sectorError } = await supabase
    .from('sectors')
    .select('*, parent:sectors(name)')
    .eq('tenant_id', tenantId);

  if (sectorError) {
    console.error('Error fetching sectors:', sectorError);
  } else {
    console.log(`Found ${sectors.length} sectors.`);
    const mainSectors = sectors.filter(s => !s.parent_id);
    console.log(`Main sectors (parent_id is null): ${mainSectors.length}`);
    mainSectors.forEach(s => console.log(`- ${s.name} (ID: ${s.id})`));
  }
}

checkMonitoringData();
