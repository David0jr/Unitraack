-- 1. ADICIONAR COLUNAS DE DETALHE PARA MATERIAIS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='materials' AND column_name='brand') THEN
        ALTER TABLE public.materials ADD COLUMN brand VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='materials' AND column_name='model') THEN
        ALTER TABLE public.materials ADD COLUMN model VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='materials' AND column_name='serial_number') THEN
        ALTER TABLE public.materials ADD COLUMN serial_number VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='materials' AND column_name='description') THEN
        ALTER TABLE public.materials ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='materials' AND column_name='condition') THEN
        ALTER TABLE public.materials ADD COLUMN condition VARCHAR(50) DEFAULT 'USADO';
    END IF;
END
$$;
