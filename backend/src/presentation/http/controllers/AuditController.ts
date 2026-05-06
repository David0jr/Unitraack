import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { auditService } from '../../../services/AuditService';
import { userService } from '../../../services/UserService';
import { ApiResponse } from '../../../utils/apiResponse';

export class AuditController {

  static async getAuditReport(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Acesso negado.', 403);

      const { profileId } = req.query;
      const data = await auditService.getTenantAudit(profile.tenant_id as string, profileId as string);
      return ApiResponse.success(res, data);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }

  static async getThirdPartyStats(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id);
      if (!profile || !profile.tenant_id) return ApiResponse.error(res, 'Acesso negado.', 403);

      const data = await auditService.getThirdPartyStats(profile.tenant_id as string);
      return ApiResponse.success(res, data);
    } catch (error: any) {
      return ApiResponse.error(res, error.message);
    }
  }
}
