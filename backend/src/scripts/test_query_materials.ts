import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const tenantId = 'd2af505f-28e9-4796-97b9-b43b700670b7'; // Usina Lins

async function testQuery() {
  try {
    console.log('Testing query with materials status eq IN_PLANTA:');
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        request:entry_requests!request_id!inner(
          id,
          profile:profiles!profile_id(full_name, role, theme_color, logo_url, cnpj, phone, representative_name),
          tenant_id,
          status
        )
      `)
      .eq('entry_requests.tenant_id', tenantId)
      .eq('status', 'IN_PLANTA');

    if (error) {
      console.error('Query Error:', error.message);
      console.error('Full Error:', error);
    } else {
      console.log('Query Success. Rows fetched:', data?.length);
      if (data && data.length > 0) {
        console.log('Sample row:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err: any) {
    console.error('Crash:', err.message);
  }
}

testQuery();
