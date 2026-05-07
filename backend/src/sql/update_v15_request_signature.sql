-- Adiciona coluna de assinatura na tabela de requisições
ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS signature TEXT;
