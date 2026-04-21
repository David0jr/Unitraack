import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuery() {
  try {
    console.log('Testing listTenants query...');
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        profiles(count)
      `)
      .limit(1);

    if (error) {
      console.error('Query Error:', error.message);
      console.error('Full Error:', error);
    } else {
      console.log('Query Success:', JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error('Crash:', err.message);
  }
}

testQuery();
