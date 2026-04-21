import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promote(email: string) {
  try {
    console.log(`Buscando usuário com email: ${email}...`);
    
    // 1. Pegar o ID do usuário pelo Auth (usando admin API)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw authError;
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error(`Usuário com email ${email} não encontrado no Supabase Auth.`);
      return;
    }

    console.log(`Usuário encontrado! ID: ${user.id}. Promovendo para SUPER_ADMIN...`);

    // 2. Atualizar o profile com o role SUPER_ADMIN
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'SUPER_ADMIN' })
      .eq('id', user.id);

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError.message);
    } else {
      console.log('SUCESSO! Usuário promovido a SUPER_ADMIN.');
      console.log('Agora você pode logar com esta conta e acessar o Painel de Expansão.');
    }

  } catch (err: any) {
    console.error('Erro na promoção:', err.message);
  }
}

// Pega o email dos argumentos da linha de comando
const emailArg = process.argv[2];
if (!emailArg) {
  console.log('Uso: npx ts-node promote_admin.ts seu-email@exemplo.com');
} else {
  promote(emailArg);
}
