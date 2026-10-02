import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors, { CorsOptions } from 'cors';
import { Request, Response, NextFunction } from 'express';

/**
 * 1. Headers de Segurança HTTP (Helmet)
 * Configurado especificamente para API REST, garantindo proteção contra Clickjacking,
 * MIME Sniffing, XSS e forçando HSTS sem bloquear assets de fotos ou SVG.
 */
export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: false // Delegado para a camada de frontend/Cloudflare para não interferir em respostas JSON
});

/**
 * 2. Rate Limiting Multicamada
 * Limite confortável para operações da guarita/pátio, evitando falso-positivos em uso intenso.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 600, // 600 requisições por IP a cada 15 min (média de 40 req/min, perfeito para portaria)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Limite de requisições excedido. Por favor, aguarde alguns instantes antes de tentar novamente.'
  },
  skip: (req) => {
    // Não aplica rate limit em preflights OPTIONS, health check ou ambiente de teste automatizado
    return req.method === 'OPTIONS' || req.path === '/health' || process.env.NODE_ENV === 'test';
  }
});

/**
 * Rate Limiting estrito para endpoints de autenticação e registro (anti força-bruta)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 25, // Máximo 25 tentativas por IP a cada 15 min
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Muitas tentativas de autenticação ou cadastro. Aguarde 15 minutos para tentar novamente.'
  },
  skip: (req) => req.method === 'OPTIONS'
});

/**
 * 3. CORS Restritivo e Inteligente
 * Suporta perfeitamente:
 * - Deploy em produção na Vercel (*.vercel.app, unitraack.vercel.app)
 * - Deploy de API na Railway (*.up.railway.app)
 * - Domínios oficiais (*.unitraack.com e unitraack.com)
 * - Subdomínios locais em desenvolvimento (*.localhost, localhost:5173, etc.)
 * - Chamadas sem origin (mobile apps, Postman, health check)
 */
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

const isAllowedOrigin = (origin: string): boolean => {
  // 1. Localhost e loopback (qualquer porta ou subdomínio local)
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^http:\/\/([a-zA-Z0-9_-]+\.)?localhost(:\d+)?$/.test(origin)) return true;

  // 2. Deploy oficial e previews na Vercel (ex: unitraack.vercel.app)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$/.test(origin)) return true;

  // 3. Domínio oficial Unitraack e seus subdomínios (*.unitraack.com)
  if (/^https?:\/\/([a-zA-Z0-9_-]+\.)?unitraack\.com$/.test(origin)) return true;
  if (/^https?:\/\/unitraack\.com$/.test(origin)) return true;

  // 4. Domínios Railway
  if (/^https?:\/\/([a-zA-Z0-9_-]+\.)?up\.railway\.app$/.test(origin)) return true;
  if (/^https?:\/\/([a-zA-Z0-9_-]+\.)?railway\.app$/.test(origin)) return true;

  // 5. Whitelist explícita configurada via variável de ambiente
  if (allowedOriginsEnv.includes(origin)) return true;

  return false;
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Se não tiver origin (ex: Postman, mobile, curl, healthcheck) -> permite
    if (!origin) {
      return callback(null, true);
    }

    if (isAllowedOrigin(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Requisição bloqueada para a origem: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Tenant-Slug', 
    'Accept', 
    'Origin', 
    'X-Requested-With'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  optionsSuccessStatus: 204
};

/**
 * 4. Sanitização de Logs de Requisição
 * Impede que tokens, senhas ou dados sensíveis vazem nos logs do servidor.
 */
export const sanitizedRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Mascara tokens na URL se houver (ex: /invitation/xyz123)
  const safeUrl = req.originalUrl.replace(/\/invitation\/[a-zA-Z0-9-_]+/gi, '/invitation/***REDACTED***');

  res.on('finish', () => {
    const duration = Date.now() - start;
    // Log estruturado e seguro
    console.log(`[HTTP] ${req.method} ${safeUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
};
