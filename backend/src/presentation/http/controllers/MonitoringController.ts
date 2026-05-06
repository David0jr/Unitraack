import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { monitoringService } from '../../../services/MonitoringService';
import { userService } from '../../../services/UserService';
import { ApiResponse } from '../../../utils/apiResponse';

export class MonitoringController {

  static async getOperationalData(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      const data = await monitoringService.getOperationalData(profile.tenant_id as string);
      return ApiResponse.success(res, data);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async transferMaterial(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { material_id, to_sector_id } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      await monitoringService.transferMaterial(
        profile.tenant_id as string,
        material_id,
        to_sector_id,
        req.user.id
      );

      return ApiResponse.success(res, { message: 'Equipamento transferido com sucesso!' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async updateMapLayout(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { layouts } = req.body;
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Tenant não identificado.', 403);

      await monitoringService.updateMapLayout(profile.tenant_id as string, layouts);
      return ApiResponse.success(res, { message: 'Layout do mapa atualizado com sucesso!' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async updateMaterialPosition(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { material_id, x, y } = req.body;
      await monitoringService.updateMaterialPosition(material_id, x, y);
      return ApiResponse.success(res, { message: 'Posição do material atualizada.' });
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
