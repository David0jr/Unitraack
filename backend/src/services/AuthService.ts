import { supabaseAdmin } from '../config/supabase';
import { Profile, UserRole } from '../types';

/**
 * Serviço responsável por operações de autenticação e gestão de usuários/perfis.
 * Centraliza a comunicação com o Supabase Auth Admin.
 */
export class AuthService {
  
  /**
   * Cria ou atualiza o perfil (Profile) de um usuário no banco de dados.
   * @param userId ID do usuário no Supabase Auth
   * @param data Dados do perfil (nome, cargo, etc)
   */
  async createUserProfile(userId: string, data: Partial<Profile>): Promise<void> {
    const { error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        ...data
      });

    if (error) throw error;
  }

  /**
   * Cria um novo usuário no Supabase Auth Admin API.
   * Útil para registros internos onde o operador cadastra outro usuário.
   * @param email Email do novo usuário
   * @param password Senha temporária
   * @param fullName Nome completo para os metadados
   */
  async createAuthUser(email: string, password: string, fullName: string) {
    const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (error) throw error;
    return authUser.user;
  }

  /**
   * Remove um usuário do Supabase Auth.
   * @param userId ID do usuário a ser excluído
   */
  async deleteAuthUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
  }

  /**
   * Valida um token de convite e retorna os dados vinculados (ex: Tenant).
   * @param token Token único do convite
   */
  async validateInvitation(token: string) {
    const { data, error } = await supabaseAdmin
      .from('invitations')
      .select('*, tenant:tenants(*)')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export const authService = new AuthService();
