import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listReqs() {
  console.log('Listando requisições no entry_requests...');

  const { data, error } = await supabaseAdmin
    .from('entry_requests')
    .select(`
      id,
      sector,
      status,
      profiles:profile_id (full_name)
    `);

  if (error) {
    console.error('Erro ao listar:', error.message);
  } else {
    console.table(data);
  }
}

listReqs();
