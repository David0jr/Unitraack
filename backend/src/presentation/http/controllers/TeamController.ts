import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { userService } from '../../../services/UserService';
import { ApiResponse } from '../../../utils/apiResponse';

export class TeamController {
  
  /**
   * Lista todos os membros da equipe do tenant do gestor autenticado.
   */
  static async listMembers(req: AuthRequest, res: Response): Promise<any> {
    try {
      const profile = await userService.findProfileById(req.user.id as string);
      if (!profile || !profile.tenant_id) {
        return ApiResponse.error(res, 'Perfil não vinculado a uma unidade.', 403);
      }

      const members = await userService.listTeamMembers(profile.tenant_id);
      return ApiResponse.success(res, members);
    } catch (error: any) {
      console.error('[TeamController] listMembers error:', error);
      return ApiResponse.error(res, 'Erro ao listar membros da equipe.', 500);
    }
  }

  /**
   * Atualiza dados de um membro da equipe.
   */
  static async updateMember(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { full_name, role, sector, sector_id, is_active } = req.body;

      // Validação: Gestor só pode editar membros do próprio tenant
      const manager = await userService.findProfileById(req.user.id as string);
      const targetUser = await userService.findProfileById(id as string);

      if (!manager || !targetUser || manager.tenant_id !== targetUser.tenant_id) {
        return ApiResponse.error(res, 'Acesso negado ou usuário não encontrado.', 403);
      }

      await userService.updateProfile(id as string, { 
        full_name, 
        role, 
        sector, 
        sector_id, 
        is_active 
      });

      return ApiResponse.success(res, { message: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      console.error('[TeamController] updateMember error:', error);
      return ApiResponse.error(res, 'Erro ao atualizar membro.', 500);
    }
  }

  /**
   * Reseta a senha de um membro da equipe manualmente.
   */
  static async resetPassword(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return ApiResponse.error(res, 'A senha deve ter pelo menos 6 caracteres.', 400);
      }

      const manager = await userService.findProfileById(req.user.id as string);
      const targetUser = await userService.findProfileById(id as string);

      if (!manager || !targetUser || manager.tenant_id !== targetUser.tenant_id) {
        return ApiResponse.error(res, 'Acesso negado ou usuário não encontrado.', 403);
      }

      await userService.updateUserPassword(id as string, newPassword);
      return ApiResponse.success(res, { message: 'Senha redefinida com sucesso!' });
    } catch (error: any) {
      console.error('[TeamController] resetPassword error:', error);
      return ApiResponse.error(res, 'Erro ao redefinir senha.', 500);
    }
  }

  /**
   * Remove um membro da equipe permanentemente.
   */
  static async deleteMember(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const manager = await userService.findProfileById(req.user.id as string);
      const targetUser = await userService.findProfileById(id as string);

      if (!manager || !targetUser || manager.tenant_id !== targetUser.tenant_id) {
        return ApiResponse.error(res, 'Acesso negado ou usuário não encontrado.', 403);
      }

      await userService.deleteUser(id as string);
      return ApiResponse.success(res, { message: 'Membro removido com sucesso!' });
    } catch (error: any) {
      console.error('[TeamController] deleteMember error:', error);
      return ApiResponse.error(res, 'Erro ao remover membro da equipe.', 500);
    }
  }
}
