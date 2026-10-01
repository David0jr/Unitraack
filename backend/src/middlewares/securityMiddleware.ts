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
    // Não aplica rate limit em health check ou ambiente de teste automatizado
    return req.path === '/health' || process.env.NODE_ENV === 'test';
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
  }
});

/**
 * 3. CORS Restritivo e Inteligente
 * Suporta perfeitamente:
 * - Subdomínios locais em desenvolvimento (*.localhost, localhost:5173, etc.)
 * - Subdomínios de produção (*.unitraack.com)
 * - Chamadas sem origin (mobile apps, Postman, health check)
 */
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Se não tiver origin (ex: Postman, mobile, curl, healthcheck) -> permite
    if (!origin) {
      return callback(null, true);
    }

    const isLocalhost = 
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      /^http:\/\/([a-zA-Z0-9_-]+\.)?localhost(:\d+)?$/.test(origin);

    const isUnitraackDomain = 
      /^https:\/\/([a-zA-Z0-9_-]+\.)?unitraack\.com$/.test(origin) ||
      origin === 'https://unitraack.com';

    const isExplicitlyAllowed = allowedOriginsEnv.includes(origin);

    if (isLocalhost || isUnitraackDomain || isExplicitlyAllowed || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Requisição bloqueada para a origem: ${origin}`);
    return callback(new Error('Origem não permitida pela política de segurança CORS.'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
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
