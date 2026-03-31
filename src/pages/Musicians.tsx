import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Phone, Music, CreditCard, X, Loader2, ChevronRight, Hash, Trash2 } from 'lucide-react';
import { Musician } from '../data/mocks';
import * as api from '../services/api';

export const Musicians = () => {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMusician, setSelectedMusician] = useState<Musician | null>(null);
  
  // Modal Form States
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('');
  const [phone, setPhone] = useState('');
  const [pix, setPix] = useState('');
  const [role, setRole] = useState<'Sócio' | 'Freelancer'>('Freelancer');

  const fetchMusicians = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMusicians();
      setMusicians(data);
    } catch (error) {
      console.error('Erro ao carregar músicos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMusicians();
  }, []);

  const resetForm = () => {
    setName('');
    setInstrument('');
    setPhone('');
    setPix('');
    setRole('Freelancer');
    setSelectedMusician(null);
  };

  const openModal = (musician?: Musician) => {
    if (musician) {
      setSelectedMusician(musician);
      setName(musician.name);
      setInstrument(musician.instrument);
      setPhone(musician.phone);
      setPix(musician.pix);
      setRole(musician.role);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSaveMusician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveMusician({
        id: selectedMusician?.id,
        name,
        instrument,
        phone,
        pix,
        role
      });
      
      resetForm();
      setIsModalOpen(false);
      fetchMusicians();
    } catch (error) {
      alert('Erro ao salvar músico no banco online.');
    }
  };

  const handleDeleteMusician = async (id: string) => {
    if(confirm('Tem certeza que deseja remover este músico permanentemente?')) {
      try {
        await api.deleteMusician(id);
        setIsModalOpen(false);
        fetchMusicians();
      } catch (error) {
        alert('Erro ao excluir músico no banco online.');
      }
    }
  };

  const sortedMusicians = useMemo(() => {
    return [...musicians].sort((a,b) => a.name.localeCompare(b.name));
  }, [musicians]);

  return (
    <div className="p-6 pb-24">
      <header className="flex justify-between items-center mb-8 px-1">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Elenco</h1>
          <p className="text-zinc-500 font-medium">Equipe técnica e musical ({musicians.length})</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-14 h-14 bg-gradient-to-tr from-[#FF169B] to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-900/30 active:scale-95 transition-transform"
        >
          <UserPlus className="w-6 h-6 text-white" />
        </button>
      </header>

      {/* Roster List in Sequence */}
      <div className="space-y-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FF169B] animate-spin mb-3" />
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Carregando músicos...</p>
          </div>
        )}

        {!isLoading && musicians.length === 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-10 text-center">
             <p className="text-zinc-600 text-sm italic">Nenhum músico cadastrado.</p>
          </div>
        )}

        {!isLoading && sortedMusicians.map(m => (
          <div 
            key={m.id} 
            onClick={() => openModal(m)}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-800/80 active:scale-[0.98] transition-all cursor-pointer group backdrop-blur-sm"
          >
            <div className="flex items-center space-x-4">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center border font-black text-sm transition-colors ${
                 m.role === 'Sócio' 
                   ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                   : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'
               }`}>
                 {m.name.charAt(0).toUpperCase()}
               </div>
               <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate pr-2 group-hover:text-[#FF169B] transition-colors">{m.name}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                     <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{m.instrument}</span>
                     <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                     <span className={`text-[9px] font-black uppercase tracking-widest ${m.role === 'Sócio' ? 'text-purple-400' : 'text-zinc-600'}`}>{m.role}</span>
                  </div>
               </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-zinc-500 transition-colors" />
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-[40px] md:rounded-[40px] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">{selectedMusician ? 'Editar Músico' : 'Novo Músico'}</h2>
                <p className="text-zinc-500 text-xs font-medium mt-0.5 uppercase tracking-widest">{selectedMusician ? 'Atualize as informações' : 'Preencha os dados básicos'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white p-2 bg-zinc-900 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveMusician} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Nome Completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Zeca"
                  className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Instrumento</label>
                  <input type="text" value={instrument} onChange={e => setInstrument(e.target.value)} required placeholder="Ex: Cavaco"
                    className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white focus:outline-none transition-all placeholder:text-zinc-800 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Tipo</label>
                  <select value={role} onChange={e => setRole(e.target.value as any)}
                    className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white focus:outline-none transition-all appearance-none font-bold">
                    <option value="Freelancer">Freelancer</option>
                    <option value="Sócio">Sócio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(00) 00000-0000"
                    className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-5 text-white focus:outline-none transition-all font-bold" />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Chave PIX</label>
                <div className="relative">
                  <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input type="text" value={pix} onChange={e => setPix(e.target.value)} required placeholder="CPF ou Email"
                    className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-5 text-white focus:outline-none transition-all font-bold" />
                </div>
              </div>

              <div className="pt-4 flex flex-col space-y-3">
                <button type="submit" className="w-full h-16 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-pink-900/20 active:scale-[0.97] transition-all">
                  {selectedMusician ? 'Atualizar Dados' : 'Salvar Músico'}
                </button>
                {selectedMusician && (
                  <button type="button" onClick={() => handleDeleteMusician(selectedMusician.id)}
                    className="w-full h-14 bg-red-500/10 text-red-500 font-bold uppercase tracking-widest text-[10px] rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center space-x-2">
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Músico</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
