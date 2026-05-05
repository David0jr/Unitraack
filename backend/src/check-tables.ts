import { supabaseAdmin } from './config/supabase';

async function checkTables() {
  console.log('--- Verificando Tabela materials ---');
  const { data: matData, error: matErr } = await supabaseAdmin.from('materials').select('*').limit(1);
  if (matErr) console.error('Erro materials:', matErr);
  else console.log('Colunas materials:', Object.keys(matData[0] || {}));

  console.log('\n--- Verificando Tabela entry_requests ---');
  const { data: reqData, error: reqErr } = await supabaseAdmin.from('entry_requests').select('*').limit(1);
  if (reqErr) console.error('Erro entry_requests:', reqErr);
  else console.log('Colunas entry_requests:', Object.keys(reqData[0] || {}));

  console.log('\n--- Verificando Tabela sectors ---');
  const { data: secData, error: secErr } = await supabaseAdmin.from('sectors').select('*').limit(1);
  if (secErr) console.error('Erro sectors:', secErr);
  else console.log('Colunas sectors:', Object.keys(secData[0] || {}));
}

checkTables();
