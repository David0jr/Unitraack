-- Adiciona status e timestamps de movimentação nos materiais
ALTER TABLE materials ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE materials ADD COLUMN IF NOT EXISTS entry_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS exit_at TIMESTAMP WITH TIME ZONE;

-- Atualiza materiais existentes para IN_PLANTA se a requisição já estiver IN_PLANTA ou COMPLETED
UPDATE materials 
SET status = 'IN_PLANTA' 
FROM entry_requests 
WHERE materials.request_id = entry_requests.id 
AND entry_requests.status IN ('IN_PLANTA', 'COMPLETED');

-- Atualiza para OUT_PLANTA se já estiver COMPLETED
UPDATE materials 
SET status = 'OUT_PLANTA' 
FROM entry_requests 
WHERE materials.request_id = entry_requests.id 
AND entry_requests.status = 'COMPLETED';
