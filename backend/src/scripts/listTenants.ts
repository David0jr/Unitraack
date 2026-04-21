import { supabaseAdmin } from '../config/supabase';

async function listTenants() {
  console.log('Fetching tenants...');
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('--- REGISTERED TENANTS ---');
  if (data && data.length > 0) {
    console.table(data.map(t => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      cnpj: t.cnpj
    })));
  } else {
    console.log('No tenants found.');
  }
}

listTenants();
