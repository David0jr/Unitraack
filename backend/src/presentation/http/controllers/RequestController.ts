import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { ApiResponse } from '../../../utils/apiResponse';
import { SupabaseRequestRepository } from '../../../infrastructure/database/SupabaseRequestRepository';
import { CreateEntryRequest } from '../../../application/use-cases/CreateEntryRequest';
import { ReviewEntryRequest } from '../../../application/use-cases/ReviewEntryRequest';
import { ConfirmEntry } from '../../../application/use-cases/ConfirmEntry';
import { ConfirmMaterialMovement } from '../../../application/use-cases/ConfirmMaterialMovement';
import { ListRequests } from '../../../application/use-cases/ListRequests';
import { GetRequestDetails } from '../../../application/use-cases/GetRequestDetails';
import { UpdateEntryRequest } from '../../../application/use-cases/UpdateEntryRequest';
import { CancelEntryRequest } from '../../../application/use-cases/CancelEntryRequest';
import { DeleteEntryRequest } from '../../../application/use-cases/DeleteEntryRequest';
import { NotifyDiscrepancy } from '../../../application/use-cases/NotifyDiscrepancy';
import { GetAuditHistory } from '../../../application/use-cases/GetAuditHistory';
import { userService } from '../../../services/UserService';

const requestRepo = new SupabaseRequestRepository();

export class RequestController {
  
  static async create(req: AuthRequest, res: Response) {
    try {
      const { request, materials } = req.body;
      const useCase = new CreateEntryRequest(requestRepo);
      const id = await useCase.execute(request, materials);
      return ApiResponse.success(res, { id, message: 'Requisição criada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.create] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async listByTenant(req: AuthRequest, res: Response) {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const useCase = new ListRequests(requestRepo);
      const requests = await useCase.execute(profile.tenant_id, req.query as any);
      return ApiResponse.success(res, requests);
    } catch (error: any) {
      console.error("[RequestController.listByTenant] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async listLeaderPendencias(req: AuthRequest, res: Response) {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Perfil ou Tenant não encontrado.', 403);

      const useCase = new ListRequests(requestRepo);
      // Filtra apenas pendências do setor do líder
      const requests = await useCase.execute(profile.tenant_id, {
        status: ['PENDING', 'APPROVED_LIDER'], // Pendências para o líder
        sector: profile.sector || undefined,
        sector_id: profile.sector_id || undefined
      });

      return ApiResponse.success(res, {
        requests,
        lider: {
          full_name: profile.full_name,
          sector: profile.sector || 'Geral'
        }
      });
    } catch (error: any) {
      console.error("[RequestController.listLeaderPendencias] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async review(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { acao, reason } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile) return ApiResponse.error(res, 'Perfil não encontrado.', 404);

      const useCase = new ReviewEntryRequest(requestRepo);
      await useCase.execute(id, acao, profile.role, req.user.id, reason);
      return ApiResponse.success(res, { message: `Requisição processada com sucesso!` });
    } catch (error: any) {
      console.error("[RequestController.review] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async confirmEntry(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const useCase = new ConfirmEntry(requestRepo);
      await useCase.execute(id, req.user.id);
      return ApiResponse.success(res, { message: 'Entrada confirmada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.confirmEntry] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async confirmMovement(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { materialIds, type } = req.body; // type: 'ENTRY' | 'EXIT'
      const useCase = new ConfirmMaterialMovement(requestRepo);
      await useCase.execute(id, materialIds, type, req.user.id);
      return ApiResponse.success(res, { message: 'Movimentação confirmada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.confirmMovement] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getDetails(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const useCase = new GetRequestDetails(requestRepo);
      const data = await useCase.execute(id);
      return ApiResponse.success(res, data);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { sector, sector_id, entry_date, materials } = req.body;
      const useCase = new UpdateEntryRequest(requestRepo);
      await useCase.execute(id, { sector, sector_id, entry_date }, materials);
      return ApiResponse.success(res, { message: 'Solicitação atualizada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.update] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async cancel(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const useCase = new CancelEntryRequest(requestRepo);
      await useCase.execute(id);
      return ApiResponse.success(res, { message: 'Solicitação cancelada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.cancel] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const profile = await userService.findProfileById(req.user.id);
      
      const useCase = new DeleteEntryRequest(requestRepo);
      await useCase.execute(id, profile?.role);
      return ApiResponse.success(res, { message: 'Solicitação excluída com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.delete] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async notifyDiscrepancy(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const useCase = new NotifyDiscrepancy(requestRepo);
      await useCase.execute(id, reason);
      return ApiResponse.success(res, { message: 'Divergência notificada ao Gestor de Segurança!' });
    } catch (error: any) {
      console.error("[RequestController.notifyDiscrepancy] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getAuditHistory(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.params.tenantId as string;
      const useCase = new GetAuditHistory(requestRepo);
      const data = await useCase.execute(tenantId);
      return ApiResponse.success(res, data);
    } catch (error: any) {
      console.error("[RequestController.getAuditHistory] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }
}
