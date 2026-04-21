import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { requestService } from '../services/RequestService';
import { userService } from '../services/UserService';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Controller responsável pelas ações operacionais do Líder de Setor.
 * Gerencia a aprovação técnica de entrada de ativos no seu respectivo setor.
 */
export class LiderController {

  /**
   * Lista solicitações de entrada que aguardam aprovação ou estão ativas no setor do Líder.
   */
  static async listRequests(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Unidade organizacional não identificada.', 403);
      }

      // Filtra solicitações especificamente para o setor do Líder
      const requests = await requestService.listByTenant(profile.tenant_id as string, {
        sector_id: profile.sector_id,
        sector: profile.sector
      });
      return ApiResponse.success(res, {
        requests,
        lider: {
          full_name: profile.full_name,
          sector: profile.sector
        }
      });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Aprova uma solicitação (fluxo padrão do Líder).
   */
  static async approveRequest(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      await requestService.updateStatus(id as string, 'APPROVED');
      return ApiResponse.success(res, { message: 'Requisição aprovada pelo Líder!' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Rejeita uma solicitação com justificativa técnica.
   */
  static async rejectRequest(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await requestService.updateStatus(id as string, 'REJECTED', reason);
      return ApiResponse.success(res, { message: 'Requisição reprovada pelo Líder.' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Método versátil para revisar (aprovar ou rejeitar) uma solicitação.
   */
  static async revisarRequest(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { acao, reason } = req.body;
      
      const newStatus = acao === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      await requestService.updateStatus(id as string, newStatus, reason);
      
      const msg = acao === 'APPROVE' ? 'aprovada' : 'rejeitada';
      return ApiResponse.success(res, { message: `Requisição ${msg} com sucesso!` });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }
}
