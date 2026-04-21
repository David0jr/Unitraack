import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Controller responsável por ações de autenticação e registro públicas (sem necessidade de token).
 * Gerencia o fluxo de convites e o onboarding inicial de novos gestores e parceiros.
 */
export class PublicAuthController {

  /**
   * Valida um token de convite e retorna os metadados da Usina vinculada.
   * Utilizado na tela de registro para garantir autenticidade do fluxo via link.
   */
  static async validateInvitation(req: Request, res: Response): Promise<any> {
    try {
      const { token } = req.params;

      const { data: invite, error } = await supabaseAdmin
        .from('invitations')
        .select(`
          *,
          tenant:tenants(name, subdomain)
        `)
        .eq('token', token)
        .eq('used', false)
        .single();

      if (error || !invite) {
        return ApiResponse.error(res, 'Convite inválido ou já utilizado.', 404);
      }

      // Validação de expiração temporal
      if (new Date(invite.expires_at) < new Date()) {
        return ApiResponse.error(res, 'Este convite expirou.', 400);
      }

      return ApiResponse.success(res, invite);
    } catch (error: any) {
      return ApiResponse.error(res, 'Erro ao validar convite.', 500, error);
    }
  }

  /**
   * Registra um novo gestor administrativo através de um convite válido.
   * Cria o usuário no Auth, o perfil no banco e marca o convite como processado.
   */
  static async registerGestor(req: Request, res: Response): Promise<any> {
    try {
      const { token, fullName, email, password } = req.body;

      if (!token || !fullName || !email || !password) {
        return ApiResponse.error(res, 'Todos os campos são obrigatórios.', 400);
      }

      // 1. Revalidar convite
      const { data: invite, error: iError } = await supabaseAdmin
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (iError || !invite) {
        return ApiResponse.error(res, 'Convite inválido ou expirado.', 400);
      }

      // 2. Criação de credenciais no Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) {
        return ApiResponse.error(res, 'Erro ao criar conta:' + authError.message, 400);
      }

      // 3. Persistência do Perfil vinculado ao Tenant do convite
      const { error: pError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          tenant_id: invite.tenant_id,
          role: invite.role || 'GESTOR_SEGURANCA',
          full_name: fullName
        });

      if (pError) {
        // ROLLBACK: Remove o usuário auth se o perfil falhar
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return ApiResponse.error(res, 'Erro ao criar perfil institucional: ' + pError.message, 400);
      }

      // 4. Marca convite como consumido
      await supabaseAdmin
        .from('invitations')
        .update({ used: true })
        .eq('id', invite.id);

      return ApiResponse.success(res, { 
        message: 'Cadastro realizado com sucesso!',
        userId: authUser.user.id
      }, 201);

    } catch (error: any) {
      return ApiResponse.error(res, 'Erro interno ao realizar cadastro.', 500, error);
    }
  }

  /**
   * Fluxo de registro para colaboradores operacionais (Líder, Portaria) ou empresas parceiras.
   * Exige identificação da Usina (via CNPJ ou Slug) para herança de contexto.
   */
  static async register(req: Request, res: Response): Promise<any> {
    try {
      const { fullName, email, password, role, sector, usinaCnpj } = req.body;
      const tenantSlug = req.header('X-Tenant-Slug');

      if (!fullName || !email || !password || !role) {
        return ApiResponse.error(res, 'Campos obrigatórios: nome, email, senha e função.', 400);
      }

      if (!usinaCnpj && !tenantSlug) {
        return ApiResponse.error(res, 'Falta de contexto: Informe o subdomínio ou CNPJ da usina.', 400);
      }

      // 1. Identificação da Unidade Industrial (Tenant)
      let query = supabaseAdmin.from('tenants').select('id');
      if (usinaCnpj) {
        query = query.eq('cnpj', usinaCnpj);
      } else {
        query = query.eq('subdomain', tenantSlug);
      }

      const { data: tenant, error: tError } = await query.maybeSingle();

      if (tError || !tenant) {
        return ApiResponse.error(res, 'Unidade não identificada ou rota inválida.', 400);
      }

      // 2. Provisionamento de Credenciais
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) {
        return ApiResponse.error(res, 'Erro ao criar conta auth: ' + authError.message, 400);
      }

      // 3. Provisionamento de Perfil e Papel (Role)
      const { error: pError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          tenant_id: tenant.id,
          role,
          sector,
          full_name: fullName
        });

      if (pError) {
        // ROLLBACK
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return ApiResponse.error(res, 'Erro ao criar perfil operacional: ' + pError.message, 400);
      }

      return ApiResponse.success(res, { 
        message: 'Cadastro operacional realizado com sucesso!',
        userId: authUser.user.id
      }, 201);

    } catch (error: any) {
      return ApiResponse.error(res, 'Erro interno ao realizar registro.', 500, error);
    }
  }
}
