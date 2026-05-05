import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserProfile(email: string) {
  console.log(`Checking profile for email: ${email}`);
  
  try {
    // 1. Get User ID from Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    
    if (authError || !user) {
      console.error('User not found in Auth or error:', authError?.message);
      return;
    }
    
    console.log(`User ID found: ${user.id}`);

    // 2. Get Profile from DB
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, tenant:tenants(*)')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError.message);
    } else {
      console.log('Profile Data:', JSON.stringify(profile, null, 2));
    }
  } catch (err: any) {
    console.error('Unexpected error:', err.message);
  }
}

checkUserProfile('davidded253@gmail.com');
