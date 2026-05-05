import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
