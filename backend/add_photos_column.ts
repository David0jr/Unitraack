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

    console.log('Adicionando coluna photos à tabela material_movements...');
    
    // Adicionar photos como um array de texto (URLs das fotos)
    await client.query(`
      ALTER TABLE material_movements 
      ADD COLUMN IF NOT EXISTS photos TEXT[];
    `);

    console.log('Migração concluída com sucesso!');
  } catch (err) {
    console.error('Erro durante a migração:', err);
  } finally {
    await client.end();
  }
}

migrate();
