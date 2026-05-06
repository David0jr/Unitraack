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
  ChevronDown
} from 'lucide-react';
import axios from 'axios';

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

  const fetchSectors = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/gestor/sectors`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      setSectors(response.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar setores:', err);
    }
  };

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

    // 1. Otimista (Instantâneo): Mostra a imagem na tela na mesma hora que o usuário clica
    const localBlobUrl = URL.createObjectURL(file);
    updateMaterial(id, 'imageUrl', localBlobUrl);
    updateMaterial(id, 'uploading', true);

    try {
      // 2. Prepara o nome do arquivo único usando timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `requests/${fileName}`;

      // 3. Faz o upload real
      const { error: uploadError } = await supabase.storage
        .from('material-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // 4. Pega a URL pública oficial e substitui no banco local (sai o blob:, entra o https:)
      const { data: { publicUrl } } = supabase.storage
        .from('material-images')
        .getPublicUrl(filePath);

      updateMaterial(id, 'imageUrl', publicUrl);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      // Se deu erro real, removemos a foto falsa (blob) para o usuário não ser enganado e tentar enviar
      updateMaterial(id, 'imageUrl', '');
      alert('Falha ao subir a imagem no servidor: ' + (err?.message || 'Verifique sua conexão.'));
    } finally {
      updateMaterial(id, 'uploading', false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (materials.length === 0) {
      alert('Adicione pelo menos um equipamento.');
      return;
    }

    if (!parentSectorId || !sectorId) {
      alert('Por favor, selecione o Setor Geral e o Local Específico.');
      return;
    }

    const itemDeFalta = materials.find((m) => !m.imageUrl);
    if (itemDeFalta) {
      alert(`Você esqueceu de adicionar a foto do equipamento.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sector: sectorName,
        sector_id: sectorId,
        entry_date: entryDate,
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
        alert(editMode ? 'Solicitação atualizada com sucesso!' : 'Solicitação enviada com sucesso!');
        navigate('/painel');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao enviar solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-brand antialiased text-navy">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
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
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Status Autenticado</span>
             <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="mb-10 text-center">
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] bg-primary/5 px-6 py-2 rounded-full mb-4 inline-block">Módulo de Logística</span>
             <h2 className="text-4xl font-black text-navy uppercase tracking-tighter">
               {editMode ? 'Editar' : 'Agendar'} <span className="text-primary italic">{editMode ? 'Solicitação' : 'Entrada'}</span>
             </h2>
             <p className="text-slate-400 font-medium mt-2 italic">
               {editMode ? 'Ao salvar, o pedido voltará para análise do Líder.' : 'Preencha os dados técnicos para aprovação do Líder de Setor.'}
             </p>
          </div>

           {/* Core Info Section */}
          <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-navy/5 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> 1. Setor Geral
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

                <div className="space-y-2 relative z-40">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> 2. Local Específico (Fim)
                   </label>
                   <CustomSelect 
                     value={sectorId}
                     disabled={!parentSectorId}
                     onChange={(val: string) => {
                       const sel = sectors.find(s => s.id === val);
                       setSectorId(val);
                       setSectorName(sel?.name || '');
                     }}
                     placeholder="ESCOLHA O LOCAL..."
                     options={sectors.filter(s => s.parent_id === parentSectorId).map(s => ({ type: 'option', value: s.id, label: s.name }))}
                   />
                </div>
             </div>


             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest flex items-center gap-2">
                   <Calendar className="w-3.5 h-3.5 text-primary" /> Data e Hora da Chegada
                </label>
                <input 
                  type="datetime-local" 
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-6 py-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl text-navy font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                />
             </div>
          </div>

          {/* Materials Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="font-black text-navy text-xs uppercase tracking-widest flex items-center gap-3">
                 <Package className="w-5 h-5 text-primary" /> Equipamentos a Transportar
              </h3>
              <button 
                type="button" 
                onClick={addMaterial}
                className="flex items-center gap-2 bg-navy text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#002880] transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" /> Adicionar Item
              </button>
            </div>

            {materials.length === 0 && (
              <div className="p-16 border-2 border-dashed border-slate-200 rounded-[40px] text-center bg-white/50">
                 <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-4 italic">Nenhum equipamento listado no protocolo.</p>
                 <button type="button" onClick={addMaterial} className="text-primary font-black text-xs uppercase underline">Clique para começar</button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {materials.map((mat, index) => (
                <div key={mat.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:border-primary/30 transition-all group animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                    <span className="bg-navy text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Equipamento #{index + 1}</span>
                    <button type="button" onClick={() => removeMaterial(mat.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-3">
                       <div className="relative aspect-square bg-[#F8FAFC] border border-slate-100 rounded-[32px] overflow-hidden group/img flex flex-col items-center justify-center text-center p-4">
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
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Foto / Upload</p>
                                <span className="text-[8px] text-red-500 uppercase font-black tracking-widest mt-1 bg-red-50 px-2 py-1 rounded-full">(Foto Obrigatória)</span>
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
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest leading-none">Condição Fís.</label>
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
                className="w-full max-w-sm py-6 bg-[#0032A0] hover:bg-[#002880] text-white font-black uppercase tracking-[0.3em] rounded-[30px] shadow-2xl shadow-navy/20 flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50"
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
      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest leading-none">{label}</label>
      <input 
        type={type}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 py-3.5 bg-[#F8FAFC] border border-slate-100 rounded-2xl text-navy placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-xs"
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
    <div className={`relative w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={dropdownRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full px-6 py-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl text-navy font-bold text-sm cursor-pointer flex items-center justify-between hover:border-primary/30 transition-all select-none uppercase"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className={`absolute ${direction === 'up' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'} left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto`}>
          {options.map((opt: any, i: number) => {
            if (opt.type === 'group') {
              return (
                <div key={i} className="py-1">
                  <div className="px-5 pt-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-[#F8FAFC]">
                    {opt.label}
                  </div>
                  {opt.items.map((item: any) => (
                    <div 
                      key={item.value}
                      onClick={() => { onChange(item.value); setIsOpen(false); }}
                      className={`px-5 py-3 text-xs font-bold cursor-pointer uppercase hover:bg-[#F8FAFC] transition-all ${value === item.value ? 'text-primary bg-primary/5' : 'text-slate-600'}`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div 
                key={opt.value || i}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-5 py-3 text-xs font-bold cursor-pointer uppercase hover:bg-[#F8FAFC] transition-all ${value === opt.value ? 'text-primary bg-primary/5' : 'text-slate-600'} ${i === 0 ? 'rounded-t-2xl' : ''} ${i === options.length - 1 ? 'rounded-b-2xl' : ''}`}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

