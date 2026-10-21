-- update_v18_active_status.sql
-- Garante a coluna active em tenants e is_active em profiles com default true

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'tenants' 
          AND column_name = 'active'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END
$$;

UPDATE public.tenants SET active = true WHERE active IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END
$$;

UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
