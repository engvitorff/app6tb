import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Trash2, 
  Wallet, 
  Filter, 
  X,
  Loader2,
  Calendar,
  Tag
} from 'lucide-react';
import { formatCurrency, parseCurrencyInput } from '../utils/currency';
import * as api from '../services/api';
import { Transaction } from '../services/api';

export const Extrato = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal states
  const [type, setType] = useState<'IN' | 'OUT'>('OUT');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const categoriesIn = ['Reposição de Caixa', 'Rendimento', 'Outros'];
  const categoriesOut = ['Compra de Equipamentos', 'Antecipação de Cachê', 'Despesas Operacionais', 'Manutenção', 'Outros'];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    transactions.forEach(t => yearsSet.add(t.date.split('-')[0]));
    yearsSet.add(new Date().getFullYear().toString());
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const [y, m] = t.date.split('-');
      const matchYear = y === filterYear;
      const matchMonth = filterMonth === 'all' || m === filterMonth;
      return matchYear && matchMonth;
    });
  }, [transactions, filterMonth, filterYear]);

  const metrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    
    // Calcula o saldo global independentemente do filtro
    let globalBalance = 0;
    transactions.forEach(t => {
      if (t.type === 'IN') globalBalance += t.amountCents;
      else globalBalance -= t.amountCents;
    });

    // Filtra para os totais de entrada e saída do mês selecionado
    filteredTransactions.forEach(t => {
      if (t.type === 'IN') totalIn += t.amountCents;
      else totalOut += t.amountCents;
    });

    return { totalIn, totalOut, globalBalance };
  }, [filteredTransactions, transactions]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTransaction({
        description,
        amountCents: parseCurrencyInput(amount),
        type,
        category: category || (type === 'IN' ? categoriesIn[0] : categoriesOut[0]),
        date
      });
      
      setIsModalOpen(false);
      setDescription('');
      setAmount('');
      setCategory('');
      fetchData();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o lançamento "${desc}"?`)) return;
    try {
      await api.deleteTransaction(id, desc);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  return (
    <div className="p-6 pb-24">
      <div className="flex justify-between items-center mb-8 px-1">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Extrato</h1>
          <p className="text-zinc-500 font-medium tracking-wide">Movimentações Extracurriculares.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-[#FF169B] to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-900/30 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 rounded-3xl p-5 mb-6 shadow-sm overflow-hidden relative group">
         <Wallet className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/10 group-hover:scale-110 transition-transform" />
         <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Saldo Consolidado do Extrato</p>
         <h2 className="text-3xl font-black text-white tracking-tighter mb-4">{formatCurrency(metrics.globalBalance)}</h2>
         
         <div className="grid grid-cols-2 gap-4 border-t border-indigo-500/20 pt-4 relative z-10">
            <div>
               <p className="text-emerald-500/70 text-[9px] uppercase font-bold tracking-widest mb-1 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> Entradas</p>
               <p className="text-sm font-bold text-emerald-400">{formatCurrency(metrics.totalIn)}</p>
            </div>
            <div>
               <p className="text-red-500/70 text-[9px] uppercase font-bold tracking-widest mb-1 flex items-center"><ArrowDownRight className="w-3 h-3 mr-1" /> Saídas</p>
               <p className="text-sm font-bold text-red-400">{formatCurrency(metrics.totalOut)}</p>
            </div>
         </div>
      </div>

      <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 mb-6 flex space-x-2 backdrop-blur-sm sticky top-4 z-20 overflow-x-auto no-scrollbar">
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="bg-zinc-950/50 text-white text-[10px] font-black uppercase rounded-xl px-3 py-2 border border-zinc-800 focus:outline-none">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-zinc-950/50 text-white text-[10px] font-black uppercase rounded-xl px-3 py-2 border border-zinc-800 flex-1 focus:outline-none">
          <option value="all">Todos os meses</option>
          {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m) => (
            <option key={m} value={m}>{new Date(2000, parseInt(m)-1, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
          ))}
        </select>
      </section>

      <div className="space-y-3">
         {isLoading ? (
           <div className="flex flex-col items-center justify-center py-20 animate-pulse">
             <Loader2 className="w-8 h-8 text-[#FF169B] animate-spin mb-3" />
             <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Carregando extrato...</p>
           </div>
         ) : filteredTransactions.length === 0 ? (
           <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
             <p className="text-zinc-500 text-sm font-medium italic">Nenhuma transação encontrada no período.</p>
           </div>
         ) : (
           filteredTransactions.map(tx => (
             <div key={tx.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-zinc-700 transition-colors">
                <div className="flex items-center space-x-3 overflow-hidden">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tx.type === 'IN' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      {tx.type === 'IN' ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-red-400" />}
                   </div>
                   <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{tx.description}</p>
                      <div className="flex items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 space-x-2">
                         <span className="flex items-center"><Calendar className="w-2.5 h-2.5 mr-1" />{tx.date.split('-').reverse().join('/')}</span>
                         <span className="flex items-center truncate"><Tag className="w-2.5 h-2.5 mr-1" />{tx.category}</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex flex-col items-end shrink-0 pl-2">
                   <span className={`text-sm font-black ${tx.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                     {tx.type === 'IN' ? '+' : '-'}{formatCurrency(tx.amountCents)}
                   </span>
                   <button 
                     onClick={() => handleDelete(tx.id, tx.description)}
                     className="text-zinc-600 hover:text-red-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                      <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
             </div>
           ))
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-[40px] md:rounded-[40px] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white tracking-tight">Nova Transação</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white p-2 bg-zinc-900 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                 <button type="button" onClick={() => setType('IN')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${type === 'IN' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-white'}`}>Entrada</button>
                 <button type="button" onClick={() => setType('OUT')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${type === 'OUT' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-zinc-500 hover:text-white'}`}>Saída</button>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Descrição</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} required placeholder={`Ex: ${type === 'IN' ? 'Repasse de equipamento' : 'Compra de cabo P10'}`}
                  className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white font-bold focus:ring-2 focus:ring-[#FF169B]/50 outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Data</label>
                   <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                     className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white font-bold outline-none [color-scheme:dark]" />
                 </div>
                 <div>
                   <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Valor</label>
                   <input type="text" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="R$ 0,00"
                     className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white font-bold focus:ring-2 focus:ring-[#FF169B]/50 outline-none" />
                 </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Categoria</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  required
                  className="w-full h-14 mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 text-white font-bold focus:ring-2 focus:ring-[#FF169B]/50 outline-none appearance-none"
                >
                   <option value="" disabled>Selecione uma categoria...</option>
                   {(type === 'IN' ? categoriesIn : categoriesOut).map(cat => (
                     <option key={cat} value={cat}>{cat}</option>
                   ))}
                </select>
              </div>

              <button type="submit" className={`w-full h-14 mt-2 font-black uppercase tracking-widest rounded-2xl transition-transform active:scale-[0.98] ${type === 'IN' ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' : 'bg-red-500 text-white hover:bg-red-400'}`}>
                 Registrar {type === 'IN' ? 'Entrada' : 'Saída'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
