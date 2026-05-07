import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthToken } from '../../../../utils/subdomain';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  Plus, 
  Trash2, 
  Camera, 
  ArrowLeft, 
  Save, 
  Loader2,
  Package,
  Calendar,
  MapPin,
  ChevronDown,
  Check,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { SignaturePad } from '../../../../components/SignaturePad';

interface MaterialItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  description: string;
  condition: string;
  code: string;
  imageUrl: string;
  uploading: boolean;
}

export default function NovaSolicitacao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.editMode || false;
  const editRequest = location.state?.request || null;

  const [submitting, setSubmitting] = useState(false);
  const [sectors, setSectors] = useState<any[]>([]);
  const [parentSectorId, setParentSectorId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [sectorName, setSectorName] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  useEffect(() => {
    if (editMode && editRequest) {
      setEntryDate(editRequest.entry_date.slice(0, 16)); // Format for datetime-local
      setSectorId(editRequest.sector_id);
      setSectorName(editRequest.sector);
      // Pre-populate materials
      if (editRequest.materials) {
        setMaterials(editRequest.materials.map((m: any) => ({
          id: m.id || crypto.randomUUID(),
          name: m.name || '',
          brand: m.brand || '',
          model: m.model || '',
          serial_number: m.serial_number || '',
          description: m.description || '',
          condition: m.condition || 'USADO',
          code: m.code || '',
          imageUrl: m.image_url || '',
          uploading: false
        })));
      }
    }
  }, [editMode, editRequest]);

  useEffect(() => {
    fetchProfile();
    fetchSectors();
  }, [user]);

  // Encontrar o parentSectorId quando editando
  useEffect(() => {
    if (editMode && sectors.length > 0 && sectorId) {
      const currentSector = sectors.find(s => s.id === sectorId);
      if (currentSector?.parent_id) {
        setParentSectorId(currentSector.parent_id);
      }
    }
  }, [sectors, sectorId, editMode]);

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [driverName, setDriverName] = useState('');
  const [plate, setPlate] = useState('');
  const [signature, setSignature] = useState('');

  const fetchSectors = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sectors`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      setSectors(response.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar setores:', err);
    }
  };

  useEffect(() => {
     if (editMode && editRequest) {
        setDriverName(editRequest.driver_name || '');
        setPlate(editRequest.plate || '');
     }
  }, [editMode, editRequest]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    }
  };

  const addMaterial = () => {
    const newItem: MaterialItem = {
      id: crypto.randomUUID(),
      name: '',
      brand: '',
      model: '',
      serial_number: '',
      description: '',
      condition: 'USADO',
      code: '',
      imageUrl: '',
      uploading: false
    };
    setMaterials([...materials, newItem]);
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const updateMaterial = (id: string, field: keyof MaterialItem, value: string | boolean) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleFileUpload = async (id: string, file: File) => {
    if (!file) return;

    const localBlobUrl = URL.createObjectURL(file);
    updateMaterial(id, 'imageUrl', localBlobUrl);
    updateMaterial(id, 'uploading', true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `requests/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('material-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('material-images')
        .getPublicUrl(filePath);

      updateMaterial(id, 'imageUrl', publicUrl);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      updateMaterial(id, 'imageUrl', '');
      setErrorMessage('Falha ao subir a imagem no servidor. Verifique sua conexão.');
    } finally {
      updateMaterial(id, 'uploading', false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (materials.length === 0) {
      setErrorMessage('Adicione pelo menos um equipamento para continuar.');
      return;
    }

    if (!parentSectorId || !sectorId) {
      setErrorMessage('Por favor, selecione o Setor Geral e o Local Específico.');
      return;
    }

    if (!driverName || !plate) {
      setErrorMessage('Por favor, informe o Nome do Motorista e a Placa do Veículo.');
      return;
    }

    const itemDeFalta = materials.find((m) => !m.imageUrl);
    if (itemDeFalta) {
      setErrorMessage(`Você esqueceu de anexar a foto de um dos equipamentos.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sector: sectorName,
        sector_id: sectorId,
        entry_date: entryDate ? new Date(entryDate).toISOString() : null,
        driver_name: driverName,
        plate: plate,
        signature: signature,
        materials: materials.map(({ name, brand, model, serial_number, description, condition, code, imageUrl }) => ({
          name, brand, model, serial_number, description, condition, code, image_url: imageUrl
        }))
      };


      const url = editMode 
        ? `${import.meta.env.VITE_API_URL}/terceirizada/requisicao/${editRequest.id}`
        : `${import.meta.env.VITE_API_URL}/terceirizada/requisicao`;

      const method = editMode ? 'put' : 'post';

      const response = await axios({
        method,
        url,
        data: payload,
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.status === 201 || response.status === 200) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/painel');
        }, 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Ocorreu um erro ao enviar sua solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-brand antialiased text-navy relative">
      
      {/* Premium Feedback Overlays */}
      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-navy/40 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-white rounded-[2.5rem] p-12 max-w-sm w-full text-center shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in-95 duration-500 scale-110">
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20 relative">
                 <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                 <Check className="w-12 h-12 text-white stroke-[3px]" />
              </div>
              <h3 className="text-2xl font-black text-navy uppercase tracking-tighter mb-3">Protocolo Enviado!</h3>
              <p className="text-slate-400 font-medium leading-relaxed mb-6">Sua solicitação foi processada e já está na fila de aprovação do Líder.</p>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 animate-progress origin-left"></div>
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-6">Redirecionando para o painel...</p>
           </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-6 animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-rose-600 text-white p-5 rounded-2xl shadow-2xl shadow-rose-600/20 flex items-center justify-between border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                 </div>
                 <p className="text-sm font-bold tracking-tight">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage('')} className="p-2 hover:bg-white/10 rounded-lg transition-all ml-4">
                 <ArrowLeft className="w-4 h-4 rotate-90" />
              </button>
           </div>
        </div>
      )}

      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => navigate('/painel')}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="h-6 w-px bg-slate-100 mx-1"></div>
             <img 
              src="https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png" 
              alt="Lins" 
              className="h-9"
            />
          </div>
          <div className="hidden sm:flex items-center gap-3">
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Status Autenticado</span>
             <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          <div className="mb-12 text-center">
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-6 py-2.5 rounded-full mb-5 inline-block">Módulo de Logística Industrial</span>
             <h2 className="text-5xl font-bold text-navy uppercase tracking-tighter leading-none mb-4">
               {editMode ? 'Editar' : 'Agendar'} <span className="text-primary italic font-serif lowercase">{editMode ? 'Solicitação' : 'Entrada'}</span>
             </h2>
             <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
               {editMode ? 'Ao salvar as alterações, o protocolo retornará para o fluxo de análise do Líder Responsável.' : 'Preencha os dados técnicos e anexe as fotos para validação do Líder de Setor e Monitoria de Segurança.'}
             </p>
          </div>

           {/* Core Info Section */}
          <div className="bg-white rounded-[2rem] p-12 shadow-[0_32px_64px_-12px_rgba(0,50,160,0.08)] border border-slate-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform"></div>
             
             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 items-end relative z-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-[0.15em] flex items-center gap-2">
                      <div className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-primary" />
                      </div>
                      1. Setor Destino (Geral)
                   </label>
                   <CustomSelect 
                     value={parentSectorId}
                     onChange={(val: string) => {
                       setParentSectorId(val);
                       setSectorId('');
                       setSectorName('');
                     }}
                     placeholder="SELECIONE O GRUPO"
                     options={sectors.filter(s => !s.parent_id).map(s => ({ type: 'option', value: s.id, label: s.name }))}
                   />
                </div>

                <div className="space-y-3 relative z-40">
                   <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-[0.15em] flex items-center gap-2">
                      <div className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-primary" />
                      </div>
                      2. Sub-setor / Área Específica
                   </label>
                   <CustomSelect 
                     value={sectorId}
                     disabled={!parentSectorId}
                     onChange={(val: string) => {
                       const sel = sectors.find(s => s.id === val);
                       setSectorId(val);
                       setSectorName(sel?.name || '');
                     }}
                     placeholder={!parentSectorId ? "AGUARDANDO SETOR PAI..." : "ESCOLHA O LOCAL..."}
                     options={sectors.filter(s => s.parent_id === parentSectorId).map(s => ({ type: 'option', value: s.id, label: s.name }))}
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end relative z-10 pt-10 border-t border-slate-50">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-[0.15em] flex items-center gap-2">
                      <div className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-primary" />
                      </div>
                      3. Previsão de Chegada
                    </label>
                    <input 
                      type="datetime-local" 
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full px-6 py-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl text-navy font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all shadow-inner"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-[0.15em] flex items-center gap-2">
                      <div className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>

                       4. Assinatura Digital (Desenhe)
                    </label>
                    <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-4 shadow-inner">
                      <SignaturePad onSave={setSignature} />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-[0.15em] flex items-center gap-2">
                       <div className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center">
                         <Package className="w-3 h-3 text-primary" />
                       </div>
                       5. Nome do Motorista
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="EX: JOÃO DA SILVA"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value.toUpperCase())}
                      className="w-full px-6 py-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl text-navy font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all shadow-inner"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-[0.15em] flex items-center gap-2">
                      <div className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center">
                        <Package className="w-3 h-3 text-primary" />
                      </div>
                      6. Placa do Veículo
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="EX: ABC1D23"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      className="w-full px-6 py-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl text-navy font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all shadow-inner"
                    />
                </div>
             </div>
          </div>

          {/* Materials Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="font-bold text-navy text-xs uppercase tracking-widest flex items-center gap-3">
                 <Package className="w-5 h-5 text-primary" /> Equipamentos a Transportar
              </h3>
              <button 
                type="button" 
                onClick={addMaterial}
                className="flex items-center gap-2 bg-navy text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#002880] transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" /> Adicionar Item
              </button>
            </div>

            {materials.length === 0 && (
              <div className="p-16 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-white/50">
                 <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-4 italic">Nenhum equipamento listado no protocolo.</p>
                 <button type="button" onClick={addMaterial} className="text-primary font-bold text-xs uppercase underline">Clique para começar</button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {materials.map((mat, index) => (
                <div key={mat.id} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:border-primary/30 transition-all group animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                    <span className="bg-navy text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">Equipamento #{index + 1}</span>
                    <button type="button" onClick={() => removeMaterial(mat.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-3">
                       <div className="relative aspect-square bg-[#F8FAFC] border border-slate-100 rounded-2xl overflow-hidden group/img flex flex-col items-center justify-center text-center p-4">
                          {mat.imageUrl ? (
                            <>
                              <img src={mat.imageUrl} alt="Material" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => updateMaterial(mat.id, 'imageUrl', '')} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                 <Trash2 className="text-white" />
                              </button>
                            </>
                          ) : (
                             <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center hover:bg-slate-100 transition-colors gap-2">
                                {mat.uploading ? <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /> : <Camera className="w-10 h-10 text-slate-200" />}
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Foto / Upload</p>
                                <span className="text-[8px] text-red-500 uppercase font-bold tracking-widest mt-1 bg-red-50 px-2 py-1 rounded-full">(Foto Obrigatória)</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(mat.id, e.target.files[0])} />
                             </label>
                          )}
                       </div>
                    </div>

                    <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InputGroup label="Nome do Equipamento" value={mat.name} onChange={v => updateMaterial(mat.id, 'name', v)} placeholder="Ex: Compressor de Ar" />
                       <InputGroup label="Marca / Fabr." value={mat.brand} onChange={v => updateMaterial(mat.id, 'brand', v)} placeholder="Ex: Schulz" />
                       <InputGroup label="Modelo" value={mat.model} onChange={v => updateMaterial(mat.id, 'model', v)} placeholder="Ex: MSV 40" />
                       <InputGroup label="Nº Série / Placa" value={mat.serial_number} onChange={v => updateMaterial(mat.id, 'serial_number', v)} placeholder="Ex: SN-000A" />
                       
                       <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 tracking-widest leading-none">Condição Fís.</label>
                            <CustomSelect 
                              value={mat.condition}
                              onChange={(val: string) => updateMaterial(mat.id, 'condition', val)}
                              placeholder="CONDIÇÃO"
                              direction="up"
                              options={[
                                { type: 'option', value: 'NOVO', label: 'Novo' },
                                { type: 'option', value: 'USADO', label: 'Usado' },
                                { type: 'option', value: 'DANIFICADO', label: 'Danificado' },
                              ]}
                            />
                         </div>
                         <div className="md:col-span-2">
                            <InputGroup label="Descrição de Avarias / Obs" value={mat.description} onChange={v => updateMaterial(mat.id, 'description', v)} placeholder="Pequenos riscos na lateral..." />
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-10 border-t border-slate-100 flex flex-col items-center">
             <button 
                type="submit" 
                disabled={submitting}
                className="w-full max-w-sm py-6 bg-[#0032A0] hover:bg-[#002880] text-white font-bold uppercase tracking-widest rounded-xl shadow-xl shadow-navy/20 flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50"
             >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                     {editMode ? 'SALVAR ALTERAÇÕES' : 'EFETUAR SOLICITAÇÃO'}
                     <Save className="w-5 h-5 text-primary" />
                  </>
                )}
             </button>
             <p className="mt-8 text-slate-300 font-bold text-[9px] uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Sistema Lins Agroindustrial Security v7.0
             </p>
          </div>

        </form>
      </main>
    </div>
  );
}

function InputGroup({ label, placeholder, type = "text", value, onChange }: { label: string, placeholder: string, type?: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 tracking-widest leading-none">{label}</label>
      <input 
        type={type}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 py-3.5 bg-[#F8FAFC] border border-slate-100 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-xs"
      />
    </div>
  );
}

function ShieldCheck({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
  );
}

function CustomSelect({ value, onChange, options, placeholder, direction = 'down', disabled = false }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let selectedLabel = placeholder;
  for (const group of options) {
    if (group.type === 'option' && group.value === value) {
      selectedLabel = group.label;
    } else if (group.type === 'group') {
      const found = group.items.find((i: any) => i.value === value);
      if (found) selectedLabel = found.label;
    }
  }

  return (
    <div className={`relative w-full ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`} ref={dropdownRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-6 py-4 bg-white border ${isOpen ? 'border-primary shadow-[0_0_0_4px_rgba(0,50,160,0.05)]' : 'border-slate-100 shadow-sm'} rounded-2xl text-navy font-bold text-sm cursor-pointer flex items-center justify-between hover:border-primary/30 transition-all select-none uppercase tracking-tight`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </div>

      {isOpen && (
        <div className={`absolute ${direction === 'up' ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]'} left-0 right-0 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,50,160,0.15)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200 max-h-80 overflow-hidden flex flex-col`}>
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {options.length === 0 ? (
              <div className="px-6 py-8 text-center">
                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhuma opção encontrada</p>
              </div>
            ) : options.map((opt: any, i: number) => {
              if (opt.type === 'group') {
                return (
                  <div key={i} className="border-b border-slate-50 last:border-0">
                    <div className="px-6 pt-4 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                      {opt.label}
                    </div>
                    {opt.items.map((item: any) => (
                      <div 
                        key={item.value}
                        onClick={() => { onChange(item.value); setIsOpen(false); }}
                        className={`px-6 py-3.5 text-xs font-bold cursor-pointer uppercase hover:bg-primary hover:text-white transition-all flex items-center justify-between group/item ${value === item.value ? 'text-primary bg-primary/5' : 'text-navy'}`}
                      >
                        {item.label}
                        {value === item.value && <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover/item:bg-white"></div>}
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div 
                  key={opt.value || i}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`px-6 py-3.5 text-xs font-bold cursor-pointer uppercase hover:bg-primary hover:text-white transition-all flex items-center justify-between group/item ${value === opt.value ? 'text-primary bg-primary/5' : 'text-navy'} border-b border-slate-50 last:border-0`}
                >
                  {opt.label}
                  {value === opt.value && <div className="w-1.5 h-1.5 bg-primary rounded-full group-hover/item:bg-white"></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

