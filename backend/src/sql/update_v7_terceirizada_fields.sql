-- 1. ADICIONAR COLUNAS representative_name E phone EM PROFILES (Se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='representative_name') THEN
        ALTER TABLE public.profiles ADD COLUMN representative_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone VARCHAR(20);
    END IF;
END
$$;
