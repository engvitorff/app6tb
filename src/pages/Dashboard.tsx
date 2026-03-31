import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Users2,
  Filter,
  ChevronRight,
  Clock,
  Calendar,
  Building2,
  MapPin,
  Music
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '../utils/currency';
import * as api from '../services/api';
import { Loader2 } from 'lucide-react';
import { EventShow } from '../data/mocks';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventShow[]>([]);
  const [musicians, setMusicians] = useState<any[]>([]);
  const [bandProfile, setBandProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, musiciansData, bandData] = await Promise.all([
        api.getEvents(),
        api.getMusicians(),
        api.getBandProfile()
      ]);
      setEvents(eventsData);
      setMusicians(musiciansData);
      setBandProfile(bandData);
    } catch (error) {
      console.error('Erro ao buscar dados da dashboard:', error);
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
    return events.filter(ev => {
      const [year, month] = ev.date.split('-');
      const matchYear = year === filterYear;
      const matchMonth = filterMonth === 'all' || month === filterMonth;
      const matchStatus = filterStatus === 'all' || ev.status === filterStatus;
      return matchYear && matchMonth && matchStatus;
    });
  }, [events, filterYear, filterMonth, filterStatus]);

  const metrics = useMemo(() => {
    let totalBruto = 0;
    let totalCaixinha = 0;
    let totalDespesas = 0;
    let totalFreela = 0;

    filteredEvents.forEach(ev => {
      totalBruto += ev.totalValueCents;
      
      const custoOperacional = ev.operationalExpensesCents + (ev.customExpenseCents || 0);
      totalDespesas += custoOperacional;

      // Calcular custos de freelancers separadamente dos sócios
      const custosFreelas = (ev.scheduledMusicians || []).reduce((acc, m) => {
        const mus = musicians.find(ms => ms.id === m.musicianId);
        return (mus?.role === 'Freelancer') ? acc + (m.feeOverrideCents || 0) : acc;
      }, 0);
      totalFreela += custosFreelas;

      // Lógica de Caixinha / Divisão (Rateio Automático)
      if (ev.isBandFundAuto) {
        const lucroShow = ev.totalValueCents - custoOperacional - custosFreelas;
        const numSocios = (ev.scheduledMusicians || []).filter(m => {
          const mus = musicians.find(ms => ms.id === m.musicianId);
          return mus?.role === 'Sócio';
        }).length;
        
        const numCotistas = numSocios + 1; // Sócios + 1 para o Caixa
        const cotaAuto = numCotistas > 0 ? Math.floor(lucroShow / numCotistas) : 0;
        totalCaixinha += cotaAuto;
      } else {
        totalCaixinha += ev.bandFundCents;
      }
    });

    const totalLucroEstimado = totalBruto - totalDespesas - totalFreela - totalCaixinha;

    return {
      totalBruto,
      totalCaixinha,
      totalDespesas,
      totalFreela,
      totalLucroEstimado
    };
  }, [filteredEvents, musicians]);

  const pieData = [
    { name: 'Sócio', value: metrics.totalLucroEstimado, color: '#FF169B' },
    { name: 'Freela', value: metrics.totalFreela, color: '#34d399' },
    { name: 'Custo', value: metrics.totalDespesas, color: '#f87171' },
    { name: 'Caixa', value: metrics.totalCaixinha, color: '#818cf8' },
  ].filter(d => d.value > 0);

  const chartData = useMemo(() => {
     if (filterMonth !== 'all') {
        return [{ name: months.find(m => m.value === filterMonth)?.label || '', receitas: metrics.totalBruto, despesas: metrics.totalDespesas + metrics.totalFreela }];
     }
     
     // Agrupar por mes se filterMonth for 'all'
     const dataMap: Record<string, any> = {};
     months.slice(1).forEach(m => {
       dataMap[m.value] = { name: m.label.substring(0,3), receitas: 0, despesas: 0 };
     });

     events.filter(ev => ev.date.startsWith(filterYear)).forEach(ev => {
       const m = ev.date.split('-')[1];
       if (dataMap[m]) {
         dataMap[m].receitas += ev.totalValueCents;
         dataMap[m].despesas += (ev.operationalExpensesCents + (ev.customExpenseCents || 0) + (ev.scheduledMusicians || []).reduce((acc, ms) => acc + (ms.feeOverrideCents || 0), 0));
       }
     });

     return Object.values(dataMap);
  }, [events, filterYear, filterMonth, metrics]);

  return (
    <div className="p-6 pb-24">
      <header className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Olá, {bandProfile?.repName?.split(' ')[0] || 'Músico'}!</h1>
            <p className="text-zinc-500 text-sm">Controle financeiro e análise de dados.</p>
          </div>
          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
             <span className="text-xs font-bold text-[#FF169B] uppercase">{bandProfile?.name?.substring(0,2)}</span>
          </div>
        </div>
      </header>

      {/* Barra de Filtros Estilo Glassmorphism */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 mb-8 flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3 backdrop-blur-sm sticky top-4 z-20">
        <div className="flex items-center space-x-2 bg-zinc-950/50 rounded-2xl px-3 py-2 border border-zinc-800 flex-1">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select 
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-transparent text-white text-xs font-bold focus:outline-none w-full"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <select 
          value={filterMonth} 
          onChange={(e) => setFilterMonth(e.target.value)}
          className="bg-zinc-950/50 text-white text-xs font-bold rounded-2xl px-4 py-2 border border-zinc-800 focus:outline-none flex-1 appearance-none"
        >
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-zinc-950/50 text-white text-xs font-bold rounded-2xl px-4 py-2 border border-zinc-800 focus:outline-none flex-1 appearance-none"
        >
          <option value="all">Filtro: Todos Status</option>
          <option value="Pago">Recebidos</option>
          <option value="A receber">Pendentes</option>
        </select>
      </section>

      {/* Seção MERCADO PAGO (Saldo Real) */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 ml-1">Monitoramento Mercado Pago</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl p-5 shadow-lg shadow-blue-900/20 relative overflow-hidden group">
            <Wallet className="absolute -right-4 -bottom-4 w-20 h-20 text-white opacity-10 group-hover:scale-110 transition-transform" />
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-0.5">Conta Corrente</p>
            <h2 className="text-2xl font-black text-white">{formatCurrency(0)}</h2>
            <span className="text-[9px] text-blue-200 mt-1 block">(Aguardando API)</span>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-3xl p-5 shadow-lg shadow-indigo-900/20 relative overflow-hidden group">
            <PiggyBank className="absolute -right-4 -bottom-4 w-20 h-20 text-white opacity-10 group-hover:scale-110 transition-transform" />
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider mb-0.5">Caixa da Banda</p>
            <h2 className="text-2xl font-black text-white">{formatCurrency(metrics.totalCaixinha)}</h2>
            <span className="text-[9px] text-indigo-200 mt-1 block">Saldo Previsto</span>
          </div>
        </div>
      </section>

      {/* Seção RESULTADOS FILTRADOS (App) */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 ml-1">Resumo Financeiro (App)</h3>
        
        {/* Card de Conciliação Bancária */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                 <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-white font-bold text-sm">Conciliação</h4>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${metrics.totalLucroEstimado === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
              {metrics.totalLucroEstimado === 0 ? 'Concluída' : 'Divergência'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-4">
             <div>
                <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mb-1">M. Pago Real</p>
                <p className="text-lg font-bold text-white tracking-tight">{formatCurrency(metrics.totalCaixinha)}</p>
             </div>
             <div className="text-right">
                <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mb-1">Caixa Previsto App</p>
                <p className="text-lg font-bold text-[#FF169B] tracking-tight">{formatCurrency(metrics.totalCaixinha)}</p>
             </div>
          </div>
          
          {metrics.totalCaixinha > metrics.totalCaixinha && (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500 w-[5%] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <div className="h-full bg-red-500/30 w-full"></div>
              </div>
              <p className="text-[9px] text-red-400 font-bold mt-2 flex items-center space-x-1">
                 <span>Divergência: {formatCurrency(0)} vinculada aos filtros atuais.</span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mb-1">Entradas Brutas</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(metrics.totalBruto)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mb-1">Pagamento Sócios</p>
            <p className="text-lg font-bold text-purple-400">{formatCurrency(metrics.totalLucroEstimado)}</p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mb-1">Pagamento Freelancers</p>
          <p className="text-lg font-bold text-amber-500">{formatCurrency(metrics.totalFreela)}</p>
        </div>
      </section>

      {/* Análise Gráfica */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
           <h3 className="text-white font-bold text-sm mb-6 flex items-center space-x-2">
             <Users2 className="w-4 h-4 text-[#FF169B]" />
             <span>Divisão de Custos (Filtrado)</span>
           </h3>
           <div className="h-48 relative">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} 
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Valor']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl text-zinc-600 text-[10px] uppercase font-bold">Sem dados no período</div>
              )}
           </div>
           <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center space-x-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span>{d.name}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
           <h3 className="text-white font-bold text-sm mb-6 flex items-center space-x-2">
             <Calendar className="w-4 h-4 text-blue-400" />
             <span>Evolução Financeira</span>
           </h3>
           <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} 
                    formatter={(value: any) => [formatCurrency(Number(value) || 0)]}
                  />
                  <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={10} />
                  <Bar dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </section>

    </div>
  );
};
