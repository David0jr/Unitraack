import { supabaseAdmin } from '../config/supabase';
import { Profile } from '../types';

export class UserService {
  
  async listAllProfiles(): Promise<Profile[]> {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        tenant:tenants(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return users as Profile[];
  }

  async findProfileById(userId: string): Promise<Profile | null> {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*, tenant:tenants(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return profile as Profile;
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<void> {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) {
      console.error('[UserService] Erro ao atualizar perfil:', error.message, error.details);
      throw error;
    }
  }

  async listTeamMembers(tenantId: string): Promise<Profile[]> {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('role', ['LIDER_SETOR', 'PORTARIA'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return users as Profile[];
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password
    });

    if (error) throw error;
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
  }

  async getCounts() {
    const { count: tenantCount } = await supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    const { count: requestCount } = await supabaseAdmin.from('entry_requests').select('*', { count: 'exact', head: true });

    return {
      totalTenants: tenantCount || 0,
      totalUsers: userCount || 0,
      totalRequests: requestCount || 0
    };
  }
}

export const userService = new UserService();
