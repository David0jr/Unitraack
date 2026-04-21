-- 1. Remover constraint antiga de status para permitir novos valores
ALTER TABLE public.entry_requests DROP CONSTRAINT IF EXISTS entry_requests_status_check;

-- 2. Adicionar nova constraint com os status atualizados
ALTER TABLE public.entry_requests ADD CONSTRAINT entry_requests_status_check 
CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'IN_PLANTA', 'COMPLETED'));

-- 3. Adicionar colunas de auditoria para a portaria
ALTER TABLE public.entry_requests ADD COLUMN IF NOT EXISTS gate_checked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.entry_requests ADD COLUMN IF NOT EXISTS gate_checked_by UUID REFERENCES auth.users(id);

-- 4. Unificar: Se existir a tabela 'requisitions' (de testes anteriores), deletar para evitar confusão
-- DROP TABLE IF EXISTS public.requisitions CASCADE; 
-- (Comentado por segurança, mas o projeto usará entry_requests)
