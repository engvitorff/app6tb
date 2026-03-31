import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock as ClockIcon, 
  X, 
  Loader2, 
  MapPin, 
  CalendarPlus
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

  // Filtros
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [eventsData, contractsData] = await Promise.all([
        api.getEvents(),
        api.getIssuedContracts()
      ]);
      setEvents(eventsData || []);
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

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    events.forEach(ev => yearsSet.add(ev.date.split('-')[0]));
    if (yearsSet.size === 0) yearsSet.add(new Date().getFullYear().toString());
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [events]);

  const months = [
    { label: 'Todos os meses', value: 'all' },
    { label: 'Janeiro', value: '01' },
    { label: 'Fevereiro', value: '02' },
    { label: 'Março', value: '03' },
    { label: 'Abril', value: '04' },
    { label: 'Maio', value: '05' },
    { label: 'Junho', value: '06' },
    { label: 'Julho', value: '07' },
    { label: 'Agosto', value: '08' },
    { label: 'Setembro', value: '09' },
    { label: 'Outubro', value: '10' },
    { label: 'Novembro', value: '11' },
    { label: 'Dezembro', value: '12' },
  ];

  const filteredEvents = useMemo(() => {
    const filtered = events.filter(ev => {
      const [year, month] = ev.date.split('-');
      const matchYear = year === filterYear;
      const matchMonth = filterMonth === 'all' || month === filterMonth;
      const matchStatus = filterStatus === 'all' || ev.status === filterStatus;
      return matchYear && matchMonth && matchStatus;
    });

    return filtered.sort((a, b) => {
      if (a.status === 'A receber' && b.status === 'Recebido') return -1;
      if (a.status === 'Recebido' && b.status === 'A receber') return 1;
      return a.date.localeCompare(b.date);
    });
  }, [events, filterYear, filterMonth, filterStatus]);

  const isOverdue = (dateStr: string, status: string) => {
     if (status === 'Recebido') return false;
     const evDate = new Date(dateStr + 'T12:00:00');
     const yesterday = new Date();
     yesterday.setHours(0,0,0,0);
     return evDate < yesterday;
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const overlap = await api.checkEventOverlap(date, time);
      if (overlap) {
        const proceed = window.confirm(
          `ALERTA DE CONFLITO!\n\nEste show (${time} às ${new Date(new Date(date + 'T' + time).getTime() + 3 * 3600000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}) sobrepõe o show de "${overlap.contractorName}" (${overlap.time}).\n\nDeseja agendar mesmo assim?`
        );
        if (!proceed) return;
      }

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
      alert(`Erro ao criar evento: ${error.message}`);
    }
  };

  return (
    <div className="p-6 pb-24">
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

      <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 mb-6 flex space-x-2 backdrop-blur-sm sticky top-4 z-20 overflow-x-auto no-scrollbar">
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="bg-zinc-950/50 text-white text-[10px] font-black uppercase rounded-xl px-3 py-2 border border-zinc-800 focus:outline-none">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-zinc-950/50 text-white text-[10px] font-black uppercase rounded-xl px-3 py-2 border border-zinc-800 flex-1 focus:outline-none">
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-zinc-950/50 text-white text-[10px] font-black uppercase rounded-xl px-3 py-2 border border-zinc-800 flex-1 focus:outline-none">
          <option value="all">Status: Todos</option>
          <option value="Recebido">Recebidos</option>
          <option value="A receber">Pendentes</option>
        </select>
      </section>

      <div className="space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-8 h-8 text-[#FF169B] animate-spin mb-3" />
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Carregando shows...</p>
          </div>
        )}

        {!isLoading && filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="text-zinc-500 text-sm font-medium italic">Nenhum show encontrado para esses filtros.</p>
          </div>
        )}

        {!isLoading && filteredEvents.map(ev => {
          const overdue = isOverdue(ev.date, ev.status);
          
          return (
          <div 
            key={ev.id} 
            onClick={() => navigate(`/eventos/${ev.id}`)}
            className={`bg-zinc-900 border ${overdue ? 'border-red-500 bg-red-500/10' : 'border-zinc-800'} rounded-2xl p-4 flex flex-col hover:bg-zinc-800/50 transition-all cursor-pointer group relative overflow-hidden active:scale-[0.99]`}
          >
            {overdue && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg z-10 animate-pulse">Atrasado</div>
            )}

            <div className="flex justify-between items-center mb-3">
               <div className="flex items-center space-x-3">
                 <div className={`w-12 h-12 ${overdue ? 'bg-red-500' : 'bg-zinc-800'} rounded-xl flex flex-col items-center justify-center border ${overdue ? 'border-red-400' : 'border-zinc-700'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${overdue ? 'text-white' : 'text-[#FF4DB8]'} leading-none`}>
                      {new Date(ev.date + 'T12:00:00').toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}
                    </span>
                    <span className={`text-lg font-black leading-none ${overdue ? 'text-white' : 'text-zinc-100'}`}>
                      {ev.date.split('-')[2]}
                    </span>
                 </div>
                 <div>
                    <h3 className={`text-sm font-bold ${overdue ? 'text-red-100' : 'text-white'} truncate max-w-[140px] group-hover:text-[#FF169B] transition-colors leading-tight`}>
                      {ev.contractorName}
                    </h3>
                    <div className="flex items-center space-x-2 text-zinc-500 mt-0.5">
                       <ClockIcon className="w-3 h-3" />
                       <span className="text-[10px] font-bold">{ev.time || '--:--'}</span>
                    </div>
                 </div>
               </div>

               <div className="text-right">
                  <p className={`text-sm font-black ${overdue ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(ev.totalValueCents)}</p>
                  <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${overdue ? 'text-red-500' : 'text-zinc-600'}`}>
                    {ev.status}
                  </p>
               </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800/50">
               <MapPin className="w-3 h-3 text-zinc-600" />
               <span className="text-[10px] text-zinc-500 truncate font-medium">{ev.location}</span>
            </div>
          </div>
        );
      })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-[40px] md:rounded-[40px] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight">Novo Show</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white p-2 bg-zinc-900 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleAddEvent} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Contratante</label>
                <input type="text" value={contractorName} onChange={e => setContractorName(e.target.value)} required placeholder="Ex: Casamento João"
                  className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white font-bold focus:ring-2 focus:ring-[#FF169B]/50 focus:outline-none transition-all placeholder:text-zinc-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Data</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                    className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white font-bold" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Horário</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} required
                    className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white font-bold" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Valor (R$)</label>
                <input type="text" value={value} onChange={e => setValue(e.target.value)} required placeholder="R$ 0,00"
                  className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white font-bold placeholder:text-zinc-800" />
              </div>
              <button type="submit" className="w-full h-16 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-pink-900/20 active:scale-[0.97] transition-all">Agendar Show</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
