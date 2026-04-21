import { sectorService } from '../services/SectorService';

async function test() {
  const tId = '631bca05-18ab-4628-8742-d668ebbe804e'; // ID da Usina Lins do listTenants
  console.log('--- Testando Setores ---');
  try {
    const sectors = await sectorService.listByTenant(tId);
    console.log('Setores atuais:', sectors);
    
    // Tentar criar um se não houver
    if (sectors.length === 0) {
      const newSector = await sectorService.create(tId, 'Teste Setor');
      console.log('Criado:', newSector);
    }
  } catch (err: any) {
    console.error('ERRO:', err.message);
    if (err.message.includes('relation "public.sectors" does not exist')) {
      console.log('\n>>> AÇÃO NECESSÁRIA: Você precisa criar a tabela "sectors" no Supabase!');
      console.log(`
      Execute este SQL no painel do Supabase:
      
      CREATE TABLE public.sectors (
          id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
          tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
          name text NOT NULL,
          created_at timestamp with time zone DEFAULT now() NOT NULL,
          UNIQUE(tenant_id, name)
      );
      `);
    }
  }
}

test();
