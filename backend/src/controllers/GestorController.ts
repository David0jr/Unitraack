import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { requestService } from '../services/RequestService';
import { userService } from '../services/UserService';
import { monitoringService } from '../services/MonitoringService';
import { auditService } from '../services/AuditService';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Controller responsável pelas operações administrativas e de monitoramento do Gestor.
 * Gerencia aprovações globais, visualização operativa e infraestrutura do Mapa.
 */
export class GestorController {

  /**
   * Lista todas as solicitações de entrada vinculadas à unidade (Tenant) do gestor.
   */
  static async listRequests(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Tenant não identificado.', 403);
      }

      const requests = await requestService.listByTenant(profile.tenant_id as string);
      return ApiResponse.success(res, requests);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Aprova uma solicitação de entrada (Plano B / Aprovação Forçada pelo Gestor).
   */
  static async approveRequest(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      await requestService.updateStatus(id as string, 'APPROVED_GESTOR');
      return ApiResponse.success(res, { message: 'Requisição aprovada pelo Gestor!' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Reprova uma solicitação de entrada com justificativa.
   */
  static async rejectRequest(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await requestService.updateStatus(id as string, 'REJECTED_GESTOR', reason);
      return ApiResponse.success(res, { message: 'Requisição reprovada pelo Gestor.' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Consolida dados para o Dashboard de Monitoramento Operativo (Digital Twin).
   */
  static async getMonitoring(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Tenant não identificado.', 403);
      }

      const data = await monitoringService.getOperationalData(profile.tenant_id as string);
      return ApiResponse.success(res, data);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Realiza a transferência manual de um material entre setores (subsetores).
   */
  static async transferMaterial(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { material_id, to_sector_id } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Tenant não identificado.', 403);
      }

      await monitoringService.transferMaterial(
        profile.tenant_id as string,
        material_id,
        to_sector_id,
        req.user.id
      );

      return ApiResponse.success(res, { message: 'Equipamento transferido com sucesso!' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Persiste as novas coordenadas de layout dos setores no Mapa Interativo.
   */
  static async updateMapLayout(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { layouts } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Tenant não identificado.', 403);
      }

      await monitoringService.updateMapLayout(profile.tenant_id as string, layouts);
      return ApiResponse.success(res, { message: 'Layout do mapa atualizado com sucesso!' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Atualiza a posição X/Y de um ícone de material no mapa.
   */
  static async updateMaterialPosition(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { material_id, x, y } = req.body;
      await monitoringService.updateMaterialPosition(material_id, x, y);
      return ApiResponse.success(res, { message: 'Posição do material atualizada.' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Marca o checkout definitivo de um ativo (saída da usina).
   */
  static async markCheckout(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { entry_request_id } = req.body;
      await requestService.markCheckout(entry_request_id, req.user.id);
      return ApiResponse.success(res, { message: 'Checkout realizado com sucesso!' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Busca relatório de auditoria detalhado (histórico de movimentação e permanência).
   */
  static async getAuditReport(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Acesso negado.', 403);
      }

      const { profileId } = req.query;
      const data = await auditService.getTenantAudit(profile.tenant_id as string, profileId as string);
      return ApiResponse.success(res, data);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Retorna estatísticas de terceirizados ativos e concluídos para auditoria.
   */
  static async getThirdParties(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Acesso negado.', 403);
      }

      const data = await auditService.getThirdPartyStats(profile.tenant_id as string);
      return ApiResponse.success(res, data);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }
}
