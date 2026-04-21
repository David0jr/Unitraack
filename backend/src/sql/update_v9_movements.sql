-- MUDANÇA PARA MONITORAMENTO OPERACIONAL (V9)

-- 1. ADICIONAR LOCALIZAÇÃO ATUAL NA TABELA DE MATERIAIS
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS current_sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL;

-- 2. CRIAR TABELA DE MOVIMENTAÇÕES
CREATE TABLE IF NOT EXISTS public.material_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    from_sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
    to_sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
    moved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HABILITAR RLS
ALTER TABLE public.material_movements ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS PARA MOVIMENTAÇÕES
DROP POLICY IF EXISTS "Gestores e Portaria podem ver movimentações" ON public.material_movements;
CREATE POLICY "Gestores e Portaria podem ver movimentações" 
ON public.material_movements FOR SELECT 
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 5. ATUALIZAR MATERIAIS EXISTENTES PARA TEREM O SETOR DA REQUISIÇÃO COMO SETOR ATUAL
UPDATE public.materials m
SET current_sector_id = r.sector_id
FROM public.entry_requests r
WHERE m.request_id = r.id AND m.current_sector_id IS NULL;
