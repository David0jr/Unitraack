import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { tenantService } from '../services/TenantService';
import { userService } from '../services/UserService';
import { authService } from '../services/AuthService';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase'; // Mantido apenas para lógica específica de convite se não houver no service

export class SuperAdminController {

  // Listar todas as Usinas (Tenants)
  static async listTenants(req: AuthRequest, res: Response): Promise<any> {
    try {
      const tenants = await tenantService.listAll();
      res.json(tenants);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao listar usinas.' });
    }
  }

  // Criar uma nova Usina e gerar link de convite para o Gestor
  static async createTenantAndGenerateInvite(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { tenantName, tenantCnpj } = req.body;

      if (!tenantName || !tenantCnpj) {
        res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' });
        return;
      }

      // 1. Criar o Tenant via Service
      const tenant = await tenantService.create(tenantName, tenantCnpj);

      // 2. Gerar Token de Convite
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

  // Gerar um novo convite para uma usina existente
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

  // Atualizar informações de uma Usina
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

  // Excluir uma Usina
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

  // Listar todos os usuários da plataforma (Global)
  static async listAllUsers(req: AuthRequest, res: Response): Promise<any> {
    try {
      const users = await userService.listAllProfiles();
      res.json(users);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao listar usuários globais.' });
    }
  }

  // Estatísticas da Plataforma
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
