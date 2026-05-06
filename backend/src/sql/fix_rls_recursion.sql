-- 1. Remover a política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Users can view profiles in same tenant" ON public.profiles;

-- 2. Criar uma função auxiliar com SECURITY DEFINER
-- O "SECURITY DEFINER" faz a função rodar com privilégios de quem a criou (proprietário),
-- ignorando o RLS da própria tabela durante a subquery, o que quebra o loop infinito.
-- 2. Criar uma função auxiliar com SECURITY DEFINER
-- IMPORTANTE: Definir o search_path é uma boa prática de segurança.
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
DECLARE
  tid UUID;
BEGIN
  -- Buscamos o tenant_id diretamente. Sendo SECURITY DEFINER, esta consulta
  -- NÃO dispara as políticas de RLS da própria tabela profiles.
  SELECT tenant_id INTO tid FROM public.profiles WHERE id = auth.uid();
  RETURN tid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Novo: Função para buscar a role sem causar recursão
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
DECLARE
  r VARCHAR;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id = auth.uid();
  RETURN r;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Novo: Função para buscar o setor sem causar recursão
CREATE OR REPLACE FUNCTION get_user_sector()
RETURNS VARCHAR AS $$
DECLARE
  s VARCHAR;
BEGIN
  SELECT sector INTO s FROM public.profiles WHERE id = auth.uid();
  RETURN s;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Novo: Função para buscar o UUID do setor sem causar recursão
CREATE OR REPLACE FUNCTION get_user_sector_id()
RETURNS UUID AS $$
DECLARE
  sid UUID;
BEGIN
  SELECT sector_id INTO sid FROM public.profiles WHERE id = auth.uid();
  RETURN sid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Criar a nova política utilizando a função auxiliar
DROP POLICY IF EXISTS "Users can view profiles in same tenant" ON public.profiles;
CREATE POLICY "Users can view profiles in same tenant" 
ON public.profiles FOR SELECT 
USING (
  tenant_id = get_user_tenant_id()
);

-- Política para o próprio usuário sempre ver seu perfil (base para as outras)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 4. Garantir permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_sector() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sector() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_sector_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sector_id() TO service_role;
