import { IRequestRepository } from '../../domain/repositories/IRequestRepository';
import { EntryRequest, Material } from '../../domain/entities/EntryRequest';

export class CreateEntryRequest {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestData: Partial<EntryRequest>, materials: Partial<Material>[]): Promise<string> {
    // Aqui poderiam entrar regras de negócio adicionais antes de salvar
    if (!requestData.tenant_id) throw new Error('Tenant ID é obrigatório.');
    if (!requestData.profile_id) throw new Error('Profile ID é obrigatório.');
    
    return await this.requestRepository.create(requestData, materials);
  }
}
