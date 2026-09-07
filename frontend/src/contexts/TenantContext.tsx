import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSubdomain, isAdminPath } from '../utils/subdomain';
import { tenantService } from '../features/auth/api/tenantService';

export interface Tenant {
  id: string;
  name: string;
  cnpj: string;
  subdomain: string;
  logo_url?: string;
  company_color?: string;
  secondary_color?: string;
  tertiary_color?: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  isSubdomain: boolean;
  slug: string | null;
  isAdmin: boolean;
}

const TenantContext = createContext<TenantContextType>({} as TenantContextType);

const applyTenantColors = (tenant: Tenant | null) => {
  if (tenant?.company_color) {
    const primary = tenant.company_color;
    const secondary = tenant.secondary_color || '#1996DC';
    const tertiary = tenant.tertiary_color || '#001D4A';

    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    document.documentElement.style.setProperty('--navy-color', tertiary);
    document.documentElement.style.setProperty('--tertiary-color', tertiary);
    
    document.documentElement.style.setProperty('--color-primary', primary);
    document.documentElement.style.setProperty('--color-secondary', secondary);
    document.documentElement.style.setProperty('--color-navy', tertiary);
  } else {
    document.documentElement.style.removeProperty('--primary-color');
    document.documentElement.style.removeProperty('--secondary-color');
    document.documentElement.style.removeProperty('--navy-color');
    document.documentElement.style.removeProperty('--tertiary-color');
    document.documentElement.style.removeProperty('--color-primary');
    document.documentElement.style.removeProperty('--color-secondary');
    document.documentElement.style.removeProperty('--color-navy');
  }
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const slug = getSubdomain();
  const isAdmin = isAdminPath();
  const isSubdomain = !!slug && window.location.hostname.includes(slug);

  // Inicialização síncrona com cache para evitar "flash" de outra usina / cores antigas
  const [tenant, setTenant] = useState<Tenant | null>(() => {
    if (!slug) return null;
    try {
      const cached = sessionStorage.getItem(`tenant_cache_${slug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        applyTenantColors(parsed);
        return parsed;
      }
    } catch {
      // Ignora erro ao ler ou parsear o cache do sessionStorage
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (!slug) return false;
    try {
      const cached = sessionStorage.getItem(`tenant_cache_${slug}`);
      if (cached) return false;
    } catch {
      // Ignora erro ao acessar o sessionStorage
    }
    return true;
  });

  useEffect(() => {
    const fetchTenantData = async () => {
      if (!slug) {
        setTenant(null);
        setLoading(false);
        applyTenantColors(null);
        return;
      }

      try {
        // Se já tiver em cache, não bloqueia UI mas revalida silenciosamente
        const cached = sessionStorage.getItem(`tenant_cache_${slug}`);
        if (!cached) {
          setLoading(true);
        }

        const data = await tenantService.getTenantInfo(slug);
        if (data) {
          setTenant(data);
          applyTenantColors(data);
          sessionStorage.setItem(`tenant_cache_${slug}`, JSON.stringify(data));
        } else {
          setTenant(null);
          applyTenantColors(null);
          sessionStorage.removeItem(`tenant_cache_${slug}`);
        }
      } catch (error) {
        // Usina excluída ou não encontrada (404)
        setTenant(null);
        applyTenantColors(null);
        sessionStorage.removeItem(`tenant_cache_${slug}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, [slug, location.pathname]);

  // Efeito reativo caso tenant mude
  useEffect(() => {
    applyTenantColors(tenant);
  }, [tenant]);

  return (
    <TenantContext.Provider value={{ tenant, loading, isSubdomain, slug, isAdmin }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
