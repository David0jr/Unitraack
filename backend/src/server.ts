import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Importação do Supabase
import { supabaseAdmin } from './config/supabase';

// Middlewares de Segurança Enterprise
import { 
  helmetMiddleware, 
  generalApiLimiter, 
  corsOptions, 
  sanitizedRequestLogger 
} from './middlewares/securityMiddleware';

import routes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3333;

// 1. CORS com suporte a Vercel, Railway, subdomínios dinâmicos e desenvolvimento
app.use(cors(corsOptions));

// 2. Headers de Segurança HTTP (Helmet: HSTS, Anti-Clickjacking, No-Sniff)
app.use(helmetMiddleware);

app.use(express.json({ limit: '50mb' }));

// 3. Multi-tenant: Identifica a usina via subdomínio
import { tenantContextMiddleware } from './middlewares/tenantMiddleware';
app.use(tenantContextMiddleware);

// 4. Middleware de log de requisições com sanitização de dados sensíveis
app.use(sanitizedRequestLogger);

// 5. Rate Limiting geral nas rotas da API (600 req / 15 min por IP)
app.use('/api', generalApiLimiter);

// Agrupador central de rotas da API
app.use('/api', routes);

// Middleware de tratamento de erros global
import { errorMiddleware } from './middlewares/errorMiddleware';
app.use(errorMiddleware);

// Rota padrão RFC 9116: Política de Divulgação de Vulnerabilidades (VDP)
const securityTxtContent = `Contact: mailto:seguranca@unitraack.com
Preferred-Languages: pt-BR, en
Canonical: https://unitraack.com/.well-known/security.txt
Policy: https://unitraack.com/politica-seguranca
Acknowledgments: https://unitraack.com/hall-da-fama
`;

app.get(['/.well-known/security.txt', '/security.txt'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(securityTxtContent);
});

// Verificação de Propriedade do Domínio para o Strix AI
app.get(['/.well-known/strix-verify.txt', '/strix-verify.txt'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send('strix-verify-ef928f31dfbe0f4bafb51faead47080a');
});

app.get('/api/security', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'Unitraack Security Center',
    contact: 'seguranca@unitraack.com',
    rfc: 'RFC 9116',
    active_defenses: ['Helmet', 'CORS-Restricted', 'Rate-Limiting', 'RLS-PostgreSQL', 'Tenant-Isolation']
  });
});

// Rota raiz (Health Check)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'SaaS Portaria Backend is running.',
    version: '1.2.0',
    timestamp: new Date().toISOString()
  });
});

// Debug: Listar todas as rotas registradas de forma segura no Express 5
app.get('/api/debug-routes', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.2.0',
    endpoints: [
      'GET /health',
      'GET /api/debug-routes',
      'GET /api/notifications',
      'PATCH /api/notifications/read-all',
      'DELETE /api/notifications/clear-all',
      'PATCH /api/notifications/:id/read',
      'POST /api/portaria/status/:id'
    ]
  });
});

// Tratamento de 404 (Rota não encontrada)
app.use((req: Request, res: Response) => {
  console.warn(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Rota não encontrada',
    method: req.method,
    url: req.originalUrl 
  });
});

// Manter o processo vivo (Keep-alive)
setInterval(() => {}, 1000 * 60 * 60);

try {
  app.listen(port, () => {
    console.log(`[Server] Backend Server running at http://localhost:${port}`);
    console.log('[Server] Auditoria Cross-Tenant: ATIVA');
  });
} catch (error) {
  console.error('[Server] Fatal error during listen:', error);
}

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});
