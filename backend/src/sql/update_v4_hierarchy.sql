-- MUDANÇA PARA HIERARQUIA DE SETORES (V4)

-- 1. ADICIONAR COLUNA PARENT_ID NA TABELA DE SETORES
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE;

-- 2. AJUSTAR ÍNDICE DE UNICIDADE
-- Remove o índice antigo se existir
ALTER TABLE public.sectors DROP CONSTRAINT IF EXISTS sectors_tenant_id_name_key;

-- Criar índices que suportam parent_id NULL (setores pai) e parent_id NOT NULL (subsetores)
DROP INDEX IF EXISTS sectors_tenant_name_parent_null_idx;
CREATE UNIQUE INDEX sectors_tenant_name_parent_null_idx ON public.sectors (tenant_id, name) WHERE parent_id IS NULL;

DROP INDEX IF EXISTS sectors_tenant_parent_name_idx;
CREATE UNIQUE INDEX sectors_tenant_parent_name_idx ON public.sectors (tenant_id, parent_id, name) WHERE parent_id IS NOT NULL;


-- 3. ADICIONAR SECTOR_ID NOS PERFIS E REQUISIÇÕES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL;
ALTER TABLE public.entry_requests ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL;

-- 4. ATUALIZAR POLÍTICAS RLS (ENTRY_REQUESTS)
-- O Líder agora vê solicitações baseadas no sector_id
DROP POLICY IF EXISTS "Lider vê solicitações do seu setor" ON public.entry_requests;
CREATE POLICY "Lider vê solicitações do seu setor" 
ON public.entry_requests FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'LIDER_SETOR'
  AND (
    sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
    OR 
    sector = (SELECT sector FROM public.profiles WHERE id = auth.uid()) -- Retrocompatibilidade
  )
);
