import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbPassword = process.env.DB_PASSWORD || '';
const projectRef = 'olcezecosvfibgzpawnw';

const pool = new Pool({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: 'postgres',
  password: dbPassword,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Adicionando status CANCELED à constraint...');
    await client.query(`ALTER TABLE public.entry_requests DROP CONSTRAINT IF EXISTS entry_requests_status_check;`);
    await client.query(`
      ALTER TABLE public.entry_requests ADD CONSTRAINT entry_requests_status_check 
      CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'APPROVED_LIDER', 'REJECTED_LIDER', 'APPROVED_GESTOR', 'REJECTED_GESTOR', 'IN_PLANTA', 'COMPLETED', 'CANCELED'));
    `);

    console.log('Atualizando schema cache do PostgREST...');
    await client.query(`NOTIFY pgrst, 'reload schema';`);

    console.log('✅ Correções aplicadas com sucesso!');
  } catch (err) {
    console.error('❌ Falha:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
