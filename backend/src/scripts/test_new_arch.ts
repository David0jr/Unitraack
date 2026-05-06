import { CreateEntryRequest } from '../application/use-cases/CreateEntryRequest';
import { SupabaseRequestRepository } from '../infrastructure/database/SupabaseRequestRepository';

console.log('--- Testando Nova Arquitetura ---');

try {
  const repo = new SupabaseRequestRepository();
  const useCase = new CreateEntryRequest(repo);
  console.log('✅ Use Case e Repositório instanciados com sucesso!');
} catch (err) {
  console.error('❌ Erro ao instanciar componentes:', err);
}
