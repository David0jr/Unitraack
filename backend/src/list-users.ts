import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllUsers() {
  console.log(`Listing all users...`);
  
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    
    console.log('Users found:', users.map(u => ({ id: u.id, email: u.email })));
  } catch (err: any) {
    console.error('Unexpected error:', err.message);
  }
}

listAllUsers();
