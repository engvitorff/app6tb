import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Phone, CreditCard, Save, Landmark, Building2, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { getBandProfile, saveBandProfile } from '../services/api';
import { BandProfile } from '../data/mocks';

export const Users = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState<BandProfile>({
    name: '',
    cnpj: '',
    address: '',
    city: '',
    cep: '',
    repName: '',
    repRg: '',
    repCpf: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getBandProfile();
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saveBandProfile(profile);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/');
      }, 1500);
    } catch (error) {
      alert('Erro ao salvar os dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BandProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF169B] mb-4" />
        <p>Carregando perfil do sistema...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Meu Cadastro</h1>
        <p className="text-zinc-400 text-sm">Vincule seus dados e informações do Grupo para emissão de contratos e repasses.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Seção 1: Identificação Representante */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-[#FF169B]/10 rounded-lg">
              <UserCircle className="w-5 h-5 text-[#FF169B]" />
            </div>
            <h2 className="text-lg font-bold text-white">Dados do Responsável</h2>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block">Nome Completo (Representante)</label>
              <input type="text" value={profile.repName} onChange={e => handleChange('repName', e.target.value)} required placeholder="Seu nome"
                className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white focus:border-[#FF169B] focus:outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block">CPF</label>
                <input type="text" value={profile.repCpf} onChange={e => handleChange('repCpf', e.target.value)} required placeholder="000.000.000-00"
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white focus:border-[#FF169B] focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block">RG</label>
                <input type="text" value={profile.repRg} onChange={e => handleChange('repRg', e.target.value)} required placeholder="MG-00.000.000"
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white focus:border-[#FF169B] focus:outline-none transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 3: Endereço (Para Contratos) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Endereço de Faturamento</h2>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block">Logradouro (Rua, Nº, Bairro)</label>
              <input type="text" value={profile.address} onChange={e => handleChange('address', e.target.value)} required placeholder="Ex: Rua Direita, 100"
                className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white focus:border-emerald-500 focus:outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block">Cidade/UF</label>
                <input type="text" value={profile.city} onChange={e => handleChange('city', e.target.value)} required placeholder="Ex: São Paulo/SP"
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white focus:border-emerald-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block">CEP</label>
                <input type="text" value={profile.cep} onChange={e => handleChange('cep', e.target.value)} required placeholder="00000-000"
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white focus:border-emerald-500 focus:outline-none transition-all" />
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 left-6 right-6 z-20 md:relative md:bottom-auto md:left-auto md:right-auto md:px-0">
          <button 
            type="submit" 
            disabled={saving}
            className={`w-full h-16 rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-2xl transition-all active:scale-95 ${
              success 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gradient-to-r from-[#FF169B] to-purple-600 text-white hover:opacity-90'
            }`}
          >
            {saving ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : success ? (
              <>
                <CheckCircle className="w-6 h-6" />
                <span>Perfil Atualizado!</span>
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                <span>Salvar Informações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
