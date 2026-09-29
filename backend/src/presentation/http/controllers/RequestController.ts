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
import { CancelMaterialTransfer } from '../../../application/use-cases/CancelMaterialTransfer';
import { MarkCheckout } from '../../../application/use-cases/MarkCheckout';
import { CancelByGatekeeper } from '../../../application/use-cases/CancelByGatekeeper';
import { MarkMaterialForExit } from '../../../application/use-cases/MarkMaterialForExit';
import { userService } from '../../../services/UserService';
import { supabaseAdmin } from '../../../config/supabase';
import { NotificationService } from '../../../services/NotificationService';

const requestRepo = new SupabaseRequestRepository();

export class RequestController {
  
  /**
   * Valida se a matrícula informada existe e pertence a um colaborador ativo no banco de dados.
   * Se expectedUserId for fornecido e o usuário não for SUPER_ADMIN, garante que a matrícula pertence ao usuário informado.
   */
  static async validateRegistrationNumber(
    tenantId: string, 
    registrationInput: string | undefined, 
    options?: { expectedUserId?: string; userRole?: string }
  ) {
    const cleanSignature = (registrationInput || '').trim().toUpperCase();
    if (!cleanSignature) {
      throw new Error('A matrícula do colaborador é obrigatória.');
    }

    const { data: matchedUsers, error: searchError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, registration_number, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .ilike('registration_number', cleanSignature);

    if (searchError) {
      console.error('[RequestController.validateRegistrationNumber] Erro ao consultar banco:', searchError);
      throw new Error('Erro ao validar matrícula no banco de dados.');
    }

    if (!matchedUsers || matchedUsers.length === 0) {
      throw new Error(`Matrícula inválida! A matrícula informada ("${cleanSignature}") não foi encontrada no banco de dados ou não pertence a um colaborador ativo.`);
    }

    const authorizedUser = matchedUsers[0];

    if (options?.expectedUserId && options?.userRole !== 'SUPER_ADMIN') {
      if (authorizedUser.id !== options.expectedUserId) {
        throw new Error(`Matrícula informada pertence a ${authorizedUser.full_name}, mas a operação está sendo realizada por outro usuário.`);
      }
    }

    return authorizedUser;
  }

  
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
          sector_id: profile.sector_id || undefined,
          registration_number: profile.registration_number || undefined
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

      const cleanSignature = (signature || '').trim().toUpperCase();
      if (!cleanSignature) {
        return ApiResponse.error(res, 'A matrícula de confirmação é obrigatória.', 400);
      }

      // Validação no banco de dados da matrícula informada
      const authorizedUser = await RequestController.validateRegistrationNumber(profile.tenant_id, cleanSignature);

      // O responsável vinculado no histórico será o usuário identificado pela matrícula
      const movedByUserId = authorizedUser.id;

      const useCase = new ConfirmMaterialMovement(requestRepo);
      await useCase.execute(id, materialIds, type, movedByUserId, profile.tenant_id, cleanSignature, photos, observation);
      return ApiResponse.success(res, { 
        message: `${type === 'ENTRY' ? 'Entrada' : 'Saída'} autorizada com sucesso por ${authorizedUser.full_name}!`,
        authorizer: authorizedUser.full_name,
        role: authorizedUser.role,
        registration_number: authorizedUser.registration_number
      });
    } catch (error: any) {
      console.error("[RequestController.confirmMovement] Erro:", error);
      return ApiResponse.error(res, error.message, 400);
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
      
      const reqDetails = await requestRepo.findById(id);
      if (reqDetails) {
        NotificationService.notifyDiscrepancy(reqDetails, reason).catch((err) =>
          console.error('[RequestController.notifyDiscrepancy] Erro ao notificar:', err)
        );
      }
      
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

      const cleanSignature = (signature || '').trim().toUpperCase();
      const authorizedUser = await RequestController.validateRegistrationNumber(
        profile.tenant_id, 
        cleanSignature, 
        { expectedUserId: profile.id, userRole: profile.role }
      );

      const useCase = new MarkMaterialForExit(requestRepo);
      await useCase.execute(materialIds, profile.tenant_id, authorizedUser.id, cleanSignature, photos, observation);
      
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

      const isPortaria = profile.role === 'PORTARIA' || (req.baseUrl && req.baseUrl.includes('portaria')) || req.query.onlyPortaria === 'true';

      const useCase = new GetAuditHistory(requestRepo);
      const history = await useCase.execute(tenantIdToAudit, sectorId, actorId, isPortaria);
      console.log(`[RequestController] Enviando ${history.length} registros para o cliente (onlyPortaria: ${isPortaria}).`);
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

      if (profile.sector_id === toSectorId) {
        return ApiResponse.error(res, 'O setor de destino deve ser diferente do setor de origem do equipamento.', 400);
      }

      const { data: mats } = await supabaseAdmin
        .from('materials')
        .select('id, current_sector_id')
        .in('id', materialIds);

      if (mats && mats.some(m => m.current_sector_id === toSectorId)) {
        return ApiResponse.error(res, 'O setor de destino não pode ser o mesmo setor onde o equipamento já se encontra.', 400);
      }

      const cleanSignature = (signature || '').trim().toUpperCase();
      const authorizedUser = await RequestController.validateRegistrationNumber(
        profile.tenant_id, 
        cleanSignature, 
        { expectedUserId: profile.id, userRole: profile.role }
      );

      const useCase = new TransferMaterial(requestRepo);
      await useCase.execute(materialIds, profile.sector_id, toSectorId, authorizedUser.id, profile.tenant_id, cleanSignature, photos, observation);
      
      NotificationService.notifyTransferRequested(profile.tenant_id, profile.sector_id, toSectorId, materialIds.length).catch((err) =>
        console.error('[RequestController.transferMaterial] Erro ao notificar transferencia:', err)
      );

      return ApiResponse.success(res, { message: 'Transferência iniciada com sucesso!' });
    } catch (error: any) {
      console.error("[RequestController.transferMaterial] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  static async acceptTransfer(req: AuthRequest, res: Response) {
    try {
      const { materialIds, signature, photos, observation } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id || !profile.sector_id) return ApiResponse.error(res, 'Perfil ou Setor não encontrado.', 403);

      const cleanSignature = (signature || '').trim().toUpperCase();
      const authorizedUser = await RequestController.validateRegistrationNumber(
        profile.tenant_id, 
        cleanSignature, 
        { expectedUserId: profile.id, userRole: profile.role }
      );

      const useCase = new AcceptMaterialTransfer(requestRepo);
      await useCase.execute(materialIds, profile.sector_id, authorizedUser.id, profile.tenant_id, cleanSignature, photos, observation);
      
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

  static async cancelTransfer(req: AuthRequest, res: Response) {
    try {
      const { materialIds } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id || !profile.sector_id) return ApiResponse.error(res, 'Perfil ou Setor não encontrado.', 403);

      // Buscar os materiais antes de cancelar para identificar os setores de destino e nomes dos equipamentos
      const materialsToCancel = await Promise.all(
        materialIds.map(async (id: string) => {
          return await requestRepo.findMaterialById(id);
        })
      );

      const validMaterials = materialsToCancel.filter(Boolean);
      const destinationSectorIds = [...new Set(validMaterials.map(m => m?.pending_sector_id).filter(Boolean))];

      const useCase = new CancelMaterialTransfer(requestRepo);
      await useCase.execute(materialIds, req.user.id, profile.tenant_id);

      // Notificar cada setor destinatário sobre o cancelamento
      for (const destSectorId of destinationSectorIds) {
        if (!destSectorId) continue;
        const itemsForThisSector = validMaterials.filter(m => m?.pending_sector_id === destSectorId);
        const itemNames = itemsForThisSector.map(m => m?.name).filter(Boolean).join(', ');
        NotificationService.notifyTransferCancelled(
          profile.tenant_id,
          profile.sector_id,
          destSectorId,
          itemNames || `${itemsForThisSector.length} equipamento(s)`
        ).catch((err) =>
          console.error('[RequestController.cancelTransfer] Erro ao notificar cancelamento:', err)
        );
      }
      
      return ApiResponse.success(res, { message: 'Envio cancelado com sucesso. Material retornado ao setor.' });
    } catch (error: any) {
      console.error("[RequestController.cancelTransfer] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Atualiza o status da portaria no fluxo de entrada (WAITING_ARRIVAL -> ARRIVED -> IN_ANALYSIS)
   */
  static async updateGateStatus(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const validStatuses = ['WAITING_ARRIVAL', 'ARRIVED', 'IN_ANALYSIS', 'WAITING_EXIT', 'EXIT_CONFERENCE'];
      if (!validStatuses.includes(status)) {
        return ApiResponse.error(res, `Status inválido para portaria: ${status}`, 400);
      }

      const request = await requestRepo.findById(id);
      if (!request) return ApiResponse.error(res, 'Requisição não encontrada.', 404);
      if (request.tenant_id !== profile.tenant_id) return ApiResponse.error(res, 'Acesso não autorizado.', 403);

      await requestRepo.updateStatus(id, status as any, undefined, profile.id);

      // Disparar notificações em tempo real para Líderes e Gestores
      if (status === 'ARRIVED') {
        NotificationService.notifyArrival(request).catch(console.error);
      } else if (status === 'IN_ANALYSIS') {
        NotificationService.notifyAnalysis(request).catch(console.error);
      } else if (status === 'EXIT_CONFERENCE') {
        await supabaseAdmin
          .from('materials')
          .update({ status: 'EXIT_CONFERENCE' })
          .eq('request_id', id)
          .eq('status', 'WAITING_EXIT');
        NotificationService.notifyExitConference(request).catch(console.error);
      } else if (status === 'WAITING_EXIT') {
        await supabaseAdmin
          .from('materials')
          .update({ status: 'WAITING_EXIT' })
          .eq('request_id', id)
          .eq('status', 'EXIT_CONFERENCE');
      }

      return ApiResponse.success(res, { message: `Status alterado para ${status} com sucesso!` });
    } catch (error: any) {
      console.error("[RequestController.updateGateStatus] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Lista notificações para Gestores, Líderes e Portaria
   */
  static async listNotifications(req: AuthRequest, res: Response) {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const notifications = await NotificationService.listByTenant(
        profile.tenant_id, 
        profile.sector_id || undefined,
        profile.role,
        50,
        profile.id
      );
      return ApiResponse.success(res, notifications);
    } catch (error: any) {
      console.error("[RequestController.listNotifications] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Marca notificação individual como lida para o usuário atual
   */
  static async markNotificationRead(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      await NotificationService.markAsRead(id, req.user.id);
      return ApiResponse.success(res, { message: 'Notificação marcada como lida.' });
    } catch (error: any) {
      console.error("[RequestController.markNotificationRead] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Marca todas as notificações como lidas exclusivamente para este usuário
   */
  static async markAllNotificationsRead(req: AuthRequest, res: Response) {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      await NotificationService.markAllAsRead(profile.tenant_id, profile.id, profile.sector_id || undefined, profile.role);
      return ApiResponse.success(res, { message: 'Todas as notificações foram marcadas como lidas.' });
    } catch (error: any) {
      console.error("[RequestController.markAllNotificationsRead] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Limpa as notificações exclusivamente para este usuário
   */
  static async clearAllNotifications(req: AuthRequest, res: Response) {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      await NotificationService.clearAll(profile.tenant_id, profile.id, profile.sector_id || undefined, profile.role);
      return ApiResponse.success(res, { message: 'Notificações limpas com sucesso.' });
    } catch (error: any) {
      console.error("[RequestController.clearAllNotifications] Erro:", error);
      return ApiResponse.error(res, error.message);
    }
  }

}
