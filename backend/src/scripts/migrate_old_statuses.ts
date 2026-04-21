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

async function migrateStatuses() {
  const client = await pool.connect();
  try {
    console.log('Migrando dados legados...');
    await client.query(`UPDATE public.entry_requests SET status = 'APPROVED' WHERE status = 'APPROVED_LIDER';`);
    await client.query(`UPDATE public.entry_requests SET status = 'REJECTED' WHERE status = 'REJECTED_LIDER';`);
    console.log('✅ Migração das solicitações antigas concluída com sucesso!');
  } catch (err) {
    console.error('❌ Falha:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateStatuses();
