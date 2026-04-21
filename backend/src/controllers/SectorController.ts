import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sectorService } from '../services/SectorService';
import { userService } from '../services/UserService';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Controller responsável pela gestão da estrutura organizacional (setores).
 */
export class SectorController {

  /**
   * Recupera a lista de setores da unidade vinculada ao usuário.
   */
  static async listSectors(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Unidade organizacional não identificada.', 403);
      }

      const sectors = await sectorService.listByTenant(profile.tenant_id as string);
      return ApiResponse.success(res, sectors);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Cria um novo setor ou subsetor na unidade do usuário.
   */
  static async createSector(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { name, parent_id } = req.body;

      if (!name) {
        return ApiResponse.error(res, 'Nome do setor é obrigatório.', 400);
      }

      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Unidade organizacional não identificada.', 403);
      }

      const sector = await sectorService.create(profile.tenant_id as string, name, parent_id);
      return ApiResponse.success(res, sector, 201);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }

  /**
   * Exclui um setor específico da unidade.
   */
  static async deleteSector(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Acesso negado.', 403);
      }

      await sectorService.delete(id as string, profile.tenant_id as string);
      return ApiResponse.success(res, { message: 'Setor removido com sucesso.' }, 200);
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500, error);
    }
  }
}
