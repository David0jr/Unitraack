import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Estende o Request do Express para comportar os dados do usuário
export interface AuthRequest extends Request {
  user?: any;
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
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
      return;
    }

    next();
  } catch (error) {
    console.error('SuperAdmin Middleware Error:', error);
    res.status(500).json({ error: 'Erro ao validar privilégios de Super Admin.' });
  }
};
