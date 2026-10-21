import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  RefreshCw,
  Hash,
  MapPin,
  AlertTriangle,
  Lock,
  User
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useDashboard } from '../../../../../contexts/DashboardContext';
import { Modal, CustomSelect, InputGroup } from './TeamCommon';

interface MemberListProps {
  tenantId: string;
}

function formatName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
    .join(' ');
}

export function MemberList({ tenantId }: MemberListProps) {
  const { token } = useAuth();
  const { sectors } = useDashboard();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'LIDER_SETOR' | 'PORTARIA'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
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

  // Filtragem dos membros
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = member.full_name?.toLowerCase().includes(query);
        const emailMatch = member.email?.toLowerCase().includes(query);
        const regMatch = member.registration_number?.toLowerCase().includes(query);
        const sectorMatch = member.sector?.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !regMatch && !sectorMatch) {
          return false;
        }
      }

      // Filtro de cargo
      if (roleFilter !== 'ALL' && member.role !== roleFilter) {
        return false;
      }

      // Filtro de status
      if (statusFilter === 'ACTIVE' && member.is_active === false) {
        return false;
      }
      if (statusFilter === 'INACTIVE' && member.is_active !== false) {
        return false;
      }

      return true;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-navy text-base">Membros da Equipe</h3>
          <p className="text-xs text-slate-500 font-normal">
            Gerencie permissões, redefina senhas e acompanhe o status operacional da equipe.
          </p>
        </div>
        <button 
          onClick={fetchMembers}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:text-navy transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : 'text-slate-400'}`} />
          <span>Atualizar Lista</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Input de busca */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar por nome, matrícula ou e-mail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
            />
          </div>

          {/* Filtro por Cargo */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-medium text-slate-500 shrink-0 mr-1">Cargo:</span>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'LIDER_SETOR', label: 'Líder de Setor' },
              { id: 'PORTARIA', label: 'Portaria' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  roleFilter === r.id
                    ? 'bg-navy text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Filtro por Status */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            <span className="text-[11px] font-medium text-slate-500 shrink-0 mr-1">Status:</span>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'ACTIVE', label: 'Ativos' },
              { id: 'INACTIVE', label: 'Inativos' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  statusFilter === s.id
                    ? 'bg-navy text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Membros */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Mostrando <strong className="text-slate-800">{filteredMembers.length}</strong> de <strong className="text-slate-800">{members.length}</strong> colaboradores</span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">Nenhum membro encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          filteredMembers.map((member: any) => {
            const isLeader = member.role === 'LIDER_SETOR';
            const isActive = member.is_active !== false;

            return (
              <div 
                key={member.id} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
                  !isActive 
                    ? 'bg-slate-50/60 border-slate-200/60 opacity-60' 
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Perfil e Detalhes */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-xs shadow-xs ${
                    !isActive 
                      ? 'bg-slate-400' 
                      : isLeader 
                        ? 'bg-amber-500' 
                        : 'bg-navy'
                  }`}>
                    {isLeader ? <HardHat className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy text-xs truncate">
                        {formatName(member.full_name)}
                      </span>
                      
                      {/* Badge Ativo/Inativo */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                      }`}>
                        {isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap text-slate-500 text-[11px]">
                      {/* Função */}
                      <span className="font-medium text-primary">
                        {isLeader ? 'Líder de Setor' : member.role === 'PORTARIA' ? 'Controle de Acesso' : member.role}
                      </span>

                      {/* Matrícula */}
                      {member.registration_number && (
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span>{member.registration_number}</span>
                        </span>
                      )}

                      {/* Setor */}
                      {member.sector && (
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{member.sector}</span>
                        </span>
                      )}

                      {/* Email */}
                      <span className="text-slate-400 truncate max-w-[200px]">
                        {member.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button 
                    onClick={() => setResettingPassword(member)}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Redefinir Senha"
                  >
                    <Key className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => setEditingMember(member)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                    title="Editar Cadastro"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => handleToggleStatus(member)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      !isActive 
                        ? 'text-emerald-500 hover:bg-emerald-50' 
                        : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                    title={!isActive ? 'Ativar Conta' : 'Desativar Conta'}
                  >
                    {!isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>

                  <button 
                    onClick={() => setDeletingMember(member)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Colaborador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Editar Membro */}
      <Modal 
        isOpen={!!editingMember} 
        onClose={() => setEditingMember(null)} 
        title="Editar Dados do Colaborador"
      >
        <form onSubmit={handleUpdateMember} className="space-y-5">
          <InputGroup 
            label="Nome Completo"
            value={editingMember?.full_name || ''}
            onChange={(val: string) => setEditingMember({...editingMember, full_name: val})}
          />

          <InputGroup 
            label="Número de Matrícula"
            value={editingMember?.registration_number || ''}
            onChange={(val: string) => setEditingMember({...editingMember, registration_number: val})}
            placeholder="Ex: 123456"
          />
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 ml-0.5 block">Função / Cargo</label>
            <CustomSelect
              value={editingMember?.role}
              onChange={(val: string) => setEditingMember({...editingMember, role: val})}
              options={[
                { type: 'option', value: 'LIDER_SETOR', label: 'Líder de Setor' },
                { type: 'option', value: 'PORTARIA', label: 'Controle de Acesso' }
              ]}
            />
          </div>

          {editingMember?.role === 'LIDER_SETOR' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 ml-0.5 block">Setor Responsável</label>
              <CustomSelect
                value={editingMember?.sector_id}
                onChange={(val: string) => {
                  const selected = sectors.find((s: any) => s.id === val);
                  setEditingMember({...editingMember, sector_id: val, sector: selected?.name || ''});
                }}
                options={[
                  { type: 'option', value: '', label: 'Nenhum setor selecionado' },
                  ...sectorOptions
                ]}
                direction="down"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={updating}
              className="px-5 py-2.5 bg-primary hover:bg-[#00928a] text-white rounded-xl font-medium text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Redefinir Senha */}
      <Modal 
        isOpen={!!resettingPassword} 
        onClose={() => { setResettingPassword(null); setNewPassword(''); }} 
        title="Redefinir Senha de Acesso"
      >
        <form onSubmit={handleResetPassword} className="space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Defina uma nova senha para <strong className="text-navy">{formatName(resettingPassword?.full_name)}</strong>. 
            O colaborador poderá utilizá-la imediatamente após a alteração.
          </p>
          
          <InputGroup 
            type="password"
            label="Nova Senha Provisória"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={setNewPassword}
          />

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => { setResettingPassword(null); setNewPassword(''); }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={updating || newPassword.length < 6}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar Senha'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal 
        isOpen={!!deletingMember} 
        onClose={() => setDeletingMember(null)} 
        title="Confirmar Exclusão"
      >
        <div className="space-y-5">
          <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-rose-800">Ação irreversível</p>
              <p className="text-xs text-rose-700 leading-relaxed font-normal">
                Você está prestes a excluir permanentemente <strong className="underline">{formatName(deletingMember?.full_name)}</strong>. Todos os acessos serão revogados imediatamente.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button 
              onClick={() => setDeletingMember(null)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={handleDeleteMember}
              disabled={updating}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
