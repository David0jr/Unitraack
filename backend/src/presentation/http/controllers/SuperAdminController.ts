import { Response } from 'express';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { tenantService } from '../../../services/TenantService';
import { userService } from '../../../services/UserService';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../../config/supabase';

export class SuperAdminController {

  static async listTenants(req: AuthRequest, res: Response): Promise<any> {
    try {
      const tenants = await tenantService.listAll();
      res.json(tenants);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao listar usinas.' });
    }
  }

  static async createTenantAndGenerateInvite(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { tenantName, tenantCnpj } = req.body;

      if (!tenantName || !tenantCnpj) {
        res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' });
        return;
      }

      const tenant = await tenantService.create(tenantName, tenantCnpj);
      const token = uuidv4();
      const { error: iError } = await supabaseAdmin
        .from('invitations')
        .insert({
          tenant_id: tenant.id,
          token: token,
          role: 'GESTOR_SEGURANCA'
        });

      if (iError) {
        res.status(400).json({ error: 'Erro ao gerar convite: ' + iError.message });
        return;
      }

      res.status(201).json({ 
        message: 'Usina criada e convite gerado!',
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        inviteToken: token
      });

    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Erro interno ao criar Usina.' });
    }
  }

  static async generateInvite(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { tenantId } = req.body;
      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID é obrigatório.' });
        return;
      }

      const token = uuidv4();
      const { error } = await supabaseAdmin
        .from('invitations')
        .insert({
          tenant_id: tenantId,
          token: token,
          role: 'GESTOR_SEGURANCA'
        });

      if (error) throw error;
      res.json({ inviteToken: token });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao gerar convite.' });
    }
  }

  static async updateTenant(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { name, cnpj, logo_url, company_color } = req.body;

      if (!name || !cnpj) {
        res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' });
        return;
      }

      const data = await tenantService.update(id as string, { name, cnpj, logo_url, company_color });
      res.json({ message: 'Usina atualizada com sucesso!', tenant: data });

    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao atualizar usina.' });
    }
  }

  static async deleteTenant(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      await tenantService.delete(id as string);
      res.json({ message: 'Usina excluída com sucesso!' });
    } catch (error: any) {
      console.error(error);
      if (error.code === '23503') {
        res.status(400).json({ error: 'Não é possível excluir uma usina que possui usuários vinculados.' });
      } else {
        res.status(500).json({ error: 'Erro ao excluir usina.' });
      }
    }
  }

  static async listAllUsers(req: AuthRequest, res: Response): Promise<any> {
    try {
      const users = await userService.listAllProfiles();
      res.json(users);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao listar usuários globais.' });
    }
  }

  static async getPlatformStats(req: AuthRequest, res: Response): Promise<any> {
    try {
      const stats = await userService.getCounts();
      res.json(stats);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
    }
  }
}
