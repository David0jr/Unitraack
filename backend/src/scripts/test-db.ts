import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  try {
    console.log('Testing entries query...');
    const { data, error } = await supabase
      .from('entry_requests')
      .select(`
        *,
        profiles:profile_id (full_name),
        materials (*)
      `)
      .limit(1);

    if (error) {
      console.error('Query failed:', error.message);
      console.error('Error Details:', error);
    } else {
      console.log('Query successful! Data:', JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error('Crash during test:', err.message);
  }
}

test();
