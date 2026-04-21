import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { requestService } from '../services/RequestService';
import { userService } from '../services/UserService';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Controller responsável pelas operações realizadas por empresas Terceirizadas.
 * Gerencia a submissão de inventários e personalização de identidade visual (Digital Twin).
 */
export class TerceirizadaController {
  
  /**
   * Submete uma nova requisição de entrada de materiais/equipamentos para a Usina.
   * Vincula a solicitação ao setor e unidade industrial correspondente.
   */
  static async criarRequisicao(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { sector, sector_id, entryDate, entry_date, materialsList, materials } = req.body;

      // Unifica as fontes possíveis da lista de materiais (compatibilidade legada)
      const finalMaterials = materialsList || materials;
      const finalEntryDate = entryDate || entry_date;

      if (!sector || !finalEntryDate || !finalMaterials || !Array.isArray(finalMaterials)) {
        return ApiResponse.error(res, 'Dados incompletos para a requisição.', 400);
      }

      const profile = await userService.findProfileById(req.user.id);
      if (!profile) {
        return ApiResponse.error(res, 'Perfil não encontrado para o usuário logado.', 403);
      }

      // 2. Persiste a requisição e a lista de materiais vinculada
      const requestId = await requestService.createRequest({
        tenant_id: profile.tenant_id!,
        profile_id: req.user.id,
        sector: sector,
        sector_id: sector_id || null,
        entry_date: finalEntryDate,
        status: 'PENDING'
      }, finalMaterials.map((m: any) => ({
        name: m.name,
        brand: m.brand || null,
        model: m.model || null,
        serial_number: m.serial_number || null,
        description: m.description || null,
        condition: m.condition || 'USADO',
        code: m.code || null,
        image_url: m.imageUrl || null
      })));

      return ApiResponse.success(res, { 
        message: 'Requisição submetida com sucesso!', 
        requestId: requestId 
      }, 201);
      
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Recupera o perfil da terceirizada, garantindo que a mesma possua uma cor de identificação no Digital Twin.
   */
  static async getProfile(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      
      if (!profile) {
        return ApiResponse.error(res, 'Perfil não encontrado.', 404);
      }

      // Lógica de Geração de Cor Determinística: 
      // Se não houver cor salva, gera uma cor fixa baseada no ID do usuário para o mapa interativo.
      if (!profile.company_color) {
        let charCodeSum = 0;
        const userId = String(req.user.id);
        for (let i = 0; i < userId.length; i++) {
          charCodeSum += userId.charCodeAt(i);
        }
        
        const hue = charCodeSum % 360;
        const autoColor = `hsl(${hue}, 70%, 55%)`;

        await userService.updateProfile(req.user.id, { company_color: autoColor });
        profile.company_color = autoColor;
      }

      return ApiResponse.success(res, profile);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Permite que a empresa terceirizada altere sua cor de exibição operativa no dashboard.
   */
  static async updateColor(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { color } = req.body;
      if (!color) {
        return ApiResponse.error(res, 'A cor é obrigatória.', 400);
      }

      await userService.updateProfile(req.user.id, { company_color: color });
      return ApiResponse.success(res, { message: 'Cor atualizada com sucesso!' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Cancela uma requisição (Muda status para CANCELED).
   */
  static async cancelarRequisicao(req: AuthRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const profile = await userService.findProfileById(req.user.id);
      
      // Validação de propriedade
      const request = await requestService.findById(id);
      if (!request || request.profile_id !== req.user.id) {
        return ApiResponse.error(res, 'Requisição não encontrada ou acesso negado.', 403);
      }

      await requestService.updateStatus(id, 'CANCELED' as any);
      return ApiResponse.success(res, { message: 'Solicitação cancelada com sucesso.' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Deleta permanentemente uma requisição do banco.
   */
  static async deletarRequisicao(req: AuthRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      
      const request = await requestService.findById(id);
      if (!request || request.profile_id !== req.user.id) {
        return ApiResponse.error(res, 'Requisição não encontrada ou acesso negado.', 403);
      }

      await requestService.deleteRequest(id);
      return ApiResponse.success(res, { message: 'Solicitação excluída com sucesso.' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Atualiza uma requisição existente e redefine o status para PENDING.
   */
  static async editarRequisicao(req: AuthRequest, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const { sector, sector_id, entry_date, materials } = req.body;

      const request = await requestService.findById(id);
      if (!request || request.profile_id !== req.user.id) {
        return ApiResponse.error(res, 'Requisição não encontrada ou acesso negado.', 403);
      }

      const materialsToUpdate = materials.map((m: any) => ({
        name: m.name,
        brand: m.brand || null,
        model: m.model || null,
        serial_number: m.serial_number || null,
        description: m.description || null,
        condition: m.condition || 'USADO',
        code: m.code || null,
        image_url: m.imageUrl || null
      }));

      await requestService.updateFullRequest(id, {
        sector,
        sector_id: sector_id || null,
        entry_date,
        status: 'PENDING'
      }, materialsToUpdate);

      return ApiResponse.success(res, { message: 'Solicitação atualizada e enviada para nova análise.' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }
}
