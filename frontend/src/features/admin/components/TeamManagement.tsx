import { useState } from 'react';
import { 
  UserPlus, 
  Link as LinkIcon, 
  Users, 
  LayoutGrid,
  AlertTriangle,
  Check, 
} from 'lucide-react';
import { TabButton } from './dashboard/team/TeamCommon';
import { ManualRegisterForm } from './dashboard/team/ManualRegisterForm';
import { InviteGenerator } from './dashboard/team/InviteGenerator';
import { MemberList } from './dashboard/team/MemberList';
import { SectorManagement } from './dashboard/team/SectorManagement';

export default function TeamManagement({ tenantId, usinaCnpj }: { tenantId: string, usinaCnpj: string }) {
  const [activeTab, setActiveTab] = useState<'register' | 'invite' | 'list' | 'sectors'>('register');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleError = (msg: string) => {
    setError(msg);
    setSuccess('');
    setTimeout(() => setError(''), 5000);
  };

  const handleSuccess = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 5000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[500px]">
      {/* Tabs Header */}
      <div className="flex bg-slate-50 p-1 rounded-t-3xl overflow-x-auto scrollbar-hide">
        <TabButton 
          active={activeTab === 'register'} 
          onClick={() => setActiveTab('register')}
          icon={<UserPlus className="w-4 h-4" />}
          label="Registro Manual"
        />
        <TabButton 
          active={activeTab === 'invite'} 
          onClick={() => setActiveTab('invite')}
          icon={<LinkIcon className="w-4 h-4" />}
          label="Link de Convite"
        />
        <TabButton 
          active={activeTab === 'list'} 
          onClick={() => setActiveTab('list')}
          icon={<Users className="w-4 h-4" />}
          label="Membros da Equipe"
        />
        <TabButton 
          active={activeTab === 'sectors'} 
          onClick={() => setActiveTab('sectors')}
          icon={<LayoutGrid className="w-4 h-4" />}
          label="Setores"
        />
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
            <Check className="w-4 h-4" /> {success}
          </div>
        )}

        {activeTab === 'register' && <ManualRegisterForm usinaCnpj={usinaCnpj} onSuccess={handleSuccess} onError={handleError} />}
        {activeTab === 'invite' && <InviteGenerator usinaCnpj={usinaCnpj} />}
        {activeTab === 'list' && <MemberList tenantId={tenantId} />}
        {activeTab === 'sectors' && <SectorManagement onSuccess={handleSuccess} onError={handleError} />}
      </div>
    </div>
  );
}

