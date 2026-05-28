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
import { ListSectorMaterials } from '../../../application/use-cases/ListSectorMaterials';
import { TransferMaterial } from '../../../application/use-cases/TransferMaterial';
import { AcceptMaterialTransfer } from '../../../application/use-cases/AcceptMaterialTransfer';
import { RejectMaterialTransfer } from '../../../application/use-cases/RejectMaterialTransfer';
import { MarkCheckout } from '../../../application/use-cases/MarkCheckout';
import { CancelByGatekeeper } from '../../../application/use-cases/CancelByGatekeeper';
import { MarkMaterialForExit } from '../../../application/use-cases/MarkMaterialForExit';
import { userService } from '../../../services/UserService';

const requestRepo = new SupabaseRequestRepository();

export class RequestController {
  
  static async create(req: AuthRequest, res: Response) {
    try {
      const { sector, sector_id, entry_date, materials, driver_name, plate, signature } = req.body;
      
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Perfil ou Unidade não identificada.', 403);
      }

      const useCase = new CreateEntryRequest(requestRepo);
      const id = await useCase.execute(
        { 
          sector, 
          sector_id, 
          entry_date, 
          driver_name,
          plate,
          signature,
          tenant_id: profile.tenant_id, 
          profile_id: req.user.id 
        }, 
        materials
      );
      
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

      const queryFilters = { ...(req.query as any) };
      if (profile.role === 'TERCEIRIZADA') {
        queryFilters.profile_id = profile.id;
      }

      const useCase = new ListRequests(requestRepo);
      const requests = await useCase.execute(profile.tenant_id, queryFilters);
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
        status: ['PENDING'], // Pendências para o líder
        sector: profile.sector || undefined,
        sector_id: profile.sector_id || undefined
      });

      return ApiResponse.success(res, {
        requests,
        lider: {
          full_name: profile.full_name,
          sector: profile.sector || 'Geral',
          sector_id: profile.sector_id || undefined
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
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Perfil não encontrado.', 404);

      const useCase = new ReviewEntryRequest(requestRepo);
      await useCase.execute(id, acao, profile.role, req.user.id, profile.tenant_id, reason);
      return ApiResponse.success(res, { message: `Requisição processada com sucesso!` });
    } catch (error: any) {
      console.error("[RequestController.review] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async confirmEntry(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const useCase = new ConfirmEntry(requestRepo);
      await useCase.execute(id, req.user.id, profile.tenant_id);
      return ApiResponse.success(res, { message: 'Entrada confirmada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.confirmEntry] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async confirmMovement(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { materialIds, type, signature, photos, observation } = req.body; // type: 'ENTRY' | 'EXIT'
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const useCase = new ConfirmMaterialMovement(requestRepo);
      await useCase.execute(id, materialIds, type, req.user.id, profile.tenant_id, signature, photos, observation);
      return ApiResponse.success(res, { message: 'Movimentação confirmada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.confirmMovement] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getDetails(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const useCase = new GetRequestDetails(requestRepo);
      const data = await useCase.execute(id, profile.tenant_id, profile.role, profile.id);
      return ApiResponse.success(res, data);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { sector, sector_id, entry_date, materials, driver_name, plate } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const useCase = new UpdateEntryRequest(requestRepo);
      await useCase.execute(id, { sector, sector_id, entry_date, driver_name, plate }, materials, profile.tenant_id, profile.role, profile.id);
      return ApiResponse.success(res, { message: 'Solicitação atualizada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.update] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async cancel(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const useCase = new CancelEntryRequest(requestRepo);
      await useCase.execute(id, profile.tenant_id, profile.role, profile.id);
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
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Perfil não encontrado.', 403);
      
      const useCase = new DeleteEntryRequest(requestRepo);
      await useCase.execute(id, profile.role, profile.tenant_id, profile.id);
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
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const useCase = new NotifyDiscrepancy(requestRepo);
      await useCase.execute(id, profile.tenant_id, reason);
      return ApiResponse.success(res, { message: 'Divergência notificada ao Gestor de Segurança!' });
    } catch (error: any) {
      console.error("[RequestController.notifyDiscrepancy] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async markCheckout(req: AuthRequest, res: Response) {
    try {
      const { request_id } = req.body;
      if (!request_id) return ApiResponse.error(res, 'request_id é obrigatório.', 400);

      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const useCase = new MarkCheckout(requestRepo);
      await useCase.execute(request_id, req.user.id, profile.tenant_id);
      
      return ApiResponse.success(res, { message: 'Saída definitiva registrada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.markCheckout] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async cancelByGatekeeper(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const useCase = new CancelByGatekeeper(requestRepo);
      await useCase.execute(id, profile.tenant_id, reason, req.user.id);
      return ApiResponse.success(res, { message: 'Solicitação cancelada com sucesso.' });
    } catch (error: any) {
      console.error("[RequestController.cancelByGatekeeper] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async markMaterialForExit(req: AuthRequest, res: Response) {
    try {
      const { materialIds, signature, photos, observation } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Perfil ou Unidade não identificada.', 403);

      const useCase = new MarkMaterialForExit(requestRepo);
      await useCase.execute(materialIds, profile.tenant_id, profile.id, signature, photos, observation);
      
      return ApiResponse.success(res, { message: 'Materiais enviados para a Portaria com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.markMaterialForExit] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async getAuditHistory(req: AuthRequest, res: Response) {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile) return ApiResponse.error(res, 'Perfil não encontrado.', 404);


      let tenantIdToAudit = profile.tenant_id;

      // Se for Super Admin, ele pode auditar qualquer tenant via parâmetro
      if (profile.role === 'SUPER_ADMIN' && req.params.tenantId) {
        tenantIdToAudit = req.params.tenantId as string;
      }

      if (!tenantIdToAudit) {
        return ApiResponse.error(res, 'Acesso negado: Unidade não identificada.', 403);
      }

      let sectorId: string | undefined;
      let actorId: string | undefined;
      if (profile.role === 'LIDER_SETOR') {
        actorId = profile.id;
        sectorId = profile.sector_id || undefined;
        if (!sectorId && profile.sector) {
          sectorId = await requestRepo.findSectorByName(tenantIdToAudit, profile.sector) || undefined;
        }
      }

      const useCase = new GetAuditHistory(requestRepo);
      const history = await useCase.execute(tenantIdToAudit, sectorId, actorId);
      console.log(`[RequestController] Enviando ${history.length} registros para o cliente.`);
      return ApiResponse.success(res, history);
    } catch (error: any) {
      console.error("[RequestController.getAuditHistory] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async listSectorMaterials(req: AuthRequest, res: Response) {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Perfil ou Unidade não encontrada.', 403);

      let sectorId = profile.sector_id;
      if (!sectorId && profile.sector) {
        sectorId = await requestRepo.findSectorByName(profile.tenant_id, profile.sector);
      }

      if (!sectorId) return ApiResponse.error(res, 'Setor não identificado para este usuário.', 403);

      const { status } = req.query;
      const useCase = new ListSectorMaterials(requestRepo);
      const materials = await useCase.execute(profile.tenant_id, sectorId, status as any);
      
      return ApiResponse.success(res, materials);
    } catch (error: any) {
      console.error("[RequestController.listSectorMaterials] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async transferMaterial(req: AuthRequest, res: Response) {
    try {
      const { materialIds, toSectorId, signature, photos, observation } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id || !profile.sector_id) return ApiResponse.error(res, 'Perfil ou Setor não encontrado.', 403);

      const useCase = new TransferMaterial(requestRepo);
      await useCase.execute(materialIds, profile.sector_id, toSectorId, req.user.id, profile.tenant_id, signature, photos, observation);
      
      return ApiResponse.success(res, { message: 'Transferência iniciada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.transferMaterial] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async acceptTransfer(req: AuthRequest, res: Response) {
    try {
      const { materialIds, signature } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id || !profile.sector_id) return ApiResponse.error(res, 'Perfil ou Setor não encontrado.', 403);

      const useCase = new AcceptMaterialTransfer(requestRepo);
      await useCase.execute(materialIds, profile.sector_id, req.user.id, profile.tenant_id, signature);
      
      return ApiResponse.success(res, { message: 'Materiais aceitos com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.acceptTransfer] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async rejectTransfer(req: AuthRequest, res: Response) {
    try {
      const { materialIds } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id || !profile.sector_id) return ApiResponse.error(res, 'Perfil ou Setor não encontrado.', 403);

      const useCase = new RejectMaterialTransfer(requestRepo);
      await useCase.execute(materialIds, req.user.id, profile.tenant_id);
      
      return ApiResponse.success(res, { message: 'Transferência recusada. Materiais devolvidos ao setor de origem.' });
    } catch (error: any) {
      console.error("[RequestController.rejectTransfer] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

}
