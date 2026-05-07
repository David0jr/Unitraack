
-- Adiciona a coluna signature na tabela material_movements
ALTER TABLE material_movements ADD COLUMN IF NOT EXISTS signature TEXT;

-- Comentário explicativo
COMMENT ON COLUMN material_movements.signature IS 'Assinatura digital (iniciais) de quem validou a movimentação';
