import { useState, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { 
  ShieldCheck, 
  HardHat, 
  Trash2,
} from 'lucide-react';

interface MemberListProps {
  tenantId: string;
}

export function MemberList({ tenantId }: MemberListProps) {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchMembers();
  }, [tenantId]);

  const fetchMembers = async () => {
    if (!tenantId) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('role', ['LIDER_SETOR', 'PORTARIA'])
        .order('created_at', { ascending: false });

      if (data) setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-navy text-sm uppercase">Equipe de Operação ({members.length})</h4>
        <button onClick={fetchMembers} className="text-[10px] font-bold text-primary uppercase border-b border-primary/20">Atualizar</button>
      </div>

      <div className="grid gap-3">
        {members.length === 0 ? (
          <p className="text-center py-10 text-slate-400 italic text-xs">Nenhum membro administrativo cadastrado.</p>
        ) : members.map((member: any) => (
          <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white text-[10px] font-bold uppercase">
                {member.role === 'LIDER_SETOR' ? <HardHat className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-navy text-xs uppercase">{member.full_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                   <p className="text-[9px] text-primary font-bold uppercase tracking-widest">{member.role.replace('_', ' ')}</p>
                   {member.sector && (
                     <>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase italic">{member.sector}</p>
                     </>
                   )}
                </div>
              </div>
            </div>
            {/* TODO: Implement delete member functionality if needed */}
            <button className="p-2.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
               <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

