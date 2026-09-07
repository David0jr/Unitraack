import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbPassword = process.env.DB_PASSWORD || '';
const projectRef = 'olcezecosvfibgzpawnw';

if (!dbPassword) {
  console.error('\n❌ ERRO: DB_PASSWORD não configurada no .env!');
  process.exit(1);
}

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

async function main() {
  const client = await pool.connect();
  try {
    console.log('Running migration...');
    
    // Add registration_number to profiles table
    await client.query(`
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
      COMMENT ON COLUMN public.profiles.registration_number IS 'Número de matrícula do funcionário';
    `);
    
    console.log('✅ Column registration_number successfully added to profiles table!');
    
    // Verify columns
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
    `);
    console.log('Current columns in profiles:', res.rows.map(r => r.column_name));
    
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
