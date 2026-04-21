-- 1. Remover a política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Users can view profiles in same tenant" ON public.profiles;

-- 2. Criar uma função auxiliar com SECURITY DEFINER
-- O "SECURITY DEFINER" faz a função rodar com privilégios de quem a criou (proprietário),
-- ignorando o RLS da própria tabela durante a subquery, o que quebra o loop infinito.
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Criar a nova política utilizando a função auxiliar
DROP POLICY IF EXISTS "Users can view profiles in same tenant" ON public.profiles;
CREATE POLICY "Users can view profiles in same tenant" 
ON public.profiles FOR SELECT 
USING (
  tenant_id = get_user_tenant_id()
);

-- 4. Garantir permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO service_role;
