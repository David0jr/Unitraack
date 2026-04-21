import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Importação do Supabase
import { supabaseAdmin } from './config/supabase';

import routes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3333;

app.use(cors({
  origin: '*', // Em prod, ideal restringir para seus domínios
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Multi-tenant: Identifica a usina via subdomínio
import { tenantContextMiddleware } from './middlewares/tenantMiddleware';
app.use(tenantContextMiddleware);

// Middleware de log de requisições
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Agrupador central de rotas da API
app.use('/api', routes);

// Middleware de tratamento de erros global
import { errorMiddleware } from './middlewares/errorMiddleware';
app.use(errorMiddleware);

// Rota raiz (Health Check)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'SaaS Portaria Backend is running.' });
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

app.listen(port, () => {
  console.log(`Backend Server running at http://localhost:${port}`);
});
