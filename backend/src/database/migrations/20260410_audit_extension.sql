-- Adicionar campos para auditoria e checkout
ALTER TABLE public.entry_requests 
ADD COLUMN IF NOT EXISTS exit_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_out_by UUID REFERENCES public.profiles(id);

-- Comentário para documentação
COMMENT ON COLUMN public.entry_requests.exit_at IS 'Data e hora da saída definitiva da usina';
COMMENT ON COLUMN public.entry_requests.check_out_by IS 'Perfil que realizou o check-out do terceiro';
