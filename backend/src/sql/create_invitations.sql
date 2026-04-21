-- Tabela de Convites para Gestores
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'GESTOR_SEGURANCA' NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Apenas Super Admins podem criar e visualizar convites
DROP POLICY IF EXISTS "Super Admins can manage invitations" ON public.invitations;
CREATE POLICY "Super Admins can manage invitations" 
ON public.invitations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  )
);

-- Permissão pública para visualizar um convite via token (para o registro)
DROP POLICY IF EXISTS "Public can view invitation by token" ON public.invitations;
CREATE POLICY "Public can view invitation by token" 
ON public.invitations FOR SELECT 
USING (NOT used);
