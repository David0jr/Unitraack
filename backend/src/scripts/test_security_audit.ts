process.env.NODE_ENV = 'production';

import { corsOptions } from '../middlewares/securityMiddleware';
import { GetRequestDetails } from '../application/use-cases/GetRequestDetails';
import { DeleteEntryRequest } from '../application/use-cases/DeleteEntryRequest';
import { UpdateEntryRequest } from '../application/use-cases/UpdateEntryRequest';
import { IRequestRepository } from '../domain/repositories/IRequestRepository';
import { EntryRequest, Material } from '../domain/entities/EntryRequest';

/**
 * Bateria de Testes Automatizados de Defesa e Segurança — Unitraack
 * Executa validações de regras de acesso, isolamento de tenant, IDOR e CORS.
 */
async function runSecurityAudit() {
  console.log('====================================================');
  console.log('🛡️  INICIANDO SUITE DE TESTES DE SEGURANÇA UNITRAACK');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // -----------------------------------------------------------------
  // 1. TESTE DE CORS: Whitelist e Bloqueio de Origens Maliciosas
  // -----------------------------------------------------------------
  console.log('\n--- 1. Auditoria de Política CORS ---');
  
  await new Promise<void>((resolve) => {
    // 1.1 Deve permitir Vercel de produção
    (corsOptions.origin as any)('https://unitraack.vercel.app', (err: any, allow: boolean) => {
      assert(allow === true && !err, 'CORS: Permite https://unitraack.vercel.app');
    });

    // 1.2 Deve permitir Railway
    (corsOptions.origin as any)('https://unitraack-production.up.railway.app', (err: any, allow: boolean) => {
      assert(allow === true && !err, 'CORS: Permite https://unitraack-production.up.railway.app');
    });

    // 1.3 Deve permitir domínio oficial Unitraack
    (corsOptions.origin as any)('https://usina-lins.unitraack.com', (err: any, allow: boolean) => {
      assert(allow === true && !err, 'CORS: Permite subdomínio *.unitraack.com');
    });

    // 1.4 Deve permitir localhost para desenvolvimento
    (corsOptions.origin as any)('http://localhost:5173', (err: any, allow: boolean) => {
      assert(allow === true && !err, 'CORS: Permite http://localhost:5173');
    });

    // 1.5 Deve bloquear domínio malicioso desconhecido
    (corsOptions.origin as any)('https://hacker-site-malicioso.com', (err: any, allow: boolean) => {
      assert(allow === false, 'CORS: Bloqueia https://hacker-site-malicioso.com');
      resolve();
    });
  });

  // -----------------------------------------------------------------
  // 2. TESTE ANTI-IDOR & CROSS-TENANT (GetRequestDetails Use Case)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Auditoria Anti-IDOR (GetRequestDetails) ---');

  const mockMockRequest: EntryRequest = {
    id: 'req-100',
    tenant_id: 'tenant-usina-lins',
    profile_id: 'user-terceirizada-a',
    sector: 'Manutenção',
    sector_id: 'sec-1',
    driver_name: 'Motorista Silva',
    plate: 'ABC1D23',
    entry_date: new Date().toISOString(),
    status: 'PENDING',
    created_at: new Date().toISOString()
  };

  const mockRepo: Partial<IRequestRepository> = {
    findById: async (id: string) => {
      if (id === 'req-100') return { ...mockMockRequest, materials: [] };
      return null;
    }
  };

  const getDetailsUseCase = new GetRequestDetails(mockRepo as IRequestRepository);

  // 2.1 Acesso legítimo da mesma empresa e tenant
  try {
    const res = await getDetailsUseCase.execute('req-100', 'tenant-usina-lins', 'TERCEIRIZADA', 'user-terceirizada-a');
    assert(res.id === 'req-100', 'IDOR: Usuário proprietário visualiza a requisição com sucesso');
  } catch (e: any) {
    assert(false, `IDOR: Falha no acesso legítimo: ${e.message}`);
  }

  // 2.2 Tentativa de acesso Cross-Tenant (Usina B tentando ler Usina A)
  try {
    await getDetailsUseCase.execute('req-100', 'tenant-OUTRA-usina', 'TERCEIRIZADA', 'user-terceirizada-a');
    assert(false, 'IDOR: ERRO GRAVE! Usina diferente conseguiu ler dados');
  } catch (e: any) {
    assert(e.message.includes('não pertence à sua unidade'), 'IDOR: Bloqueou tentativa de acesso de outra Usina (Cross-Tenant)');
  }

  // 2.3 Tentativa de espionagem entre Terceirizadas concorrentes no mesmo tenant
  try {
    await getDetailsUseCase.execute('req-100', 'tenant-usina-lins', 'TERCEIRIZADA', 'user-terceirizada-CONCORRENTE-B');
    assert(false, 'IDOR: ERRO GRAVE! Terceirizada B leu dados da Terceirizada A');
  } catch (e: any) {
    assert(e.message.includes('outra empresa'), 'IDOR: Bloqueou tentativa de Terceirizada ler dados de concorrente');
  }

  // 2.4 Gestor da Usina pode auditar requisição da sua unidade
  try {
    const resGestor = await getDetailsUseCase.execute('req-100', 'tenant-usina-lins', 'GESTOR_SEGURANCA', 'user-gestor-usina');
    assert(resGestor.id === 'req-100', 'RBAC: Gestor de Segurança da usina tem permissão de visualização para triagem');
  } catch (e: any) {
    assert(false, `RBAC: Gestor deveria conseguir auditar: ${e.message}`);
  }

  // -----------------------------------------------------------------
  // 3. TESTE DE EXCLUSÃO SEGURA (DeleteEntryRequest Use Case)
  // -----------------------------------------------------------------
  console.log('\n--- 3. Auditoria de Exclusão Segura (DeleteEntryRequest) ---');

  let deletedId: string | null = null;
  const mockDeleteRepo: Partial<IRequestRepository> = {
    findById: async (id: string) => {
      if (id === 'req-active') {
        return { ...mockMockRequest, id: 'req-active', status: 'IN_PLANTA', materials: [] };
      }
      if (id === 'req-canceled') {
        return { ...mockMockRequest, id: 'req-canceled', status: 'CANCELED', materials: [] };
      }
      return null;
    },
    delete: async (id: string) => {
      deletedId = id;
    }
  };

  const deleteUseCase = new DeleteEntryRequest(mockDeleteRepo as IRequestRepository);

  // 3.1 Não pode excluir material que está dentro da planta (IN_PLANTA)
  try {
    await deleteUseCase.execute('req-active', 'TERCEIRIZADA', 'tenant-usina-lins', 'user-terceirizada-a');
    assert(false, 'Segurança: Não deveria permitir excluir requisição ativa na planta');
  } catch (e: any) {
    assert(e.message.includes('canceladas ou recusadas podem ser excluídas'), 'Segurança: Bloqueou tentativa de apagar histórico de material ativo');
  }

  // 3.2 Terceirizada B não pode excluir requisição cancelada da Terceirizada A
  try {
    await deleteUseCase.execute('req-canceled', 'TERCEIRIZADA', 'tenant-usina-lins', 'user-terceirizada-CONCORRENTE-B');
    assert(false, 'IDOR: Terceirizada não autorizada conseguiu excluir');
  } catch (e: any) {
    assert(e.message.includes('outra empresa'), 'IDOR: Bloqueou exclusão indevida por terceiro');
  }

  // -----------------------------------------------------------------
  // RESULTADO FINAL CONSOLIDADO
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 RESULTADO DA AUDITORIA: ${passed} PASSOU | ${failed} FALHOU`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
