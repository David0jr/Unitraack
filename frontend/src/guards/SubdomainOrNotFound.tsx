import { Navigate } from "react-router-dom";
import { useTenant } from "../contexts/TenantContext";

interface Props {
  children: React.ReactNode;
}

export default function SubdomainOrNotFound({ children }: Props) {
  const { isSubdomain } = useTenant();

  // Se não estiver em um subdomínio de usina, redireciona diretamente para o login administrativo padrão
  if (!isSubdomain) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
