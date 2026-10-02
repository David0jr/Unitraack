import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Estende o Request do Express para comportar os dados do usuário e perfil
export interface AuthRequest extends Request {
  user?: any;
  userProfile?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Nenhum token fornecido.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Valida o JWT emitido pelo Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('Sessão Supabase inválida:', error?.message);
      res.status(401).json({ error: 'Token inválido ou expirado.' });
      return;
    }

    // Passa o usuário decodificado para as próximas funções do MVC
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Erro interno de autenticação.' });
  }
};

// Middleware para validar se o usuário é SUPER_ADMIN
export const requireSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
      return;
    }

    if (profile.is_active === false) {
      res.status(403).json({ error: 'Conta de usuário desativada.' });
      return;
    }

    req.userProfile = profile;
    next();
  } catch (error) {
    console.error('SuperAdmin Middleware Error:', error);
    res.status(500).json({ error: 'Erro ao validar privilégios de Super Admin.' });
  }
};

// Middleware para validar papéis específicos (RBAC Granular)
export const requireRole = (...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
      }

      // Se o perfil ainda não estiver em cache na requisição, busca no banco
      if (!req.userProfile) {
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('id, role, full_name, tenant_id, sector, sector_id, is_active')
          .eq('id', req.user.id)
          .single();

        if (error || !profile) {
          res.status(403).json({ error: 'Perfil de usuário não encontrado.' });
          return;
        }

        if (profile.is_active === false) {
          res.status(403).json({ error: 'Conta de usuário desativada.' });
          return;
        }

        req.userProfile = profile;
      }

      // Super Admin possui acesso de manutenção global
      if (req.userProfile.role === 'SUPER_ADMIN') {
        next();
        return;
      }

      if (!allowedRoles.includes(req.userProfile.role)) {
        res.status(403).json({ 
          error: `Acesso negado. Esta rota é restrita aos perfis: ${allowedRoles.join(', ')}.` 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('[requireRole] Erro:', error);
      res.status(500).json({ error: 'Erro ao validar privilégios de acesso.' });
    }
  };
};
