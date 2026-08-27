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

async function migrate() {
  const sqlFiles = [
    'database.sql',
    'update_v2.sql',
    'fix_rls_recursion.sql',
    'create_sectors_table.sql',
    'update_v3_sectors.sql',
    'update_v4_hierarchy.sql',
    'update_v4_material_details.sql',
    'update_v5_gate_flow.sql',
    'update_v6_registration.sql',
    'update_v7_terceirizada_fields.sql',
    'update_v8_subdomains.sql',
    'update_v9_movements.sql',
    'update_v10_map.sql',
    'update_v11_status_constraints.sql',
    'update_v12_timestamp_and_logo.sql',
    'create_invitations.sql',
    'super_admin_setup.sql',
    'update_v13_material_status.sql',
    'audit_audit_tracking.sql',
    'update_v15_tenant_branding.sql',
    'update_v16_registration_number.sql',
    'update_v17_tenant_triad_colors.sql'
  ];

  console.log('\n🚀 Iniciando Automação de Banco de Dados...');

  const client = await pool.connect();
  try {
    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, '../sql/', file);
      if (fs.existsSync(filePath)) {

        console.log(`⏱️ Executando: ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`✅ ${file} aplicado com sucesso!`);
      } else {
        console.warn(`⚠️ Aviso: Arquivo ${file} não encontrado.`);
      }
    }
    console.log('\n🌟 Banco de dados sincronizado com sucesso!\n');
  } catch (err: any) {
    console.error('\n❌ Falha na migração:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
