import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const dbPassword = process.env.DB_PASSWORD || '';
const projectRef = 'olcezecosvfibgzpawnw';

// Usamos o pool de conexão direta do Supabase (Porta 5432)
// Formato: postgresql://postgres:[PASSWORD]@db.olcezecosvfibgzpawnw.supabase.co:5432/postgres
export const pool = new Pool({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: 'postgres',
  password: dbPassword,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

export const runQuery = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};
