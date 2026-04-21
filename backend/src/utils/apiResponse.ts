import { Response } from 'express';

/**
 * Utilitário para padronização de respostas da API UsinaLins.
 * Segue o padrão { success: boolean, data?: any, error?: string }
 */
export class ApiResponse {
  /**
   * Envia uma resposta de sucesso formatteda.
   * @param res Objeto Response do Express
   * @param data Dados a serem enviados
   * @param status Código HTTP (default 200)
   */
  static success(res: Response, data: any, status = 200) {
    return res.status(status).json({
      success: true,
      data
    });
  }

  /**
   * Envia uma resposta de erro formatteda.
   * @param res Objeto Response do Express
   * @param message Mensagem de erro amigável
   * @param status Código HTTP (default 500)
   * @param details Detalhes técnicos opcionais (ex: stack trace em dev)
   */
  static error(res: Response, message: string, status = 500, details?: any) {
    return res.status(status).json({
      success: false,
      error: message,
      details: process.env.NODE_ENV === 'development' ? details : undefined
    });
  }
}
