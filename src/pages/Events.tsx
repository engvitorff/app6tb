import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, MapPin, Calendar as CalendarIcon, DollarSign, CheckCircle2, Clock as ClockIcon, X, FileText, Loader2 } from 'lucide-react';
import { formatCurrency, parseCurrencyInput } from '../utils/currency';
import { EventShow, IssuedContract, ScheduledMusician } from '../data/mocks';
import * as api from '../services/api';

export const Events = () => {
  const [events, setEvents] = useState<EventShow[]>([]);
  const [issuedContracts, setIssuedContracts] = useState<IssuedContract[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Modal Form States
  const [contractorName, setContractorName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [value, setValue] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [eventsData, contractsData] = await Promise.all([
        api.getEvents(),
        api.getIssuedContracts()
      ]);
      setEvents(eventsData);
      setIssuedContracts(contractsData);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message || 'Erro ao conectar com o banco de dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // A API já cuida de criar o evento e escalar os 4 sócios automaticamente
      await api.createEvent({
        contractorName,
        date,
        time,
        location,
        totalValueCents: parseCurrencyInput(value),
        status: 'A receber',
        operationalExpensesCents: 0,
        customExpenseName: '',
        customExpenseCents: 0,
        bandFundCents: 0,
        isBandFundAuto: true,
        contractorDiscountCents: 0
      });

      // Limpa e fecha
      setContractorName(''); setDate(''); setTime(''); setLocation(''); setValue('');
      setIsModalOpen(false);
      fetchData(); // Recarrega tudo da nuvem
    } catch (error: any) {
      const msg = error.message || error.details || 'Erro desconhecido';
      alert(`Erro ao criar evento: ${msg}`);
      console.error('ERRO COMPLETO:', error);
    }
  };

  const formatDateBR = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Eventos</h1>
          <p className="text-zinc-400 text-sm">Agenda de Shows</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#FF169B] to-purple-600 text-white p-3 rounded-full shadow-lg shadow-pink-900/20 hover:opacity-90 active:scale-95 transition-all"
        >
          <CalendarPlus className="w-6 h-6" />
        </button>
      </header>

      {/* Events List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-8 h-8 text-[#FF169B] animate-spin mb-3" />
            <p className="text-zinc-500 text-sm font-medium">Buscando shows na nuvem...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <p className="text-red-400 text-sm font-bold mb-1">Ops! Algo deu errado.</p>
            <p className="text-red-300/60 text-xs">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-all">Tentar novamente</button>
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-700">
               <CalendarIcon className="w-8 h-8" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">Nenhum show agendado.</p>
            <button onClick={() => setIsModalOpen(true)} className="mt-4 text-[#FF169B] text-xs font-black uppercase tracking-widest hover:opacity-80">Agendar Primeiro Show</button>
          </div>
        )}

        {!isLoading && events.map(ev => (
          <div 
            key={ev.id} 
            onClick={() => navigate(`/eventos/${ev.id}`)}
            className="block bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm relative overflow-hidden hover:border-[#FF169B]/50 transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3 pr-2 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{ev.contractorName}</h3>
                {issuedContracts.some(c => c.eventId === ev.id) && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/contracts?eventId=${ev.id}`);
                    }}
                    className="flex-shrink-0 bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                    title="Contrato Emitido - Ver Detalhes"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className={`px-2 py-1 flex-shrink-0 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                ev.status === 'Pago' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>
                {ev.status === 'Pago' ? <CheckCircle2 className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                <span>{ev.status}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-zinc-400 mt-2 border-t border-zinc-800/50 pt-3 mb-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-[#FF169B]" />
                <span>{formatDateBR(ev.date)}</span>
              </div>
              <div className="flex items-center space-x-2 justify-end">
                <ClockIcon className="w-4 h-4 text-[#FF169B]" />
                <span>{ev.time || '--:--'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">{formatCurrency(ev.totalValueCents)}</span>
              </div>
              <div className="flex items-center space-x-2 justify-end overflow-hidden">
                <MapPin className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <span className="truncate">{ev.location}</span>
              </div>
            </div>

            {/* Ações Rápidas (Emitir PIX) */}
            {ev.status === 'A receber' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Processando Faturamento via PIX...\n\nShow: ${ev.contractorName}\nValor: ${formatCurrency(ev.totalValueCents)}\n\n(A integração com Mercado Pago está sendo preparada)`);
                }}
                className="w-full h-11 bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-zinc-300 hover:text-emerald-400 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.97]"
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Emitir PIX</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Form Mobile-First Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Adicionar Novo Show</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddEvent} className="space-y-4 pb-10 md:pb-0">
              <div>
                <label className="text-sm font-medium text-zinc-300 ml-1">Contratante / Nome do Show</label>
                <input type="text" value={contractorName} onChange={e => setContractorName(e.target.value)} required placeholder="Ex: Baile do Hawaii"
                  className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 ml-1">Data</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                    className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 ml-1">Horário (Início)</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} required
                    className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 ml-1">Local / Endereço</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} required placeholder="Ex: Av Paulista, 1000"
                  className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 ml-1">Valor Combinado (Base R$)</label>
                <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} required placeholder="2500.00"
                  className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
              </div>

              <button type="submit" className="w-full h-14 mt-6 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2">
                <CalendarPlus className="w-5 h-5" />
                <span>Salvar e Montar Escala</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
