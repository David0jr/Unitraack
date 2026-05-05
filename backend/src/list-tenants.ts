import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTenants() {
  console.log('Listing all tenants...');
  
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*');
    
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Tenants:', JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error('Unexpected error:', err.message);
  }
}

listTenants();
