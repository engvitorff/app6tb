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
  Circle,
  X
} from 'lucide-react';
import * as api from '../services/api';
import { EventShow } from '../data/mocks';
import { formatCurrency } from '../utils/currency';

export const Home = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventShow[]>([]);
  const [bandProfile, setBandProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
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
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, fullDate: null });
    }
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

  // Helper para calcular posição do Gantt (0-23h)
  const calculateGanttPos = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return ((h + m / 60) / 24) * 100;
  };

  const formatDateBRLong = (dateStr: string) => {
     const [y, m, d] = dateStr.split('-');
     return `${d}/${m}/${y}`;
  };

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

        {/* Card Perfil da Banda */}
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
              <button onClick={() => changeMonth(-1)} className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => changeMonth(1)} className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 backdrop-blur-sm shadow-xl">
           <div className="grid grid-cols-7 mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-zinc-600 py-2">{d}</div>
              ))}
           </div>
           
           <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dateObj, idx) => {
                const dayEvents = getEventsForDay(dateObj.fullDate);
                const hasEvents = dayEvents.length > 0;
                const isToday = dateObj.fullDate === new Date().toISOString().split('T')[0];
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => dateObj.fullDate && setSelectedDate(dateObj.fullDate)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative cursor-pointer active:scale-95 ${
                      dateObj.day ? 'bg-zinc-950/30 hover:bg-zinc-800/50' : ''
                    } ${isToday ? 'border border-[#FF169B]' : ''} ${selectedDate === dateObj.fullDate ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''}`}
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

      {/* MODAL: Resumo do Dia (Gantt-Style) */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
           <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-xl font-bold text-white">Resumo do Dia</h2>
                    <p className="text-zinc-500 text-xs mt-0.5 font-medium">{formatDateBRLong(selectedDate)}</p>
                 </div>
                 <button onClick={() => setSelectedDate(null)} className="text-zinc-400 hover:text-white p-2 bg-zinc-900 rounded-full">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              {/* Linha do Tempo (Gantt-Style) */}
              <div className="mb-8">
                 <div className="relative h-48 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 overflow-hidden">
                    {/* Eixo de Tempo (Labels) */}
                    <div className="flex justify-between absolute bottom-1 left-4 right-4 text-[9px] font-black text-zinc-700 tracking-tighter uppercase">
                       <span>08h</span><span>12h</span><span>16h</span><span>20h</span><span>00h</span><span>04h</span>
                    </div>

                    {/* Linha de Referência de Hora Atual (se for hoje) */}
                    {selectedDate === new Date().toISOString().split('T')[0] && (
                       <div className="absolute top-0 bottom-6 w-[1px] bg-white/20 z-10" style={{ left: `${calculateGanttPos(new Date().getHours() + ":" + new Date().getMinutes())}%` }}></div>
                    )}

                    {/* Gráfico de Barras - Cada show é uma linha */}
                    <div className="space-y-3 mt-2 pr-6">
                       {getEventsForDay(selectedDate).length === 0 ? (
                         <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] uppercase font-bold tracking-widest py-10 italic">Nenhum show marcado</div>
                       ) : (
                         getEventsForDay(selectedDate).sort((a,b) => (a.time || '').localeCompare(b.time || '')).map((ev, i) => {
                            const startPercent = calculateGanttPos(ev.time || '00:00');
                            const durationPercent = 16; // Assumindo show de 4h para visualização (4/24 * 100)
                            
                            return (
                               <div key={ev.id} className="relative h-10 group" onClick={() => navigate(`/eventos/${ev.id}`)}>
                                  <div 
                                    className="absolute h-full bg-gradient-to-r from-[#FF169B] to-purple-600 rounded-xl flex items-center px-3 shadow-lg shadow-pink-900/10 cursor-pointer overflow-hidden group-hover:opacity-90 transition-all border border-white/10"
                                    style={{ left: `${startPercent}%`, width: `${durationPercent}%` }}
                                  >
                                     <span className="text-[10px] font-black text-white truncate drop-shadow-md">{ev.contractorName}</span>
                                  </div>
                               </div>
                            );
                         })
                       )}
                    </div>
                 </div>
              </div>

              {/* Lista Detalhada */}
              <div className="max-h-40 overflow-y-auto space-y-3 pr-1">
                 {getEventsForDay(selectedDate).map(ev => (
                    <div key={ev.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                       <div className="min-w-0">
                          <p className="text-white text-xs font-bold truncate pr-2">{ev.contractorName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                             <Clock className="w-3 h-3 text-zinc-500" />
                             <span className="text-[10px] text-zinc-400 font-medium">{ev.time || '--:--'}</span>
                          </div>
                       </div>
                       <span className="text-[10px] font-black text-emerald-400 whitespace-nowrap bg-emerald-400/10 px-2 py-1 rounded-md">{formatCurrency(ev.totalValueCents)}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

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
