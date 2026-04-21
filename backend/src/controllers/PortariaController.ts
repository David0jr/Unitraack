import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { requestService } from '../services/RequestService';
import { userService } from '../services/UserService';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Controller responsável pelas operações na Portaria da Usina.
 * Gerencia a confirmação final de entrada e visualização de ativos autorizados.
 */
export class PortariaController {

  /**
   * Lista todas as solicitações que já possuem aprovação final do Gestor e aguardam entrada física.
   */
  static async listAuthorizedRequests(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Unidade organizacional não identificada.', 403);
      }

      // Filtra apenas solicitações em estado de 'Aprovado pelo Gestor'
      const requests = await requestService.listByTenant(profile.tenant_id as string, {
        status: 'APPROVED_GESTOR'
      });
      return ApiResponse.success(res, requests);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Confirma a entrada física do ativo na unidade, finalizando o processo de autorização.
   */
  static async confirmEntry(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      await requestService.updateStatus(id as string, 'COMPLETED');
      return ApiResponse.success(res, { message: 'Entrada confirmada pela Portaria!' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Recupera detalhes completos de uma solicitação específica para conferência de documentos/materiais.
   */
  static async getRequestDetails(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const request = await requestService.findById(id as string);
      if (!request) {
        return ApiResponse.error(res, 'Requisição não encontrada.', 404);
      }
      return ApiResponse.success(res, request);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }
}
