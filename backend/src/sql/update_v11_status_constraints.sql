-- Atualizar restrição de status para incluir aprovado por líder e gestor
ALTER TABLE public.entry_requests DROP CONSTRAINT IF EXISTS entry_requests_status_check;

ALTER TABLE public.entry_requests ADD CONSTRAINT entry_requests_status_check 
CHECK (status IN (
    'PENDING', 
    'APPROVED', 
    'REJECTED', 
    'APPROVED_LIDER', 
    'REJECTED_LIDER', 
    'APPROVED_GESTOR', 
    'REJECTED_GESTOR', 
    'IN_PLANTA', 
    'COMPLETED', 
    'CANCELED'
));
