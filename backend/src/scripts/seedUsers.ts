import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const usersToCreate = [
  { email: 'terceirizada@usinalins.com', role: 'TERCEIRIZADA', nome: 'Terceirizada Teste' },
  { email: 'lider@usinalins.com', role: 'LIDER_SETOR', nome: 'Líder Caldeiras', setor: 'Caldeiras' },
  { email: 'portaria@usinalins.com', role: 'PORTARIA', nome: 'Portaria Teste' },
  { email: 'gestor@usinalins.com', role: 'GESTOR_SEGURANCA', nome: 'Gestor Teste' }
];

async function seed() {
  console.log('Gerando usuários fictícios no Supabase...');

  for (const u of usersToCreate) {
    // 1. Criar Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: 'senha123',
      email_confirm: true // Pula a necessidade de enviar email real
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`Email ${u.email} já existe. Pulando criação.`);
      } else {
        console.error(`Erro ao criar Auth para ${u.email}:`, authError.message);
        continue;
      }
    } else if (authData.user) {
      console.log(`Auth criado: ${u.email} (ID: ${authData.user.id})`);
      
      // 2. Criar Profile vinculado com o Role adequado
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: u.nome,
          role: u.role,
          sector: (u as any).setor || null
        });

      if (profileError) {
        console.error(`Erro ao criar Profile para ${u.email}:`, profileError.message);
      } else {
        console.log(`Perfil criado com a role: ${u.role}`);
      }
    }
  }

  console.log('Finalizado!');
}

seed();
