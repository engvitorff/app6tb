import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock as ClockIcon, 
  X, 
  Loader2, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  CalendarPlus,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, parseCurrencyInput } from '../utils/currency';
import { EventShow, IssuedContract } from '../data/mocks';
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

  // --- Lógica de Ordenação e Filtros ---
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      // 1. Status 'A receber' primeiro
      if (a.status === 'A receber' && b.status === 'Recebido') return -1;
      if (a.status === 'Recebido' && b.status === 'A receber') return 1;
      
      // 2. Ordenar por data (menor data em cima)
      return a.date.localeCompare(b.date);
    });
  }, [events]);

  const isOverdue = (dateStr: string, status: string) => {
     if (status === 'Recebido') return false;
     const evDate = new Date(dateStr + 'T12:00:00');
     const yesterday = new Date();
     yesterday.setDate(yesterday.getDate() - 1);
     yesterday.setHours(0,0,0,0);
     return evDate < yesterday;
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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

      setContractorName(''); setDate(''); setTime(''); setLocation(''); setValue('');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      const msg = error.message || error.details || 'Erro desconhecido';
      alert(`Erro ao criar evento: ${msg}`);
    }
  };

  const formatDateBR = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 px-1">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Eventos</h1>
          <p className="text-zinc-500 font-medium">Sua agenda organizada.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-[#FF169B] to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-900/30 active:scale-95 transition-transform"
        >
          <CalendarPlus className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-8 h-8 text-[#FF169B] animate-spin mb-3" />
            <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">Buscando shows...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-center">
            <p className="text-red-400 text-sm font-bold mb-1">Ops! Algo deu errado.</p>
            <p className="text-red-300/60 text-xs">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-all">Tentar novamente</button>
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-700">
               <CalendarIcon className="w-8 h-8" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">Nenhum show agendado.</p>
            <button onClick={() => setIsModalOpen(true)} className="mt-4 text-[#FF169B] text-xs font-black uppercase tracking-widest hover:opacity-80">Agendar Agora</button>
          </div>
        )}

        {!isLoading && sortedEvents.map(ev => {
          const overdue = isOverdue(ev.date, ev.status);
          
          return (
          <div 
            key={ev.id} 
            onClick={() => navigate(`/eventos/${ev.id}`)}
            className={`bg-zinc-900 border ${overdue ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-800'} rounded-2xl p-3.5 flex flex-col hover:bg-zinc-800/50 active:scale-98 transition-all cursor-pointer group relative overflow-hidden`}
          >
            {/* Linha Topo: Status e Data */}
            <div className="flex justify-between items-center mb-3">
               <div className="flex items-center space-x-2">
                 <div className={`w-10 h-10 ${overdue ? 'bg-red-500/20 border-red-500/30' : 'bg-zinc-800 border-zinc-700'} rounded-lg flex flex-col items-center justify-center border transition-colors`}>
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${overdue ? 'text-red-400' : 'text-[#FF169B]'}`}>
                      {new Date(ev.date + 'T12:00:00').toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-sm font-black text-white leading-tight">
                      {ev.date.split('-')[2]}
                    </span>
                 </div>
                 <div>
                    <h3 className={`text-sm font-bold ${overdue ? 'text-red-300' : 'text-white'} truncate max-w-[140px] leading-tight group-hover:text-[#FF169B] transition-colors`}>
                      {ev.contractorName}
                    </h3>
                    <div className="flex items-center space-x-2 text-zinc-500">
                       <ClockIcon className="w-3 h-3" />
                       <span className="text-[10px] font-bold">{ev.time || '--:--'}</span>
                    </div>
                 </div>
               </div>

               <div className="text-right">
                  <p className={`text-sm font-black ${overdue ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(ev.totalValueCents)}</p>
                  <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${ev.status === 'Recebido' ? 'text-emerald-500/50' : overdue ? 'text-red-500' : 'text-zinc-600'}`}>
                    {ev.status}
                  </p>
               </div>
            </div>

            {/* Linha Bottom: Info Geográfica (Compacto) */}
            <div className="flex items-center space-x-3 pt-2 border-t border-zinc-800/50">
               <div className="flex items-center space-x-1 min-w-0">
                  <MapPin className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                  <span className="text-[10px] text-zinc-500 truncate">{ev.location}</span>
               </div>
            </div>
          </div>
        );
      })}

      </div>

      {/* MODAL: Adicionar Show */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-[40px] md:rounded-[40px] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight">Novo Show</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white p-2 bg-zinc-900 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddEvent} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Contratante</label>
                <input type="text" value={contractorName} onChange={e => setContractorName(e.target.value)} required placeholder="Ex: Aniversário da Lana"
                  className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all placeholder:text-zinc-700" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Data</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                    className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Horário</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} required
                    className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Valor (R$)</label>
                <input type="text" value={value} onChange={e => setValue(e.target.value)} required placeholder="R$ 0,00"
                  className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all placeholder:text-zinc-700" />
              </div>

              <button type="submit" className="w-full h-16 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-pink-900/20 hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center space-x-2">
                <CalendarPlus className="w-5 h-5" />
                <span>Agendar Show</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
