-- MUDANÇA PARA MAPA INTERATIVO (V10)

-- 1. ADICIONAR COORDENADAS ESPACIAIS AOS SETORES
ALTER TABLE public.sectors 
ADD COLUMN IF NOT EXISTS layout_x INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS layout_y INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS layout_w INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS layout_h INTEGER DEFAULT 150;

-- 2. ADICIONAR COORDENADAS AOS MATERIAIS
-- Estas coordenadas são relativas à "casa" (setor) ou ao mapa geral
ALTER TABLE public.materials
ADD COLUMN IF NOT EXISTS layout_x INTEGER,
ADD COLUMN IF NOT EXISTS layout_y INTEGER;


-- 3. CRIAR TABELA DE CORES PARA TERCEIRIZADAS (Opcional, mas ajuda a manter consistência)
-- Para simplificar, poderíamos apenas usar uma função no frontend, 
-- mas se quisermos permanência:
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20) DEFAULT '#0032A0';

-- 4. ATUALIZAR RLs SE NECESSÁRIO (Materiais e Setores já possuem RLS)
