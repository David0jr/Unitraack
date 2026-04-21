-- Adicionar coluna de subdomínio na tabela de usinas (tenants)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subdomain VARCHAR(50) UNIQUE;

-- Criar índice para busca rápida por subdomínio
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);

-- Comentário: Essa coluna será usada para identificar a usina via Host Header (ex: usina1.sistema.com)
COMMENT ON COLUMN public.tenants.subdomain IS 'Slug identificador para acesso via subdomínio multi-tenant';
