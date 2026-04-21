-- 1. ADICIONAR COLUNA DE COR NO PERFIL (Se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='company_color') THEN
        ALTER TABLE public.profiles ADD COLUMN company_color VARCHAR(7);
    END IF;
END
$$;

-- 2. CRIAR TABELA DE REQUISIÇÕES
CREATE TABLE IF NOT EXISTS public.entry_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    sector VARCHAR(100) NOT NULL,
    entry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE MATERIAIS
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES public.entry_requests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HABILITAR RLS (Row Level Security) NAS NOVAS TABELAS
ALTER TABLE public.entry_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS BÁSICAS
-- Terceirizadas podem ver suas próprias requisições
DROP POLICY IF EXISTS "Terceirizada pode ver próprias requisições" ON public.entry_requests;
CREATE POLICY "Terceirizada pode ver próprias requisições" 
ON public.entry_requests FOR SELECT 
USING (profile_id = auth.uid());

-- Líderes e Portaria podem ver todas as requisições da sua usina (onde tenant_id for igual)
DROP POLICY IF EXISTS "Gestão pode ver requisições do seu tenant" ON public.entry_requests;
CREATE POLICY "Gestão pode ver requisições do seu tenant" 
ON public.entry_requests FOR SELECT 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('LIDER_SETOR', 'GESTOR_SEGURANCA', 'PORTARIA')
);

-- Todos os autenticados podem ver os materiais (A segurança é filtrada pelo request_id no App)
DROP POLICY IF EXISTS "Usuarios podem ver materiais" ON public.materials;
CREATE POLICY "Usuarios podem ver materiais" 
ON public.materials FOR SELECT 
USING (auth.role() = 'authenticated');
