import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function migrate() {
  const password = encodeURIComponent(process.env.DB_PASSWORD || '');
  const connectionString = `postgres://postgres:${password}@db.olcezecosvfibgzpawnw.supabase.co:5432/postgres`;
  
  const client = new Client({
    connectionString
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados Supabase.');

    console.log('Adicionando colunas driver_name e plate à tabela entry_requests...');
    
    // Adicionar driver_name
    await client.query(`
      ALTER TABLE entry_requests 
      ADD COLUMN IF NOT EXISTS driver_name TEXT;
    `);

    // Adicionar plate
    await client.query(`
      ALTER TABLE entry_requests 
      ADD COLUMN IF NOT EXISTS plate TEXT;
    `);

    console.log('Migração concluída com sucesso!');
  } catch (err) {
    console.error('Erro durante a migração:', err);
  } finally {
    await client.end();
  }
}

migrate();
