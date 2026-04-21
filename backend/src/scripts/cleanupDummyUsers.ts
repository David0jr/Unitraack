import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const dummyEmails = [
  'terceirizada@usinalins.com',
  'lider@usinalins.com',
  'portaria@usinalins.com',
  'gestor@usinalins.com'
];

async function cleanup() {
  console.log('--- Iniciando Limpeza de Usuários Fictícios ---');

  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Erro ao listar usuários:', listError.message);
    return;
  }

  for (const email of dummyEmails) {
    const user = users.find(u => u.email === email);
    
    if (user) {
      console.log(`Removendo ${email} (ID: ${user.id})...`);
      
      // Profiles tem Cascade, então deletar auth user deve limpar profile.
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error(`Erro ao deletar ${email}:`, deleteError.message);
      } else {
        console.log(`✅ ${email} removido com sucesso.`);
      }
    } else {
      console.log(`E-mail ${email} não encontrado. Pulando.`);
    }
  }

  console.log('--- Limpeza Finalizada! ---');
}

cleanup();
