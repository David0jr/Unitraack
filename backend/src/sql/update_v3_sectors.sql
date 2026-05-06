-- 1. ADICIONAR COLUNA DE SETOR NO PERFIL (Se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='sector') THEN
        ALTER TABLE public.profiles ADD COLUMN sector VARCHAR(100);
    END IF;
END
$$;

-- 2. ATUALIZAR POLÍTICAS RLS PARA ROTEAMENTO POR SETOR
-- O Líder agora só pode ver solicitações do SEU setor.
DROP POLICY IF EXISTS "Gestão pode ver requisições do seu tenant" ON public.entry_requests;
DROP POLICY IF EXISTS "Lider vê solicitações do seu setor" ON public.entry_requests;

CREATE POLICY "Lider vê solicitações do seu setor" 
ON public.entry_requests FOR SELECT 
USING (
  get_user_role() = 'LIDER_SETOR'
  AND sector = get_user_sector()
);

-- Gestor de Segurança e Portaria continuam vendo tudo da Usina (Tenant)
DROP POLICY IF EXISTS "Gestor e Portaria veem tudo da usina" ON public.entry_requests;
CREATE POLICY "Gestor e Portaria veem tudo da usina" 
ON public.entry_requests FOR SELECT 
USING (
  get_user_role() IN ('GESTOR_SEGURANCA', 'PORTARIA')
  AND tenant_id = get_user_tenant_id()
);
