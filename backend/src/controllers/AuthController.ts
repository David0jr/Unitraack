import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { tenantService } from '../services/TenantService';
import { TenantRequest } from '../middlewares/tenantMiddleware';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Controller responsável pelos fluxos de autenticação, registro e dados de contexto organizacional.
 * Gerencia a hierarquia de criação entre Usuários, Perfis e Unidades (Tenants).
 */
export class AuthController {
  
  /**
   * Realiza o cadastro de um novo usuário no sistema.
   * Suporta fluxos para Gestores (que criam uma nova Usina), Funcionários e Terceirizadas.
   */
  static async register(req: TenantRequest, res: Response): Promise<any> {
    try {
      const { 
        email, password, fullName, role, sector, sector_id, cnpj, 
        usinaCnpj, usinaName, representativeName, phone 
      } = req.body;

      // Validação básica de entrada
      if (!email || !password || !fullName || !role) {
        return ApiResponse.error(res, 'Campos obrigatórios ausentes.', 400);
      }

      let tenantId = null;

      // --- 1. LÓGICA DE DEFINIÇÃO DO TENANT (USINA) ---
      if (role === 'GESTOR_SEGURANCA') {
        if (!usinaName || !usinaCnpj) {
          return ApiResponse.error(res, 'Dados da Usina são obrigatórios para gestores.', 400);
        }
        // Gestor cria uma nova usina no ato do registro
        const newTenant = await tenantService.create(usinaName, usinaCnpj);
        tenantId = newTenant.id;
        
      } else if (role === 'LIDER_SETOR' || role === 'PORTARIA') {
        if (!usinaCnpj) {
          return ApiResponse.error(res, 'CNPJ da Usina é obrigatório para funcionários.', 400);
        }
        // Funcionário vincula a uma usina existente
        const tenant = await tenantService.findByCnpj(usinaCnpj);
        if (!tenant) {
          return ApiResponse.error(res, 'Usina não encontrada com este CNPJ.', 404);
        }
        tenantId = tenant.id;
        
      } else if (role === 'TERCEIRIZADA') {
        // Terceirizadas devem se cadastrar dentro do subdomínio da usina para herdar o contexto
        if (!req.tenantContext) {
          return ApiResponse.error(res, 'Acesso restrito. O cadastro deve ser feito através do link da Usina.', 403);
        }
        tenantId = req.tenantContext.id;
      }

      // --- 2. CRIAÇÃO DE CREDENCIAIS (SUPABASE AUTH) ---
      // Criamos primeiro o usuário para ter o ID vinculado
      const authUser = await authService.createAuthUser(email, password, fullName);

      // --- 3. CRIAÇÃO DO PERFIL E ATRIBUÍÇÃO DE DADOS (PROFILES) ---
      try {
        await authService.createUserProfile(authUser.id, {
          tenant_id: tenantId,
          role: role,
          full_name: fullName,
          sector: sector || null,
          sector_id: sector_id || null,
          cnpj: cnpj || null,
          representative_name: representativeName || null,
          phone: phone || null
        });

        return ApiResponse.success(res, { 
          message: 'Usuário cadastrado com sucesso!', 
          userId: authUser.id 
        }, 201);

      } catch (profileError: any) {
        // LÓGICA DE ROLLBACK: Se o perfil falhar, removemos o usuário do Auth para consistência
        console.error('[ROLLBACK] Falha ao criar perfil, removendo usuário auth:', authUser.id);
        await authService.deleteAuthUser(authUser.id);
        throw profileError; // Deixa o middleware global tratar
      }

    } catch (error: any) {
      console.error('[REGISTER ERROR]', error);
      return ApiResponse.error(res, error.message || 'Erro interno no cadastro.', 500, error);
    }
  }

  /**
   * Retorna informações da unidade (Tenant) baseada no domínio atual.
   * Utilizado para branding e regras de contexto no frontend.
   */
  static async getTenantInfo(req: TenantRequest, res: Response): Promise<any> {
    if (!req.tenantContext) {
      return ApiResponse.error(res, 'Nenhuma usina identificada neste domínio.', 404);
    }
    return ApiResponse.success(res, req.tenantContext);
  }
}
