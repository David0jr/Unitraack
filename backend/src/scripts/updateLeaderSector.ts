import { pool } from '../config/database';

async function updateLeader() {
  try {
    const leaderEmail = 'lider@usinalins.com';
    console.log(`\n🎯 Atualizando setor do líder: ${leaderEmail}`);

    const result = await pool.query(`
      UPDATE public.profiles 
      SET sector = 'Caldeiras', full_name = 'Líder Caldeiras'
      WHERE role = 'LIDER_SETOR';
    `);

    console.log(`✅ Sucesso! ${result.rowCount} líderes atualizados.`);
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Erro ao atualizar líder:', err.message);
    process.exit(1);
  }
}

updateLeader();
