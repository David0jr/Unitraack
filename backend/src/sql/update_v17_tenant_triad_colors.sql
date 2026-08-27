-- Adiciona colunas para a tríade de cores da identidade visual da usina
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(20);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS tertiary_color VARCHAR(20);

COMMENT ON COLUMN public.tenants.company_color IS 'Cor Primária (Destaques, botões e ações)';
COMMENT ON COLUMN public.tenants.secondary_color IS 'Cor Secundária (Acentos, gradientes e badges)';
COMMENT ON COLUMN public.tenants.tertiary_color IS 'Cor Terciária/Base (Fundo escuro, hero e contraste)';
