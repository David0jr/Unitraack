-- Adiciona a coluna registration_number na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.registration_number IS 'Número de matrícula do funcionário (Gestor, Líder, Segurança)';
