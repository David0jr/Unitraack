-- Criar tabela de Usinas (Tenants)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela Atrelada a auth.users do Supabase (para segurar o Tenant e o Role de cada um)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('LIDER_SETOR', 'GESTOR_SEGURANCA', 'PORTARIA', 'TERCEIRIZADA')),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas Iniciais RLS (Profiles)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Para gestores da mesma usina verem profiles da mesma usina:
DROP POLICY IF EXISTS "Users can view profiles in same tenant" ON public.profiles;
CREATE POLICY "Users can view profiles in same tenant" 
ON public.profiles FOR SELECT 
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
