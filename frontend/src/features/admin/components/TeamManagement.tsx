import React, { useState } from 'react';
import { 
  AlertCircle,
  CheckCircle2, 
} from 'lucide-react';
import { ManualRegisterForm } from './dashboard/team/ManualRegisterForm';
import { InviteGenerator } from './dashboard/team/InviteGenerator';
import { MemberList } from './dashboard/team/MemberList';
import { SectorManagement } from './dashboard/team/SectorManagement';

interface TeamManagementProps {
  tenantId: string;
  usinaCnpj: string;
  activeTab?: 'register' | 'invite' | 'list' | 'sectors';
  onTabChange?: (tab: 'register' | 'invite' | 'list' | 'sectors') => void;
}

export default function TeamManagement({ 
  tenantId, 
  usinaCnpj,
  activeTab = 'register'
}: TeamManagementProps) {
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
    <div className="space-y-6">
      {/* Alertas de Sucesso / Erro */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200/70 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/70 rounded-xl text-emerald-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Conteúdo da Seção Selecionada no Menu Lateral */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 lg:p-8 animate-in fade-in duration-200">
        {activeTab === 'register' && (
          <ManualRegisterForm 
            tenantId={tenantId} 
            usinaCnpj={usinaCnpj} 
            onSuccess={handleSuccess} 
            onError={handleError} 
          />
        )}
        {activeTab === 'invite' && (
          <InviteGenerator 
            tenantId={tenantId} 
            usinaCnpj={usinaCnpj} 
          />
        )}
        {activeTab === 'list' && (
          <MemberList 
            tenantId={tenantId} 
          />
        )}
        {activeTab === 'sectors' && (
          <SectorManagement 
            onSuccess={handleSuccess} 
            onError={handleError} 
          />
        )}
      </div>
    </div>
  );
}
