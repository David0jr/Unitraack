import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

/**
 * Middleware global para captura de erros asíncronos e tratamento centralizado.
 * Evita a necessidade de múltiplos blocos try/catch em Controllers.
 */
export const errorMiddleware = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[API ERROR] ${req.method} ${req.url}:`, error);

  // Tratamento específico de erros comuns
  if (error.name === 'ValidationError') {
    return ApiResponse.error(res, 'Dados inválidos.', 400, error.details);
  }

  if (error.status === 401 || error.name === 'UnauthorizedError') {
    return ApiResponse.error(res, 'Sua sessão expirou ou você não tem permissão.', 401);
  }

  // Erro Genérico (Fallback)
  const message = error.message || 'Ocorreu um erro interno no servidor.';
  const status = error.status || 500;

  return ApiResponse.error(res, message, status, error);
};

/**
 * Wrapper para funções asíncronas para capturar erros automaticamente e passá-los para o next().
 */
export const asyncWrapper = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
