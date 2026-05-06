-- 1. ALTERAR TIPO DE entry_date PARA TIMESTAMP WITH TIME ZONE
-- Isso permite salvar a hora corretamente, não apenas a data.
ALTER TABLE public.entry_requests 
ALTER COLUMN entry_date TYPE TIMESTAMP WITH TIME ZONE 
USING entry_date::TIMESTAMP WITH TIME ZONE;

-- 2. ADICIONAR COLUNA DE LOGO EM PROFILES (Opcional, mas solicitado pelo usuário como "logo ali")
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 3. COMENTÁRIO DE AUDITORIA
COMMENT ON COLUMN public.entry_requests.entry_date IS 'Data e hora prevista para chegada na planta.';
