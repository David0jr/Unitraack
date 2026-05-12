import { Link } from "react-router-dom";
import { useTenant } from "../contexts/TenantContext";

interface Props {
  children: React.ReactNode;
}

export default function SubdomainOrNotFound({ children }: Props) {
  const { isSubdomain } = useTenant();

  // No localhost, se não houver um slug no path (ex: /usina-lins/...),
  // esta rota genérica deve ser tratada como inexistente.
  if (!isSubdomain && window.location.hostname === "localhost") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-brand">
        <div className="w-16 h-1 bg-primary mb-6 rounded-full"></div>
        <h1 className="text-6xl font-black text-navy mb-2 tracking-tighter">
          404
        </h1>
        <p className="text-slate-500 text-center font-medium max-w-xs leading-relaxed">
          Esta rota requer um identificador de usina válido para carregar as
          configurações de segurança.
        </p>
        <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
          <Link
            to="/admin/login"
            className="w-full py-4 bg-navy text-white text-center rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-navy/20 hover:scale-[1.02] transition-all"
          >
            Acessar Portal Administrativo
          </Link>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Exemplo de uso:{" "}
            <span className="font-mono bg-slate-100 px-1 rounded">
              localhost:5173/lins/login
            </span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
