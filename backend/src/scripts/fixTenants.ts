import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixTenants() {
  console.log('--- Corrigindo Estrutura de Tenants (Multi-SaaS) ---');

  // 1. Garantir que a Usina Lins existe na tabela 'tenants'
  let { data: tenant, error: tError } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('cnpj', '00.000.000/0001-91')
    .single();

  if (!tenant) {
    console.log('Criando tenant padrão: Usina Lins...');
    const { data: newTenant, error: createError } = await supabaseAdmin
      .from('tenants')
      .insert({ 
        name: 'Usina Lins', 
        cnpj: '00.000.000/0001-91' 
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Erro ao criar tenant:', createError.message);
      return;
    }
    tenant = newTenant;
  }

  const tenantId = (tenant as any).id;
  console.log(`Tenant ID: ${tenantId}`);

  // 2. Atualizar todos os perfis para apontar para este tenant_id
  const { error: pError } = await supabaseAdmin
    .from('profiles')
    .update({ tenant_id: tenantId })
    .is('tenant_id', null);

  if (pError) {
    console.error('Erro ao atualizar perfis:', pError.message);
  } else {
    console.log('✅ Todos os perfis vinculados à Usina Lins!');
  }

  // 3. Atualizar todas as requisições para apontar para este tenant_id
  const { error: rError } = await supabaseAdmin
    .from('entry_requests')
    .update({ tenant_id: tenantId })
    .is('tenant_id', null);

  if (rError) {
    console.error('Erro ao atualizar requisições:', rError.message);
  } else {
    console.log('✅ Todas as requisições vinculadas à Usina Lins!');
  }

  console.log('--- Finalizado! O 500 deve sumir agora. ---');
}

fixTenants();
