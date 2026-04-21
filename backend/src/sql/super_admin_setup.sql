-- 1. ATUALIZAR ROLE PARA INCLUIR SUPER_ADMIN
-- Primeiro, removemos a constraint antiga
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Adicionamos a nova constraint com SUPER_ADMIN
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('LIDER_SETOR', 'GESTOR_SEGURANCA', 'PORTARIA', 'TERCEIRIZADA', 'SUPER_ADMIN'));

-- 2. AJUSTAR POLÍTICAS RLS PARA SUPER_ADMIN
-- Permitir que SUPER_ADMIN veja todos os perfis
DROP POLICY IF EXISTS "Super Admin vê tudo" ON public.profiles;
CREATE POLICY "Super Admin vê tudo" 
ON public.profiles FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- Permitir que SUPER_ADMIN gerencie todas as Usinas (Tenants)
DROP POLICY IF EXISTS "Super Admin gerencia tenants" ON public.tenants;
CREATE POLICY "Super Admin gerencia tenants" 
ON public.tenants FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- Permitir que SUPER_ADMIN veja todas as requisições (Global Oversight)
DROP POLICY IF EXISTS "Super Admin vê todas as requisições" ON public.entry_requests;
CREATE POLICY "Super Admin vê todas as requisições" 
ON public.entry_requests FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- 3. PROMOÇÃO DE USUÁRIO (Opcional - Exemplo de como promover)
-- UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE id = 'UUID_DO_DONO';
