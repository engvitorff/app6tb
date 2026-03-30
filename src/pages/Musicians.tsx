import React, { useState, useEffect } from 'react';
import { UserPlus, Phone, Music, CreditCard, X, Loader2 } from 'lucide-react';
import { Musician } from '../data/mocks';
import * as api from '../services/api';

export const Musicians = () => {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const handleAddMusician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveMusician({
        name,
        instrument,
        phone,
        pix,
        role
      });
      
      setName('');
      setInstrument('');
      setPhone('');
      setPix('');
      setRole('Freelancer');
      setIsModalOpen(false);
      fetchMusicians();
    } catch (error) {
      alert('Erro ao salvar músico no banco online.');
    }
  };

  const handleDeleteMusician = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Tem certeza que deseja remover este músico da base principal (Nuvem)?')) {
      try {
        await api.deleteMusician(id);
        fetchMusicians();
      } catch (error) {
        alert('Erro ao excluir músico no banco online.');
      }
    }
  };

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Músicos</h1>
          <p className="text-zinc-400 text-sm">Gerencie o elenco ({musicians.length})</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#FF169B] to-purple-600 text-white p-3 rounded-full shadow-lg shadow-pink-900/20 hover:opacity-90 active:scale-95 transition-all"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </header>

      {/* Roster Cards */}
      <div className="space-y-4">
        {musicians.length === 0 && <p className="text-zinc-500 text-center py-10">Nenhum músico cadastrado.</p>}
        {musicians.map(m => (
          <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
            <button onClick={(e) => handleDeleteMusician(m.id, e)} className="absolute top-4 right-2 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-white pr-2">{m.name}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-zinc-400 mt-2 border-t border-zinc-800/50 pt-3">
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4 text-[#FF169B]" />
                <span>{m.instrument}</span>
              </div>
              <div className="flex justify-end">
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  m.role === 'Sócio' 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {m.role}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span>{m.phone}</span>
              </div>
              <div className="flex items-center space-x-2 justify-end overflow-hidden">
                <CreditCard className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <span className="truncate max-w-[100px] text-xs" title={m.pix}>{m.pix}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Form Mobile-First Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Novo Músico</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddMusician} className="space-y-4 pb-10 md:pb-0">
              <div>
                <label className="text-sm font-medium text-zinc-300 ml-1">Nome Completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Zeca"
                  className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 ml-1">Instrumento Principal</label>
                <input type="text" value={instrument} onChange={e => setInstrument(e.target.value)} required placeholder="Ex: Pandeiro"
                  className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 ml-1">Tipo de Vínculo</label>
                <select value={role} onChange={e => setRole(e.target.value as any)} required
                  className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all appearance-none"
                >
                  <option value="Freelancer">Freelancer (Diarista)</option>
                  <option value="Sócio">Sócio / Integrante Fixa (Ganha comissão)</option>
                </select>
                <p className="text-[10px] text-zinc-500 px-2 pt-1 line-clamp-2">Nota: Valores e cachês são discutidos apenas lá nas telas Financeiras (No momento da Escala) de cada show!</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 ml-1">Telefone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(11) 90000-0000"
                    className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 ml-1">Chave PIX</label>
                  <input type="text" value={pix} onChange={e => setPix(e.target.value)} required placeholder="CPF ou Email"
                    className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
                </div>
              </div>

              <button type="submit" className="w-full h-14 mt-6 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all">
                Salvar Cadastro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
