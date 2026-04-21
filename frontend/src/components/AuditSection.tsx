import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuditThirdPartyList } from './dashboard/audit/AuditThirdPartyList';
import { AuditTimeline } from './dashboard/audit/AuditTimeline';

export default function AuditSection({ tenantId }: { tenantId: string }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [thirdParties, setThirdParties] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchThirdParties();
  }, [tenantId]);

  useEffect(() => {
    if (selectedProfileId) {
      fetchAuditReport(selectedProfileId);
    }
  }, [selectedProfileId]);

  const fetchThirdParties = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/gestor/third-parties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setThirdParties(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditReport = async (profileId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/gestor/audit-report?profileId=${profileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAuditData(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedProfileId && !loading && auditData.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-[2.5rem] border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-slate-200" />
         </div>
         <h3 className="text-xl font-black text-navy uppercase tracking-tighter mb-2">Sem histórico disponível</h3>
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8 max-w-xs mx-auto">
           Não encontramos registros de auditoria para este perfil no período selecionado.
         </p>
         <button 
           onClick={() => setSelectedProfileId(null)}
           className="px-8 py-4 bg-navy text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all"
         >
           Voltar para lista
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
           <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
           <p className="mt-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Processando base de dados...</p>
        </div>
      ) : !selectedProfileId ? (
        <AuditThirdPartyList 
          thirdParties={thirdParties} 
          filterText={filterText} 
          setFilterText={setFilterText} 
          onSelect={setSelectedProfileId} 
        />
      ) : (
        <AuditTimeline 
          auditData={auditData} 
          profileName={thirdParties.find(p => p.id === selectedProfileId)?.full_name || ''} 
          onBack={() => setSelectedProfileId(null)} 
        />
      )}
    </div>
  );
}
