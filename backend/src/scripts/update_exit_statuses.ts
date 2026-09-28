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
    console.log('1. Atualizando constraint de status de entry_requests para suportar saída...');
    await client.query(`ALTER TABLE public.entry_requests DROP CONSTRAINT IF EXISTS entry_requests_status_check;`);
    await client.query(`
      ALTER TABLE public.entry_requests ADD CONSTRAINT entry_requests_status_check 
      CHECK (status IN (
        'PENDING', 
        'APPROVED', 
        'REJECTED', 
        'APPROVED_LIDER', 
        'REJECTED_LIDER', 
        'APPROVED_GESTOR', 
        'REJECTED_GESTOR', 
        'WAITING_ARRIVAL', 
        'ARRIVED', 
        'IN_ANALYSIS', 
        'IN_PLANTA', 
        'WAITING_EXIT',
        'EXIT_CONFERENCE',
        'COMPLETED', 
        'CANCELED', 
        'DISCREPANCY'
      ));
    `);
    console.log('Constraint de status de entry_requests atualizada!');

    console.log('2. Garantindo tamanho do status em materials...');
    await client.query(`ALTER TABLE public.materials ALTER COLUMN status TYPE VARCHAR(50);`);
    console.log('Coluna materials.status atualizada para VARCHAR(50)!');

    console.log('3. Atualizando schema cache do PostgREST...');
    await client.query(`NOTIFY pgrst, 'reload schema';`);

    console.log('✅ Migração de status de saída concluída com sucesso!');
  } catch (err) {
    console.error('❌ Falha na migração:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
