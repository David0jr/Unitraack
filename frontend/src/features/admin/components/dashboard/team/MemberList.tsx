import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  HardHat, 
  Trash2,
  Pencil,
  Key,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useDashboard } from '../../../../../contexts/DashboardContext';
import { Modal, CustomSelect, InputGroup } from './TeamCommon';

interface MemberListProps {
  tenantId: string;
}

export function MemberList({ tenantId }: MemberListProps) {
  const { token } = useAuth();
  const { sectors } = useDashboard();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modais
  const [editingMember, setEditingMember] = useState<any>(null);
  const [resettingPassword, setResettingPassword] = useState<any>(null);
  const [deletingMember, setDeletingMember] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [tenantId]);

  const fetchMembers = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const resp = await axios.get(`${import.meta.env.VITE_API_URL}/gestor/team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.data.success) {
        setMembers(resp.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setUpdating(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/gestor/team/${editingMember.id}`, editingMember, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEditingMember(null);
      fetchMembers();
    } catch (err) {
      alert('Erro ao atualizar membro.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (member: any) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/gestor/team/${member.id}`, {
        ...member,
        is_active: !member.is_active
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchMembers();
    } catch (err) {
      alert('Erro ao alterar status.');
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setUpdating(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/gestor/team/${deletingMember.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDeletingMember(null);
      fetchMembers();
    } catch (err) {
      alert('Erro ao remover membro da equipe.');
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPassword || !newPassword) return;
    setUpdating(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/gestor/team/${resettingPassword.id}/reset-password`, {
        newPassword
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setResettingPassword(null);
      setNewPassword('');
      alert('Senha redefinida com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao redefinir senha.');
    } finally {
      setUpdating(false);
    }
  };

  const sectorOptions = sectors.filter((s: any) => !s.parent_id).map((parent: any) => ({
    type: 'group',
    label: parent.name,
    items: sectors.filter((s: any) => s.parent_id === parent.id).map((sub: any) => ({
      value: sub.id,
      label: sub.name
    }))
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-navy text-sm uppercase">Equipe de Operação ({members.length})</h4>
        <button onClick={fetchMembers} className="text-[10px] font-bold text-primary uppercase border-b border-primary/20 flex items-center gap-2">
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Atualizar
        </button>
      </div>

      <div className="grid gap-3">
        {members.length === 0 ? (
          <p className="text-center py-10 text-slate-400 italic text-xs">Nenhum membro administrativo cadastrado.</p>
        ) : members.map((member: any) => (
          <div key={member.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${member.is_active === false ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-slate-50/50 border-slate-100/50 hover:bg-white hover:shadow-sm'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-bold uppercase ${member.is_active === false ? 'bg-slate-300' : 'bg-navy'}`}>
                {member.role === 'LIDER_SETOR' ? <HardHat className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-navy text-xs uppercase">{member.full_name}</p>
                  {member.is_active === false && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded-md tracking-widest">Inativo</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                   <p className="text-[9px] text-primary font-bold uppercase tracking-widest">
                     {member.role === 'LIDER_SETOR' ? 'Líder de Setor' : 
                      member.role === 'PORTARIA' ? 'Segurança da Portaria' : 
                      member.role.replace('_', ' ')}
                   </p>
                   {member.sector && (
                     <>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase italic">{member.sector}</p>
                     </>
                   )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => setResettingPassword(member)}
                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                title="Resetar Senha"
              >
                <Key className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setEditingMember(member)}
                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                title="Editar Perfil"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleToggleStatus(member)}
                className={`p-2 rounded-lg transition-all ${member.is_active === false ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                title={member.is_active === false ? 'Ativar Conta' : 'Desativar Conta'}
              >
                {member.is_active === false ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setDeletingMember(member)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Excluir Membro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Editar Membro */}
      <Modal 
        isOpen={!!editingMember} 
        onClose={() => setEditingMember(null)} 
        title="Editar Colaborador"
      >
        <form onSubmit={handleUpdateMember} className="space-y-6">
          <InputGroup 
            label="Nome Completo"
            value={editingMember?.full_name || ''}
            onChange={(val: string) => setEditingMember({...editingMember, full_name: val})}
          />
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Função / Cargo</label>
            <CustomSelect
              value={editingMember?.role}
              onChange={(val: string) => setEditingMember({...editingMember, role: val})}
              options={[
                { type: 'option', value: 'LIDER_SETOR', label: 'Líder de Setor' },
                { type: 'option', value: 'PORTARIA', label: 'Segurança da Portaria' }
              ]}
            />
          </div>

          {editingMember?.role === 'LIDER_SETOR' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Setor Responsável</label>
              <CustomSelect
                value={editingMember?.sector_id}
                onChange={(val: string) => {
                  const selected = sectors.find((s: any) => s.id === val);
                  setEditingMember({...editingMember, sector_id: val, sector: selected?.name || ''})
                }}
                options={[
                  { type: 'option', value: '', label: 'Nenhum setor selecionado' },
                  ...sectorOptions
                ]}
                direction="up"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={updating}
            className="w-full py-4 bg-navy text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-navy/20 hover:bg-[#002880] transition-all disabled:opacity-50"
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar Alterações'}
          </button>
        </form>
      </Modal>

      {/* Modal Reset Senha */}
      <Modal 
        isOpen={!!resettingPassword} 
        onClose={() => { setResettingPassword(null); setNewPassword(''); }} 
        title="Redefinir Senha"
      >
        <form onSubmit={handleResetPassword} className="space-y-6">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Defina uma nova senha para <span className="font-bold text-navy">{resettingPassword?.full_name}</span>. 
            O colaborador poderá usá-la imediatamente após a alteração.
          </p>
          
          <InputGroup 
            type="password"
            label="Nova Senha"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={setNewPassword}
          />

          <button 
            type="submit"
            disabled={updating || newPassword.length < 6}
            className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50"
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Atualizar Senha'}
          </button>
        </form>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal 
        isOpen={!!deletingMember} 
        onClose={() => setDeletingMember(null)} 
        title="Excluir Colaborador"
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
            <Trash2 className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-700">Atenção!</p>
              <p className="text-xs text-red-600 leading-relaxed">
                Você está prestes a excluir permanentemente <span className="font-bold underline">{deletingMember?.full_name}</span>. 
                Esta ação não pode ser desfeita e todos os acessos deste usuário serão revogados imediatamente.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setDeletingMember(null)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleDeleteMember}
              disabled={updating}
              className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {updating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

