import { Request, Response } from 'express';
import { authService } from '../../../services/AuthService';
import { tenantService } from '../../../services/TenantService';
import { TenantRequest } from '../../../middlewares/tenantMiddleware';
import { ApiResponse } from '../../../utils/apiResponse';
import { supabaseAdmin } from '../../../config/supabase';

export class AuthenticationController {
  
  static async register(req: TenantRequest, res: Response): Promise<any> {
    try {
      const { 
        email, password, fullName, role, sector, sector_id, cnpj, 
        usinaCnpj, usinaName, representativeName, phone, registrationNumber,
        tenantId: bodyTenantId
      } = req.body;

      if (!email || !password || !fullName || !role) {
        return ApiResponse.error(res, 'Campos obrigatórios ausentes.', 400);
      }

      let tenantId = null;

      if (role === 'GESTOR_SEGURANCA') {
        if (!usinaName || !usinaCnpj) {
          return ApiResponse.error(res, 'Dados da Usina são obrigatórios para gestores.', 400);
        }
        const newTenant = await tenantService.create(usinaName, usinaCnpj);
        tenantId = newTenant.id;
        
      } else if (role === 'LIDER_SETOR' || role === 'PORTARIA') {
        if (bodyTenantId) {
          tenantId = bodyTenantId;
        } else if (req.tenantContext) {
          tenantId = req.tenantContext.id;
        } else {
          if (!usinaCnpj) {
            return ApiResponse.error(res, 'CNPJ da Usina é obrigatório para funcionários.', 400);
          }
          const tenant = await tenantService.findByCnpj(usinaCnpj);
          if (!tenant) {
            return ApiResponse.error(res, 'Usina não encontrada com este CNPJ.', 404);
          }
          tenantId = tenant.id;
        }
        
      } else if (role === 'TERCEIRIZADA') {
        if (!req.tenantContext) {
          return ApiResponse.error(res, 'Acesso restrito. O cadastro deve ser feito através do link da Usina.', 403);
        }
        tenantId = req.tenantContext.id;
      }

      const authUser = await authService.createAuthUser(email, password, fullName);

      let themeColor = null;
      if (role === 'TERCEIRIZADA') {
        const strongColors = ['#E63946', '#1D3557', '#4361EE', '#F72585', '#F4A261', '#7209B7', '#4CC9F0', '#06D6A0', '#FFB703', '#FF006E', '#3A0CA3', '#D00000', '#3F37C9', '#4895EF', '#4EA8DE', '#56CFE1', '#64DFDF', '#72EFDD', '#80FFDB', '#FFD166'];
        themeColor = strongColors[Math.floor(Math.random() * strongColors.length)];
      }

      try {
        await authService.createUserProfile(authUser.id, {
          tenant_id: tenantId,
          role: role,
          full_name: fullName,
          sector: sector || null,
          sector_id: sector_id || null,
          cnpj: cnpj || null,
          representative_name: representativeName || null,
          phone: phone || null,
          registration_number: registrationNumber || null,
          theme_color: themeColor,
          is_active: true
        });

        return ApiResponse.success(res, { 
          message: 'Usuário cadastrado com sucesso!', 
          userId: authUser.id 
        }, 201);

      } catch (profileError: any) {
        console.error('[ROLLBACK] Falha ao criar perfil, removendo usuário auth:', authUser.id);
        await authService.deleteAuthUser(authUser.id);
        throw profileError;
      }

    } catch (error: any) {
      console.error('[REGISTER ERROR]', error);
      return ApiResponse.error(res, error.message || 'Erro interno no cadastro.', 500, error);
    }
  }

  static async getTenantInfo(req: TenantRequest, res: Response): Promise<any> {
    if (!req.tenantContext) {
      return ApiResponse.error(res, 'Nenhuma usina identificada neste domínio.', 404);
    }
    return ApiResponse.success(res, req.tenantContext);
  }

  static async getProfile(req: any, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      console.log(`[getProfile] Requested for userId: ${userId}`);
      if (!userId) {
        console.warn('[getProfile] No userId found in request.');
        return ApiResponse.error(res, 'Não autenticado.', 401);
      }

      const profile = await authService.getUserProfile(userId);
      if (!profile) {
        console.warn(`[getProfile] Profile not found for userId: ${userId}`);
        return ApiResponse.error(res, 'Perfil não encontrado.', 404);
      }

      console.log(`[getProfile] Profile found for ${profile.full_name}`);
      return ApiResponse.success(res, profile);
    } catch (error: any) {
      console.error('[PROFILE ERROR]', error);
      return ApiResponse.error(res, 'Erro ao buscar perfil.', 500);
    }
  }

  static async validateInvitation(req: Request, res: Response): Promise<any> {
    try {
      const token = req.params.token as string;
      if (!token) {
        return ApiResponse.error(res, 'Token é obrigatório.', 400);
      }

      const invitation = await authService.validateInvitation(token);
      if (!invitation) {
        return ApiResponse.error(res, 'Convite inválido ou expirado.', 404);
      }

      return ApiResponse.success(res, invitation);
    } catch (error: any) {
      console.error('[VALIDATE INVITATION ERROR]', error);
      return ApiResponse.error(res, 'Erro ao validar convite.', 500);
    }
  }

  static async registerGestor(req: Request, res: Response): Promise<any> {
    try {
      const { token, fullName, email, password, registrationNumber } = req.body;

      if (!token || !fullName || !email || !password || !registrationNumber) {
        return ApiResponse.error(res, 'Campos obrigatórios ausentes.', 400);
      }

      const invitation = await authService.validateInvitation(token);
      if (!invitation) {
        return ApiResponse.error(res, 'Convite inválido ou expirado.', 404);
      }

      const authUser = await authService.createAuthUser(email, password, fullName);

      try {
        await authService.createUserProfile(authUser.id, {
          tenant_id: invitation.tenant_id,
          role: 'GESTOR_SEGURANCA',
          full_name: fullName,
          registration_number: registrationNumber,
          is_active: true
        });

        await supabaseAdmin
          .from('invitations')
          .delete()
          .eq('token', token);

        return ApiResponse.success(res, {
          message: 'Gestor cadastrado com sucesso!',
          userId: authUser.id
        }, 201);

      } catch (profileError: any) {
        console.error('[ROLLBACK] Falha ao criar perfil do Gestor, removendo usuário auth:', authUser.id);
        await authService.deleteAuthUser(authUser.id);
        throw profileError;
      }

    } catch (error: any) {
      console.error('[REGISTER GESTOR ERROR]', error);
      return ApiResponse.error(res, error.message || 'Erro no cadastro do Gestor.', 500);
    }
  }
}
