import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateLider() {
  console.log('Atualizando usuário lider@usinalins.com...');

  // 1. Buscar o ID do usuário pelo email
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Erro ao listar usuários:', listError.message);
    return;
  }

  const user = users.users.find(u => u.email === 'lider@usinalins.com');

  if (!user) {
    console.error('Usuário lider@usinalins.com não encontrado!');
    return;
  }

  console.log(`Encontrado ID: ${user.id}`);

  // 2. Atualizar Profile
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      sector: 'Caldeiras',
      role: 'LIDER_SETOR'
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Erro ao atualizar perfil:', updateError.message);
  } else {
    console.log('✅ Perfil do Líder atualizado para Caldeiras!');
  }
}

updateLider();
