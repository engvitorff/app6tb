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
import { supabase } from '../lib/supabase';
import * as api from '../services/api';
import { EventShow } from '../data/mocks';
import { formatCurrency } from '../utils/currency';

export const Home = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventShow[]>([]);
  const [bandProfile, setBandProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, bandData] = await Promise.all([
        api.getEvents(),
        api.getBandProfile()
      ]);
      setEvents(eventsData || []);
      setBandProfile(bandData);
    } catch (error) {
      console.error('Erro ao buscar dados da home:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkFirstAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const metadata = session.user.user_metadata;
        if (!metadata?.full_name || metadata.full_name.trim() === '') {
          navigate('/usuarios', { replace: true });
        }
      }
    };
    
    fetchData();
    checkFirstAccess();
  }, [navigate]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUser(session.user);
    };
    getUser();
  }, []);

  // Shows filtrados pelo mês do calendário
  const filteredEvents = useMemo(() => {
    const calYear = String(currentDate.getFullYear());
    const calMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    return events
      .filter(ev => {
        const [year, month] = ev.date.split('-');
        return year === calYear && month === calMonth;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, currentDate]);

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

  const calculateGanttPos = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return ((h + m / 60) / 24) * 100;
  };

  const displayUserName = currentUser?.user_metadata?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Músico';

  return (
    <div className="p-6 pb-24">
      <header className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Olá, {displayUserName}!</h1>
            <p className="text-zinc-500 text-sm">Resumo da sua agenda.</p>
          </div>
          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
             <span className="text-xs font-bold text-[#FF169B] uppercase">{displayUserName.substring(0,2)}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-[#FF169B]/30 transition-all cursor-pointer" onClick={() => navigate('/usuarios')}>
          <div className="flex items-start justify-between mb-4">
             <div className="flex items-center space-x-3">
               <div className="w-12 h-12 bg-[#FF169B]/10 rounded-full flex items-center justify-center border border-[#FF169B]/20">
                 <Building2 className="w-6 h-6 text-[#FF169B]" />
               </div>
               <div>
                  <h3 className="text-white font-bold">{bandProfile?.name || 'Grupo 6 Tá Bom'}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{bandProfile?.cnpj || '41.955.002/0001-11'}</p>
               </div>
             </div>
             <ChevronRightIcon className="w-5 h-5 text-zinc-700" />
          </div>
          <div className="flex items-center space-x-2 text-xs text-zinc-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{bandProfile?.city || 'ANÁPOLIS/GO'}</span>
          </div>
        </div>
      </header>



      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
           <h3 className="text-sm font-bold text-white flex items-center space-x-2">
             <CalendarIcon className="w-4 h-4 text-[#FF169B]" />
             <span>Agenda {new Date(currentDate).toLocaleString('pt-BR', { month: 'long' })}</span>
           </h3>
           <div className="flex items-center space-x-2">
              <button onClick={() => changeMonth(-1)} className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => changeMonth(1)} className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
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
                  <div key={idx} onClick={() => dateObj.fullDate && setSelectedDate(dateObj.fullDate)} className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative cursor-pointer ${dateObj.day ? 'bg-zinc-950/30 hover:bg-zinc-800/50' : ''} ${isToday ? 'border border-[#FF169B]' : ''} ${selectedDate === dateObj.fullDate ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''}`}>
                    <span className={`text-xs ${dateObj.day ? 'text-zinc-300' : 'text-zinc-800'} ${isToday ? 'text-white font-bold' : ''}`}>{dateObj.day}</span>
                    {hasEvents && (
                      <div className="flex items-center justify-center mt-0.5 space-x-0.5">
                        {dayEvents.map((_, i) => <Circle key={i} className="w-1 h-1 fill-[#FF169B] text-[#FF169B]" />)}
                      </div>
                    )}
                  </div>
                );
              })}
           </div>
        </div>
      </section>

      {selectedDate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
           <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-xl font-bold text-white">Resumo do Dia</h2>
                    <p className="text-zinc-500 text-xs mt-0.5 font-medium">{selectedDate.split('-').reverse().join('/')}</p>
                 </div>
                 <button onClick={() => setSelectedDate(null)} className="text-zinc-400 hover:text-white p-2 bg-zinc-900 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="mb-8">
                 <div className="relative h-48 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 overflow-hidden">
                    <div className="flex justify-between absolute bottom-1 left-4 right-4 text-[9px] font-black text-zinc-700 tracking-tighter uppercase">
                       <span>08h</span><span>12h</span><span>16h</span><span>20h</span><span>00h</span><span>04h</span>
                    </div>
                    <div className="space-y-4 mt-2 pr-6">
                       {getEventsForDay(selectedDate).sort((a,b) => (a.time || '').localeCompare(b.time || '')).map((ev) => {
                            const startPercent = calculateGanttPos(ev.time || '00:00');
                            const durationPercent = 12.5; // 3h standard
                            return (
                               <div key={ev.id} className="relative h-12 group" onClick={() => navigate(`/eventos/${ev.id}`)}>
                                  <div className="absolute h-full bg-gradient-to-br from-[#FF169B] to-purple-600 rounded-2xl flex items-center px-4 shadow-lg cursor-pointer overflow-hidden group-hover:scale-[1.02] transition-all border border-white/20" style={{ left: `${startPercent}%`, width: `${durationPercent}%`, minWidth: '100px' }}>
                                     <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-black text-white truncate leading-tight">{ev.contractorName}</span>
                                        <span className="text-[8px] font-bold text-white/70">{ev.time}</span>
                                     </div>
                                  </div>
                               </div>
                            );
                         })}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Shows Filtrados</h2>
          <Link to="/eventos" className="text-[#FF169B] text-xs font-bold font-black uppercase tracking-widest">Ver Todos</Link>
        </div>

        <div className="space-y-4">
          {filteredEvents.length === 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-10 text-zinc-500 text-sm text-center italic">Nenhum show encontrado no período.</div>
          )}
          {filteredEvents.slice(0, 5).map((event) => {
            const evDate = new Date(event.date + 'T12:00:00');
            const yesterday = new Date();
            yesterday.setHours(0,0,0,0);
            const overdue = event.status === 'A receber' && evDate < yesterday;

            return (
            <div key={event.id} onClick={() => navigate(`/eventos/${event.id}`)} className={`bg-zinc-900 border ${overdue ? 'border-red-500 bg-red-500/10' : 'border-zinc-800'} rounded-2xl p-4 shadow-sm flex items-center justify-between hover:bg-zinc-800/50 active:scale-95 transition-all cursor-pointer group relative overflow-hidden`}>
              {overdue && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg z-10 animate-pulse">Atrasado</div>
              )}
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${overdue ? 'bg-red-500' : 'bg-zinc-800'} rounded-xl flex flex-col items-center justify-center border ${overdue ? 'border-red-400' : 'border-zinc-700'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${overdue ? 'text-white' : 'text-[#FF4DB8]'} leading-none`}>{(new Date(event.date + 'T12:00:00').toLocaleString('pt-BR', { month: 'short' })).replace('.', '').toUpperCase()}</span>
                  <span className={`text-lg font-black leading-none ${overdue ? 'text-white' : 'text-zinc-100'}`}>{event.date.split('-')[2]}</span>
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${overdue ? 'text-red-100' : 'text-white'} truncate max-w-[140px] group-hover:text-[#FF169B] transition-colors`}>{event.contractorName}</h4>
                  <div className="flex items-center space-x-2 mt-0.5 text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold">{event.time || '--:--'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${overdue ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(event.totalValueCents)}</p>
                <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${overdue ? 'text-red-500' : 'text-zinc-500'}`}>{event.status}</p>
              </div>
            </div>
          );})}
        </div>
      </section>
    </div>
  );
};
