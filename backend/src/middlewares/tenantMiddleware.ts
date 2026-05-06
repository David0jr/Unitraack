import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { tenantService } from '../services/TenantService';
import { Tenant } from '../types';

export interface TenantRequest extends AuthRequest {
  tenantContext?: Tenant;
}

export const tenantContextMiddleware = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const host = req.headers.host || '';
    const headerSlug = req.headers['x-tenant-slug'];
    const querySlug = req.query.slug;
    
    console.log(`[TenantMiddleware] Raw values - host: ${host}, header: ${headerSlug}, query: ${querySlug}`);
    
    let slug: string | null = null;
    
    // 1. Prioridade para o cabeçalho X-Tenant-Slug
    if (typeof headerSlug === 'string') {
      slug = headerSlug;
    } 
    // 2. Fallback para query parameter
    else if (typeof querySlug === 'string') {
      slug = querySlug;
    }
    // 3. Fallback para subdomínio no Host
    else if (host) {
      if (host.includes('.localhost')) {
        // Ex: usina-lins.localhost:3333 -> usina-lins
        slug = host.split('.localhost')[0];
      } else if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
        // Ex: usina-lins.sistema.com -> usina-lins
        const parts = host.split('.');
        if (parts.length > 2) {
          slug = parts[0];
        }
      }
    }

    if (slug && slug !== 'www' && slug !== 'admin' && slug !== 'localhost') {
      console.log(`[TenantMiddleware] Resolved slug: "${slug}"`);
      const tenant = await tenantService.findBySubdomain(slug);
      
      if (tenant) {
        console.log(`[TenantMiddleware] Tenant found: ${tenant.name} (${tenant.id})`);
        req.tenantContext = tenant;
      } else {
        console.warn(`[TenantMiddleware] No tenant found for slug: "${slug}"`);
      }
    }

    next();
  } catch (error) {
    console.error('[TenantMiddleware] Critical Error:', error);
    next(); // Continua para não travar a aplicação, o controller deve tratar a falta de contexto se necessário
  }
};
