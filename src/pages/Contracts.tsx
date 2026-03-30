import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Calendar, MapPin, Building2, ArrowRight, SearchX, Trash2, Edit3, Filter, Loader2 } from 'lucide-react';
import { IssuedContract } from '../data/mocks';
import { formatCurrency } from '../utils/currency';
import * as api from '../services/api';

export const Contracts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [contracts, setContracts] = useState<IssuedContract[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchContracts = async (eventIdFilter?: string) => {
    try {
      setIsLoading(true);
      const loaded = await api.getIssuedContracts();
      setContracts(loaded);

      if (eventIdFilter) {
        const found = loaded.find(c => c.eventId === eventIdFilter);
        if (found) setSearch(found.contractorName);
      }
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eventIdFilter = params.get('eventId') || undefined;
    fetchContracts(eventIdFilter);
  }, [location]);

  const handleClearAll = async () => {
    if (confirm('Deseja apagar TODO o histórico de contratos emitidos (Nuvem)?')) {
      try {
        // Deleta cada contrato do Supabase
        await Promise.all(contracts.map(c => api.deleteIssuedContract(c.eventId)));
        setContracts([]);
      } catch (error) {
        alert('Erro ao limpar contratos no banco online.');
      }
    }
  };

  const handleDeleteOne = async (eventId: string, sequence: number) => {
    if (confirm(`Excluir o contrato #${sequence.toString().padStart(3, '0')} definitivamente (Nuvem)?`)) {
      try {
        await api.deleteIssuedContract(eventId);
        fetchContracts();
      } catch (error) {
        alert('Erro ao excluir contrato no banco online.');
      }
    }
  };

  const filtered = contracts.filter(c =>
    c.contractorName.toLowerCase().includes(search.toLowerCase()) ||
    c.eventLocation.toLowerCase().includes(search.toLowerCase()) ||
    c.contratanteCnpjCpf.includes(search)
  );

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '—';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatIssuedAt = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Contratos Emitidos</span>
          </h1>
          {contracts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-zinc-600 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-500/10"
              title="Limpar histórico total"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-zinc-500 text-sm">
          {contracts.length === 0
            ? 'Nenhum contrato emitido ainda.'
            : `${contracts.length} contrato${contracts.length > 1 ? 's' : ''} emitido${contracts.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Busca */}
      {contracts.length > 0 && (
        <div className="mb-5 relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por contratante, local ou CNPJ..."
            className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <Filter className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {contracts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <FileText className="w-10 h-10 text-emerald-400/50" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">Nenhum contrato emitido</p>
            <p className="text-zinc-500 text-sm mt-1 max-w-xs">
              Acesse um evento, preencha os dados e clique em "Baixar PDF" para gerar seu primeiro contrato.
            </p>
          </div>
          <button
            onClick={() => navigate('/eventos')}
            className="mt-2 flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors active:scale-95"
          >
            <span>Ver Eventos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lista filtrada vazia */}
      {contracts.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <SearchX className="w-10 h-10 text-zinc-600" />
          <p className="text-zinc-500 text-sm">Nenhum contrato encontrado para "{search}"</p>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((contract, index) => (
          <div
            key={contract.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm hover:border-emerald-500/30 transition-colors group relative overflow-hidden"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Sequence Badge */}
            <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-bl-xl border-l border-b border-zinc-700/50 group-hover:text-emerald-400 group-hover:bg-emerald-500/5 transition-colors">
              #{contract.sequenceNumber.toString().padStart(3, '0')}
            </div>

            {/* Topo: nome + valor */}
            <div className="flex justify-between items-start mb-3 pt-2">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className="font-bold text-white text-base truncate leading-tight">
                  {contract.contractorName}
                </h3>
                {contract.contratanteCnpjCpf && (
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    CNPJ/CPF: {contract.contratanteCnpjCpf}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0 pt-1">
                <span className="text-emerald-400 font-bold text-sm">
                  {formatCurrency(contract.totalValueCents)}
                </span>
              </div>
            </div>

            {/* Infos */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center space-x-2 text-xs text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-[#FF169B] flex-shrink-0" />
                <span>Show: <span className="text-zinc-200">{formatDate(contract.eventDate)}</span></span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-[#FF169B] flex-shrink-0" />
                <span className="truncate">{contract.eventLocation}</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/60">
               <button
                onClick={() => navigate(`/eventos/${contract.eventId}`)}
                className="flex-1 min-w-[100px] flex items-center justify-center space-x-1.5 py-2 px-3 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium hover:bg-zinc-700 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Editar/Re-emitir</span>
              </button>
              
              <button
                onClick={() => handleDeleteOne(contract.eventId, contract.sequenceNumber)}
                className="w-10 flex items-center justify-center h-8 bg-red-500/5 text-red-500/40 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="ml-auto flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50"></div>
                <span className="text-[10px] text-zinc-600">
                  {formatIssuedAt(contract.issuedAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Espaço inferior */}
      {filtered.length > 0 && <div className="h-8" />}
    </div>
  );
};
