import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

const ROLE_MAP: Record<string, string> = {
  'GESTOR_SEGURANCA': 'Gestor de Segurança',
  'LIDER_SETOR': 'Líder de Setor',
  'PORTARIA': 'Agente de Portaria',
  'SUPER_ADMIN': 'Administrador Geral'
};

export const AdminSidebar: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [directors, setDirectors] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDirectors() {
      if (!tenantId) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('tenant_id', tenantId)
        .in('role', ['GESTOR_SEGURANCA', 'SUPER_ADMIN', 'DIRETOR'])
        .limit(5);
      
      if (data) setDirectors(data);
    }
    fetchDirectors();
  }, [tenantId]);

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-black text-navy text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Diretores de Unidade
          </h3>
          <div className="space-y-4">
            {directors.length > 0 ? (
              directors.map((director, idx) => (
                <UserRoleItem 
                  key={idx} 
                  name={director.full_name} 
                  role={ROLE_MAP[director.role] || director.role} 
                  online={idx === 0}
                />
              ))
            ) : (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4 border border-dashed border-slate-100 rounded-2xl">
                Nenhum gestor adicional logado
              </p>
            )}
          </div>
       </div>

       <div className="bg-navy rounded-3xl p-6 text-white shadow-2xl shadow-navy/20 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
          <h3 className="font-black text-[10px] uppercase tracking-widest mb-4 opacity-50">Logística de Segurança</h3>
          <p className="text-xs font-medium leading-relaxed mb-6">
            Todas as decisões manuais do Gestor ignorarão as regras de setor e permitirão acesso imediato.
          </p>
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-center">
            Uso Exclusivo Plano B
          </div>
       </div>
    </div>
  );
};

function UserRoleItem({ name, role, online }: { name: string, role: string, online: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300">
           {online && <div className="w-full h-full bg-emerald-500 rounded-full animate-ping"></div>}
        </div>
        <div>
           <p className="text-[11px] font-black text-navy uppercase leading-none">{name}</p>
           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{role}</p>
        </div>
      </div>
    </div>
  );
}

