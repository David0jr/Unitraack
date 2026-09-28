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
    console.log('1. Atualizando constraint de status de entry_requests...');
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
        'COMPLETED', 
        'CANCELED', 
        'DISCREPANCY'
      ));
    `);
    console.log('Constraint de status atualizada com sucesso!');

    console.log('2. Criando tabela de notificações...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        role VARCHAR(50),
        sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
        request_id UUID REFERENCES public.entry_requests(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'INFO',
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON public.notifications(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Usuários autenticados podem ver notificações do tenant" ON public.notifications;
      CREATE POLICY "Usuários autenticados podem ver notificações do tenant" ON public.notifications
        FOR SELECT
        USING (
          tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        );

      DROP POLICY IF EXISTS "Usuários autenticados podem atualizar notificações do tenant" ON public.notifications;
      CREATE POLICY "Usuários autenticados podem atualizar notificações do tenant" ON public.notifications
        FOR UPDATE
        USING (
          tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        );

      DROP POLICY IF EXISTS "Service role ou autenticados podem inserir notificações" ON public.notifications;
      CREATE POLICY "Service role ou autenticados podem inserir notificações" ON public.notifications
        FOR INSERT
        WITH CHECK (true);
    `);
    console.log('Tabela de notificações criada com sucesso!');

    try {
      console.log('3. Habilitando Realtime para notifications...');
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;`);
      console.log('Realtime habilitado para notifications!');
    } catch (realtimeErr: any) {
      console.log('Nota sobre realtime (já adicionado ou gerenciado pelo supabase):', realtimeErr.message);
    }

    console.log('4. Atualizando schema cache do PostgREST...');
    await client.query(`NOTIFY pgrst, 'reload schema';`);

    console.log('✅ Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Falha na migração:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
