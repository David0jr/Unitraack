import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUser(userId: string) {
  console.log('Checking profile for user:', userId);
  
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('*, tenant:tenants(*)')
      .eq('id', userId)
      .maybeSingle();
    const end = Date.now();
    
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Profile found:', data);
      console.log('Query time:', end - start, 'ms');
    }
  } catch (err: any) {
    console.error('Unexpected error:', err.message);
  }
}

testUser('5a5d54ad-811a-450e-9314-73f9884107bf');
