import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Building2, 
  Music,
  ChevronRight as ChevronRightIcon,
  Circle
} from 'lucide-react';
import * as api from '../services/api';
import { EventShow } from '../data/mocks';
import { formatCurrency } from '../utils/currency';

export const Home = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventShow[]>([]);
  const [bandProfile, setBandProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calendário State
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, bandData] = await Promise.all([
        api.getEvents(),
        api.getBandProfile()
      ]);
      setEvents(eventsData);
      setBandProfile(bandData);
    } catch (error) {
      console.error('Erro ao buscar dados da home:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Lógica do Calendário ---
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    
    const days = [];
    // Dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, fullDate: null });
    }
    // Dias do mês
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, fullDate: dateStr });
    }
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const getEventsForDay = (dateStr: string | null) => {
    if (!dateStr) return [];
    return events.filter(ev => ev.date === dateStr);
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="p-6 pb-24">
      {/* Bloco 1: Perfil e Header */}
      <header className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Olá, {bandProfile?.repName?.split(' ')[0] || 'VÍTOR'}!</h1>
            <p className="text-zinc-500 text-sm">Resumo da sua agenda.</p>
          </div>
          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
             <span className="text-xs font-bold text-[#FF169B] uppercase">{bandProfile?.name?.substring(0,2) || 'GR'}</span>
          </div>
        </div>

        {/* Card Perfil da Banda (Original Bloco 1) */}
        <div 
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-[#FF169B]/30 transition-all cursor-pointer" 
          onClick={() => navigate('/usuarios')}
        >
          <div className="flex items-start justify-between mb-4">
             <div className="flex items-center space-x-3">
               <div className="w-12 h-12 bg-[#FF169B]/10 rounded-full flex items-center justify-center border border-[#FF169B]/20">
                 <Building2 className="w-6 h-6 text-[#FF169B]" />
               </div>
               <div>
                  <h3 className="text-white font-bold">{bandProfile?.name || 'Grupo 6 Tá Bom'}</h3>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{bandProfile?.cnpj || '41.955.002/0001-11'}</p>
               </div>
             </div>
             <ChevronRightIcon className="w-5 h-5 text-zinc-700 group-hover:text-[#FF169B] transition-colors" />
          </div>
          <div className="flex items-center space-x-2 text-xs text-zinc-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{bandProfile?.city || 'ANÁPOLIS/GO'}</span>
          </div>
          <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] rotate-12 group-hover:opacity-[0.06] transition-opacity">
             <Music className="w-40 h-40 text-white" />
          </div>
        </div>
      </header>

      {/* NOVO: Calendário de Shows */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
           <h3 className="text-sm font-bold text-white flex items-center space-x-2">
             <CalendarIcon className="w-4 h-4 text-[#FF169B]" />
             <span>Agenda {monthNames[currentDate.getMonth()]}</span>
           </h3>
           <div className="flex items-center space-x-2">
              <button 
                onClick={() => changeMonth(-1)}
                className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => changeMonth(1)}
                className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 backdrop-blur-sm shadow-xl">
           {/* Grid Dias da Semana */}
           <div className="grid grid-cols-7 mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-zinc-600 py-2">{d}</div>
              ))}
           </div>
           
           {/* Grid Dias do Mês */}
           <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dateObj, idx) => {
                const dayEvents = getEventsForDay(dateObj.fullDate);
                const hasEvents = dayEvents.length > 0;
                const isToday = dateObj.fullDate === new Date().toISOString().split('T')[0];
                
                return (
                  <div 
                    key={idx} 
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative ${
                      dateObj.day ? 'bg-zinc-950/30' : ''
                    } ${isToday ? 'border border-[#FF169B]/50' : ''}`}
                  >
                    <span className={`text-xs ${dateObj.day ? 'text-zinc-300' : 'text-zinc-800'} ${isToday ? 'text-white font-bold' : ''}`}>
                      {dateObj.day}
                    </span>
                    {hasEvents && (
                      <div className="flex flex-wrap items-center justify-center mt-0.5 space-x-0.5">
                        {dayEvents.map((_, i) => (
                           <Circle key={i} className={`w-1 h-1 fill-[#FF169B] text-[#FF169B]`} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
           </div>
        </div>
      </section>

      {/* Bloco 2: Shows do Período */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Shows Próximos</h2>
          <Link to="/eventos" className="text-[#FF169B] text-xs font-bold uppercase tracking-wider hover:opacity-80">Ver Todos</Link>
        </div>

        <div className="space-y-4">
          {events.length === 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-8 text-center text-zinc-500 text-sm italic">
              Nenhum show agendado no momento.
            </div>
          )}
          {events.filter(ev => {
             // Só mostra do mês atual em diante
             const evDate = new Date(ev.date + 'T12:00:00');
             const now = new Date();
             now.setDate(1); // Inicio do mês atual
             now.setHours(0,0,0,0);
             return evDate >= now;
          }).slice(0, 5).map((event) => (
            <div 
              key={event.id}
              onClick={() => navigate(`/eventos/${event.id}`)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:bg-zinc-800/50 transition-all cursor-pointer active:scale-95 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex flex-col items-center justify-center border border-zinc-700 group-hover:border-[#FF169B]/30 transition-colors">
                  <span className="text-[10px] font-bold text-[#FF169B] leading-none uppercase">{(new Date(event.date + 'T12:00:00').toLocaleString('pt-BR', { month: 'short' })).replace('.', '')}</span>
                  <span className="text-lg font-bold text-white leading-none">{(event.date.split('-')[2])}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white truncate max-w-[140px] group-hover:text-[#FF169B] transition-colors">{event.contractorName}</h4>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span className="text-xs text-zinc-500">{event.time || '--:--'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">{formatCurrency(event.totalValueCents)}</p>
                <div className="flex items-center justify-end space-x-1 mt-0.5">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${event.status === 'Pago' ? 'text-emerald-500' : 'text-zinc-500'}`}>{event.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
