import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const email = 'davidsilvvw@gmail.com';
  console.log(`Checking user: ${email}`);
  
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.log('User not found in Auth.');
    return;
  }

  console.log('User ID:', user.id);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Profile query error:', profileError);
  } else {
    console.log('Current Profile Data:', JSON.stringify(profile, null, 2));
    if (profile?.role === 'SUPER_ADMIN') {
      console.log('User IS a SUPER_ADMIN. The issue might be cache or session.');
    } else {
      console.log(`WARNING: User role is '${profile?.role}'. Needs to be 'SUPER_ADMIN'.`);
    }
  }
}

check();
