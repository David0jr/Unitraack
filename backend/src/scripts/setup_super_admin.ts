import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSuperAdmin(email: string, password: string) {
  try {
    console.log(`Configurando Super Admin: ${email}`);
    
    // 1. Verificar se o usuário já existe no Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log('Usuário não encontrado. Criando nova conta Auth...');
      const { data: { user: newUser }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'SaaS Owner' }
      });
      if (createError) throw createError;
      user = newUser!;
      console.log('Conta Auth criada com sucesso.');
    } else {
      console.log('Usuário já existe no Auth. Garantindo que a senha esteja correta...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
      if (updateError) console.warn('Aviso: Não foi possível atualizar a senha (talvez restrição de segurança), mas vamos prosseguir com a promoção.');
    }

    // 2. Garantir que o perfil existe e tem o role correto
    console.log(`Promovendo ID ${user.id} para SUPER_ADMIN no banco de dados...`);
    
    // Tentamos dar um upsert no profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        role: 'SUPER_ADMIN',
        full_name: 'David Silva (Owner)',
        tenant_id: null // Super Admin não pertence a um tenant específico
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Erro ao configurar perfil:', profileError.message);
      if (profileError.message.includes('profiles_role_check')) {
        console.error('ERRO CRÍTICO: Você precisa rodar o script SQL (super_admin_setup.sql) no painel do Supabase primeiro!');
      }
    } else {
      console.log('--------------------------------------------------');
      console.log('SUCESSO: Super Admin configurado!');
      console.log(`Email: ${email}`);
      console.log(`Senha: ${password}`);
      console.log('--------------------------------------------------');
    }

  } catch (err: any) {
    console.error('Erro no setup:', err.message);
  }
}

const email = 'davidsilvvw@gmail.com';
const password = 'david123';

setupSuperAdmin(email, password);
