-- 1. ADICIONAR COLUNA CNPJ EM PROFILES (Se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='cnpj') THEN
        ALTER TABLE public.profiles ADD COLUMN cnpj VARCHAR(18);
    END IF;
END
$$;

-- 2. Garantir que as tabelas de tenants e profiles estão com RLS habilitado corretamente
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
