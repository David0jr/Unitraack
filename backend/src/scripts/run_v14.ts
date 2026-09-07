import fs from 'fs';
import path from 'path';
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

async function runSingle() {
  const client = await pool.connect();
  try {
    const filePath = path.join(__dirname, '../sql/update_v14_pending_sector.sql');
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log(`✅ update_v14_pending_sector.sql aplicado com sucesso!`);
  } catch (err: any) {
    console.error('\n❌ Falha na migração:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runSingle();
