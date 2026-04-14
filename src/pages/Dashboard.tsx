import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
  Music,
  Link2
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
  const [transactions, setTransactions] = useState<api.Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mercado Pago States
  const [isMpLinked, setIsMpLinked] = useState(false);
  const [isLinkingMp, setIsLinkingMp] = useState(false);
  const [mpRealBalance, setMpRealBalance] = useState(0);
  
  // Filtros
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, musiciansData, bandData, txData, mpIntegrationStatus, mpBalanceData] = await Promise.all([
        api.getEvents(),
        api.getMusicians(),
        api.getBandProfile(),
        api.getTransactions(),
        api.getMercadoPagoIntegration(),
        api.getMercadoPagoBalance()
      ]);
      setEvents(eventsData);
      setMusicians(musiciansData);
      setBandProfile(bandData);
      setTransactions(txData);
      setIsMpLinked(mpIntegrationStatus);
      setMpRealBalance(mpBalanceData);
    } catch (error) {
      console.error('Erro ao buscar dados da dashboard:', error);
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
          // Redirecionar para cadastro se for primeiro acesso (sem nome)
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

    let extratoBalanceFiltered = 0;
    let extratoInFiltered = 0;
    let extratoOutFiltered = 0;
    transactions.forEach(tx => {
      const [txYear, txMonth] = tx.date.split('-');
      const matchYear = txYear === filterYear;
      const matchMonth = filterMonth === 'all' || txMonth === filterMonth;
      if (matchYear && matchMonth) {
         if (tx.type === 'IN') {
           extratoBalanceFiltered += tx.amountCents;
           extratoInFiltered += tx.amountCents;
         } else {
           extratoBalanceFiltered -= tx.amountCents;
           extratoOutFiltered += tx.amountCents;
         }
      }
    });

    // O Caixa Previsto App do Dashboard agora soma a retenção dos shows com o extrato
    const totalCaixinhaGeral = totalCaixinha + extratoBalanceFiltered;

    const totalLucroEstimado = totalBruto - totalDespesas - totalFreela - totalCaixinha;

    return {
      totalBruto,
      totalCaixinha: totalCaixinhaGeral,
      totalDespesas,
      totalFreela,
      totalLucroEstimado,
      extratoBalanceFiltered,
      extratoInFiltered,
      extratoOutFiltered
    };
  }, [filteredEvents, musicians, transactions, filterYear, filterMonth]);

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

  const displayUserName = currentUser?.user_metadata?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Músico';

  return (
    <div className="p-6 pb-24">
      <header className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 uppercase tracking-tighter">Olá, {displayUserName}!</h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Resumo da sua agenda.</p>
          </div>
          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
             <span className="text-xs font-bold text-[#FF169B] uppercase">{displayUserName.substring(0,2)}</span>
          </div>
        </div>
      </header>

      {/* Barra de Filtros Estilo Glassmorphism */}
      {/* Barra de Filtros Compacta */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 mb-6 flex space-x-2 backdrop-blur-sm sticky top-4 z-20 overflow-x-auto no-scrollbar">
        <select 
          value={filterYear} 
          onChange={(e) => setFilterYear(e.target.value)}
          className="bg-zinc-950/50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-2 border border-zinc-800 focus:outline-none appearance-none min-w-[70px] text-center"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select 
          value={filterMonth} 
          onChange={(e) => setFilterMonth(e.target.value)}
          className="bg-zinc-950/50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-2 border border-zinc-800 focus:outline-none appearance-none flex-1 min-w-[100px] text-center"
        >
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-zinc-950/50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-2 border border-zinc-800 focus:outline-none appearance-none flex-1 min-w-[120px] text-center"
        >
          <option value="all">Status: Todos</option>
          <option value="Recebido">Recebidos</option>
          <option value="A receber">Pendentes</option>
        </select>
      </section>

      {/* Seção MERCADO PAGO (Saldo Real) */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Monitoramento Mercado Pago</h3>
          {!isMpLinked && (
            <button 
              onClick={() => {
                const clientId = import.meta.env.VITE_MP_CLIENT_ID;
                if (!clientId) {
                  alert('O VITE_MP_CLIENT_ID não está configurado no arquivo .env. Certifique-se de adicioná-lo para realizar o vínculo.');
                  return;
                }
                const redirectUri = window.location.origin + '/';
                window.location.href = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
              }}
              disabled={isLinkingMp}
              className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-full hover:bg-blue-500/20 transition-all flex items-center space-x-1 disabled:opacity-50"
            >
              <Link2 className="w-3 h-3" />
              <span>{isLinkingMp ? 'Vinculando...' : 'Vincular Conta'}</span>
            </button>
          )}
        </div>
        
        {isMpLinked ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl p-5 shadow-lg shadow-blue-900/20 relative overflow-hidden group">
              <Wallet className="absolute -right-4 -bottom-4 w-20 h-20 text-white opacity-10 group-hover:scale-110 transition-transform" />
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-0.5">Conta Corrente</p>
              <h2 className="text-2xl font-black text-white">{formatCurrency(mpRealBalance)}</h2>
              <span className="text-[9px] text-blue-200 mt-1 block">Acesso concedido (Realtime API pendente)</span>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-3xl p-5 shadow-lg shadow-indigo-900/20 relative overflow-hidden group">
              <PiggyBank className="absolute -right-4 -bottom-4 w-20 h-20 text-white opacity-10 group-hover:scale-110 transition-transform" />
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider mb-0.5">Caixa da Banda</p>
              <h2 className="text-2xl font-black text-white">{formatCurrency(0)}</h2>
              <span className="text-[9px] text-indigo-200 mt-1 block">Rendimentos</span>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
               <Wallet className="w-6 h-6 text-blue-500" />
             </div>
             <p className="text-white font-bold text-sm">Integração não configurada</p>
             <p className="text-zinc-500 text-xs mt-1 max-w-[250px]">Vincule sua conta do Mercado Pago para visualizar os saldos bancários reais da sua banda em tempo real.</p>
          </div>
        )}
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
                <p className="text-lg font-bold text-white tracking-tight">{formatCurrency(0)}</p>
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

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 md:p-3 flex flex-col justify-center">
            <p className="text-zinc-500 text-[8px] uppercase font-bold tracking-widest mb-0.5 md:mb-1">Entradas</p>
            <p className="text-xs md:text-sm font-bold text-emerald-400 tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(metrics.totalBruto)}>{formatCurrency(metrics.totalBruto)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 md:p-3 flex flex-col justify-center">
            <p className="text-zinc-500 text-[8px] uppercase font-bold tracking-widest mb-0.5 md:mb-1">Sócios</p>
            <p className="text-xs md:text-sm font-bold text-purple-400 tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(metrics.totalLucroEstimado)}>{formatCurrency(metrics.totalLucroEstimado)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 md:p-3 flex flex-col justify-center">
            <p className="text-zinc-500 text-[8px] uppercase font-bold tracking-widest mb-0.5 md:mb-1">Freelas</p>
            <p className="text-xs md:text-sm font-bold text-amber-500 tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(metrics.totalFreela)}>{formatCurrency(metrics.totalFreela)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
          <div className="bg-zinc-900/50 border border-emerald-500/10 rounded-2xl p-2 md:p-3 flex flex-col justify-center">
            <p className="text-emerald-500/70 text-[8px] uppercase font-bold tracking-widest mb-0.5 flex items-center"><ArrowUpRight className="w-2.5 h-2.5 mr-1" /> Extrato (In)</p>
            <p className="text-xs md:text-sm font-bold text-emerald-400 tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(metrics.extratoInFiltered)}>{formatCurrency(metrics.extratoInFiltered)}</p>
          </div>
          <div className="bg-zinc-900/50 border border-red-500/10 rounded-2xl p-2 md:p-3 flex flex-col justify-center">
            <p className="text-red-500/70 text-[8px] uppercase font-bold tracking-widest mb-0.5 flex items-center"><ArrowDownRight className="w-2.5 h-2.5 mr-1" /> Extrato (Out)</p>
            <p className="text-xs md:text-sm font-bold text-red-400 tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis" title={formatCurrency(metrics.extratoOutFiltered)}>{formatCurrency(metrics.extratoOutFiltered)}</p>
          </div>
        </div>
      </section>

      {/* Análise Gráfica */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
           <h3 className="text-white font-bold text-sm mb-6 flex items-center space-x-2">
             <Users2 className="w-4 h-4 text-[#FF169B]" />
             <span>Divisão de Custos (Filtrado)</span>
           </h3>
           <div className="h-40 relative">
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
           <div className="grid grid-cols-4 gap-1 mt-4">
              {pieData.map((d, i) => (
                <div key={i} className="flex flex-col items-center justify-center space-y-1 text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="truncate w-full text-center">{d.name}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
           <h3 className="text-white font-bold text-sm mb-4 flex items-center space-x-2">
             <Calendar className="w-4 h-4 text-blue-400" />
             <span>Evolução</span>
           </h3>
           <div className="h-40">
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
