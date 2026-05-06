import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSubdomain, isAdminPath } from '../utils/subdomain';
import { tenantService } from '../features/auth/api/tenantService';

interface Tenant {
  id: string;
  name: string;
  cnpj: string;
  subdomain: string;
  logo_url?: string;
  company_color?: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  isSubdomain: boolean;
  slug: string | null;
  isAdmin: boolean;
}

const TenantContext = createContext<TenantContextType>({} as TenantContextType);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const slug = getSubdomain();
  const isAdmin = isAdminPath();
  const isSubdomain = !!slug && window.location.hostname.includes(slug);

  useEffect(() => {
    const fetchTenantData = async () => {
      if (!slug) {
        setTenant(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await tenantService.getTenantInfo(slug);
        setTenant(data);
      } catch (error) {
        console.error('Erro de conexão ao buscar usina:', error);
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, [slug, location.pathname]);

  // Inject dynamic styles based on tenant brand
  useEffect(() => {
    if (tenant?.company_color) {
      document.documentElement.style.setProperty('--primary-color', tenant.company_color);
      // Generate a slightly darker version for hover if possible, 
      // or just use the same with filter: brightness(0.9) in CSS
    } else {
      // Reset to default Lins Agro blue if no tenant color
      document.documentElement.style.removeProperty('--primary-color');
    }
  }, [tenant]);

  return (
    <TenantContext.Provider value={{ tenant, loading, isSubdomain, slug, isAdmin }}>

      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
