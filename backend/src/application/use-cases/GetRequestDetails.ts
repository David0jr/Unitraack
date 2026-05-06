import { IRequestRepository } from '../../domain/repositories/IRequestRepository';

export class GetRequestDetails {
  constructor(private requestRepository: IRequestRepository) {}

  async execute(requestId: string) {
    const request = await this.requestRepository.findById(requestId);
    if (!request) throw new Error('Requisição não encontrada.');
    return request;
  }
}
