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
    console.log('Adicionando colunas read_by e dismissed_by em public.notifications...');
    await client.query(`
      ALTER TABLE public.notifications 
      ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS dismissed_by UUID[] DEFAULT '{}';

      CREATE INDEX IF NOT EXISTS idx_notifications_read_by ON public.notifications USING GIN (read_by);
      CREATE INDEX IF NOT EXISTS idx_notifications_dismissed_by ON public.notifications USING GIN (dismissed_by);

      NOTIFY pgrst, 'reload schema';
    `);
    console.log('✅ Colunas read_by e dismissed_by criadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
