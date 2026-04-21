-- Criar tabela de setores se não existir
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Habilitar RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Política: Gestores e Portaria podem ver setores da sua usina
DROP POLICY IF EXISTS "Gestores e Portaria veem setores da usina" ON public.sectors;
CREATE POLICY "Gestores e Portaria veem setores da usina" 
ON public.sectors FOR SELECT 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('GESTOR_SEGURANCA', 'PORTARIA')
);

-- Política: Gestores podem inserir setores na sua usina
DROP POLICY IF EXISTS "Gestores podem inserir setores" ON public.sectors;
CREATE POLICY "Gestores podem inserir setores" 
ON public.sectors FOR INSERT 
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'GESTOR_SEGURANCA'
);

-- Política: Gestores podem deletar setores na sua usina
DROP POLICY IF EXISTS "Gestores podem deletar setores" ON public.sectors;
CREATE POLICY "Gestores podem deletar setores" 
ON public.sectors FOR DELETE 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'GESTOR_SEGURANCA'
);
