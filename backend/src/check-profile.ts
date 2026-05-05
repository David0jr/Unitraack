import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfile(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, tenant:tenants(*)')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Profile:', JSON.stringify(profile, null, 2));
    }
  } catch (err: any) {
    console.error('Unexpected error:', err.message);
  }
}

checkProfile('b50828a0-21c9-4721-a6d9-1672700a7b73');
