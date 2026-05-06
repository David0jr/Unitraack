import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AuditThirdPartyList } from './dashboard/audit/AuditThirdPartyList';
import { AuditTimeline } from './dashboard/audit/AuditTimeline';

interface AuditSectionProps {
  tenantId: string;
  filterText: string;
  setFilterText: (text: string) => void;
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;
}

export default function AuditSection({ 
  tenantId, 
  filterText, 
  setFilterText, 
  selectedProfileId, 
  setSelectedProfileId 
}: AuditSectionProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [thirdParties, setThirdParties] = useState<any[]>([]);
  const [auditData, setAuditData] = useState<any[]>([]);

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
      <div className="p-12 text-center bg-white rounded-[3rem] border border-slate-100 shadow-xl animate-in fade-in zoom-in-95 duration-500">
         <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-slate-100">
            <BarChart3 className="w-10 h-10 text-slate-200" />
         </div>
         <h3 className="text-3xl font-black text-navy uppercase tracking-tighter mb-4">Sem histórico operacional</h3>
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-10 max-w-sm mx-auto leading-relaxed">
           Não detectamos registros de auditoria ou rastreabilidade para este perfil no banco de dados atual.
         </p>
         <button 
           onClick={() => setSelectedProfileId(null)}
           className="px-10 py-5 bg-navy text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#002880] transition-all shadow-xl shadow-navy/20 active:scale-95"
         >
           Retornar à Base Central
         </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
