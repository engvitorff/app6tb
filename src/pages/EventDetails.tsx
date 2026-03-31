import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventShow, ScheduledMusician, Musician, BandProfile, ContractPreferences, IssuedContract } from '../data/mocks';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Music, UserPlus, X, Check, CheckCircle2, Clock, Settings2, Receipt, Users2, Edit3, PiggyBank, RefreshCw, FileText, ExternalLink, Trash2, AlertTriangle, Loader2, DollarSign } from 'lucide-react';
import { formatCurrency, parseCurrencyInput } from '../utils/currency';
import { ContractTemplate } from '../components/ContractTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as api from '../services/api';

export const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventShow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allMusicians, setAllMusicians] = useState<Musician[]>([]);
  const [bandProfile, setBandProfile] = useState<BandProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [isPayFreelancersModalOpen, setIsPayFreelancersModalOpen] = useState(false);
  const [selectedPayIds, setSelectedPayIds] = useState<string[]>([]);
  const [editingExpenseScheduleId, setEditingExpenseScheduleId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // Edit Event Form States
  const [editContractorName, setEditContractorName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editValue, setEditValue] = useState('');

  // Add Musician Form States
  const [selectedMusicianId, setSelectedMusicianId] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [expenseInput, setExpenseInput] = useState('');

  // Local Event Fields for Input binding
  const [opExpInput, setOpExpInput] = useState('');
  const [bandFundInput, setBandFundInput] = useState('');

  // --- CUSTOM EXPENSE STATE ---
  const [customExpNameInput, setCustomExpNameInput] = useState('');
  const [customExpValInput, setCustomExpValInput] = useState('');

  // --- PDF & CONTRACT STATE ---
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [contractPrefs, setContractPrefs] = useState<ContractPreferences>({
    contratanteRazao: '',
    contratanteCnpjCpf: '',
    contratanteAddress: '',
    contratanteCityCep: '',
    useDuration: true,
    useEquipment: true,
    useConsumption: true,
    consumptionType: 'Total',
    consumptionValue: '',
    useRescisao: true,
    rescisaoPenaltyPercent: '50',
    useCivilLGPD: true
  });
  const [issuedContracts, setIssuedContracts] = useState<IssuedContract[]>([]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [eventsData, musiciansData, bandData, contractsData] = await Promise.all([
        api.getEvents(),
        api.getMusicians(),
        api.getBandProfile(),
        api.getIssuedContracts()
      ]);

      const loadedEvent = eventsData.find(e => e.id === id);
      if (loadedEvent) {
        setEvent(loadedEvent);
        setOpExpInput((loadedEvent.operationalExpensesCents / 100).toFixed(2));
        setBandFundInput((loadedEvent.bandFundCents / 100).toFixed(2));
        setCustomExpNameInput(loadedEvent.customExpenseName || '');
        setCustomExpValInput(loadedEvent.customExpenseCents ? (loadedEvent.customExpenseCents / 100).toFixed(2) : '');

        const existing = contractsData.find(c => c.eventId === id);
        if (existing) {
          setContractPrefs(existing.prefs);
        } else {
          setContractPrefs(prev => ({
            ...prev,
            contratanteRazao: loadedEvent.contractorName,
            contratanteAddress: loadedEvent.location
          }));
        }
      }
      setAllMusicians(musiciansData);
      setBandProfile(bandData);
      setIssuedContracts(contractsData);
    } catch (error) {
      console.error('Erro ao buscar dados do evento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (!event || !bandProfile) {
    return (
      <div className="p-6 text-center pt-32">
        <p className="text-zinc-400 mb-4">Carregando dados...</p>
        <button onClick={() => navigate('/eventos')} className="text-[#FF169B] flex items-center justify-center space-x-2 mx-auto">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
      </div>
    );
  }

  // --- Handlers & Persistence ---
  const saveEventUpdates = async (updatedFields: Partial<EventShow>) => {
    if (isDeleting || !event) return;
    
    try {
      const freshEvent = { ...event, ...updatedFields };
      setEvent(freshEvent);
      await api.updateEvent(freshEvent);
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
    }
  };

  const handleBlurFinancials = () => {
    saveEventUpdates({
      operationalExpensesCents: parseCurrencyInput(opExpInput),
      customExpenseName: customExpNameInput,
      customExpenseCents: parseCurrencyInput(customExpValInput),
      bandFundCents: parseCurrencyInput(bandFundInput)
    });
  };

  const handleToggleBandFundAuto = () => {
    saveEventUpdates({ isBandFundAuto: !event?.isBandFundAuto, bandFundCents: 0 });
    setBandFundInput('');
  };

  const handleChangeBandFundInput = (val: string) => {
    setBandFundInput(val);
    if (event?.isBandFundAuto) {
      saveEventUpdates({ isBandFundAuto: false });
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMusicianId || !id) return;

    try {
      await api.addMusicianToSchedule({
        eventId: id,
        musicianId: selectedMusicianId,
        feeOverrideCents: parseCurrencyInput(feeInput),
        otherExpensesCents: 0,
        paymentStatus: 'Pendente'
      });
      
      setSelectedMusicianId('');
      setFeeInput('');
      setIsScaleModalOpen(false);
      fetchData(); // Recarrega para mostrar o novo integrante
    } catch (error) {
      alert('Erro ao escalar músico no banco online.');
    }
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    if (confirm('Tem certeza que deseja remover esta pessoa da escala (Nuvem)?')) {
      try {
        await api.removeMusicianFromSchedule(scheduleId);
        fetchData();
      } catch (error) {
        alert('Erro ao remover músico do banco online.');
      }
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpenseScheduleId) return;

    try {
      await api.updateSchedule(editingExpenseScheduleId, {
        otherExpensesCents: parseCurrencyInput(expenseInput)
      });
      setEditingExpenseScheduleId(null);
      setExpenseInput('');
      fetchData();
    } catch (error) {
      alert('Erro ao salvar despesa no banco online.');
    }
  };

  const togglePaymentStatus = async (scheduleId: string) => {
    const schedule = event?.scheduledMusicians.find(s => s.id === scheduleId);
    if (!schedule) return;

    try {
      const newStatus = schedule.paymentStatus === 'Pago' ? 'Pendente' : 'Pago';
      await api.updateSchedule(scheduleId, {
        paymentStatus: newStatus as any
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao alterar status de pagamento:', error);
    }
  };

  const openEditModal = () => {
    if (!event) return;
    setEditContractorName(event.contractorName);
    setEditDate(event.date);
    setEditTime(event.time || '');
    setEditLocation(event.location);
    setEditValue((event.totalValueCents / 100).toFixed(2));
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => setIsEditModalOpen(false);

  const handleRemoveEvent = async () => {
    if (!id || !event || isDeleting) return;
    
    if (window.confirm(`Tem certeza que deseja excluir o show "${event.contractorName}" permanentemente (Nuvem)?`)) {
      setIsDeleting(true);
      try {
        await api.deleteEvent(id);
        navigate('/eventos', { replace: true });
      } catch (error) {
        setIsDeleting(false);
        alert('Erro ao excluir evento no banco online.');
      }
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEventUpdates({
      contractorName: editContractorName,
      date: editDate,
      time: editTime,
      location: editLocation,
      totalValueCents: parseCurrencyInput(editValue)
    });
    setIsEditModalOpen(false);
  };

  const handleBulkPay = async () => {
    if (selectedPayIds.length === 0) return;
    try {
      await Promise.all(selectedPayIds.map(id => api.updateSchedule(id, { paymentStatus: 'Pago' })));
      alert(`${selectedPayIds.length} pagamento(s) processado(s) com sucesso!`);
      setIsPayFreelancersModalOpen(false);
      setSelectedPayIds([]);
      fetchData();
    } catch (error) {
      alert('Erro ao processar pagamentos.');
    }
  };

  const pendingFreelancers = event.scheduledMusicians.filter(sm => {
    const m = allMusicians.find(mus => mus.id === sm.musicianId);
    return m?.role === 'Freelancer' && sm.paymentStatus === 'Pendente';
  });

  // --- PDF GENERATOR ---
  const handleGeneratePDF = async () => {
    if (!event) return;
    setIsGeneratingPDF(true);

    const wrapper = document.getElementById('pdf-contract-wrapper');
    const element = document.getElementById('pdf-contract-template');

    if (!wrapper || !element) {
      alert('Erro interno: template do contrato não encontrado.');
      setIsGeneratingPDF(false);
      return;
    }

    // Torna o elemento visível para o html2canvas conseguir capturar
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '-9999px';
    wrapper.style.opacity = '1';
    wrapper.style.zIndex = '-1';

    // Aguarda renderização completa
    await new Promise(r => setTimeout(r, 200));

    try {
      const existingContract = issuedContracts.find(c => c.eventId === event.id);
      const sequence = existingContract ? existingContract.sequenceNumber : await api.getNextContractSequence();
      const sequencePadded = sequence.toString().padStart(3, '0');

      const safeName = contractPrefs.contratanteRazao.trim()
        ? contractPrefs.contratanteRazao.trim()
        : event.contractorName.trim();

      const filename = `Contrato ${sequencePadded}.6tabom - ${safeName}.pdf`;

      // 1. Captura o HTML como canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // 2. Monta o PDF com jsPDF
      const imgData = canvas.toDataURL('image/jpeg', 0.97);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;

      // Divide em páginas se necessário
      let heightLeft = imgH;
      let yPos = 0;
      pdf.addImage(imgData, 'JPEG', 0, yPos, pdfW, imgH);
      heightLeft -= pdfH;

      while (heightLeft > 0) {
        yPos -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, yPos, pdfW, imgH);
        heightLeft -= pdfH;
      }

      // 3. Gera o blob PDF
      const pdfBlob = pdf.output('blob');

      // 4. Diálogo de salvamento
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // 5. Registra o contrato no histórico ONLINE
      await api.saveIssuedContract({
        eventId: event.id,
        sequenceNumber: sequence,
        contractorName: safeName,
        eventDate: event.date,
        eventLocation: event.location,
        totalValueCents: event.totalValueCents,
        issuedAt: new Date().toISOString(),
        contratanteCnpjCpf: contractPrefs.contratanteCnpjCpf,
        prefs: contractPrefs,
      });

      setIsContractModalOpen(false);
      fetchData(); // Atualiza a lista de contratos
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('PDF Error', e);
        alert('Erro ao gerar o PDF do contrato.');
      }
    } finally {
      wrapper.style.opacity = '0';
      wrapper.style.top = '-9999px';
      wrapper.style.left = '-9999px';
      setIsGeneratingPDF(false);
    }
  };

  // Borderô Calculations
  const faturamentoBrutoCents = event.totalValueCents;

  const freelancersLiquidoCents = event.scheduledMusicians.reduce((sum, sm) => {
    const mus = allMusicians.find(m => m.id === sm.musicianId);
    if (mus?.role === 'Freelancer') {
      return sum + Math.max(0, sm.feeOverrideCents - sm.otherExpensesCents);
    }
    return sum;
  }, 0);

  const custosOperacionaisFixosCents = event.operationalExpensesCents + (event.customExpenseCents || 0) + freelancersLiquidoCents;
  let lucroADividirCents = faturamentoBrutoCents - custosOperacionaisFixosCents;

  const sociospresentes = event.scheduledMusicians.filter(sm => {
    const mus = allMusicians.find(m => m.id === sm.musicianId);
    return mus?.role === 'Sócio';
  });

  const numSocios = sociospresentes.length;

  let cotaPorSocioCents = 0;
  let caixaBandaEfetivoCents = 0;

  if (event.isBandFundAuto) {
    const numCotistasTotais = numSocios + 1;
    cotaPorSocioCents = numCotistasTotais > 0 ? Math.floor(lucroADividirCents / numCotistasTotais) : 0;
    caixaBandaEfetivoCents = cotaPorSocioCents;
  } else {
    caixaBandaEfetivoCents = event.bandFundCents || 0;
    lucroADividirCents = lucroADividirCents - caixaBandaEfetivoCents;
    cotaPorSocioCents = numSocios > 0 ? Math.floor(lucroADividirCents / numSocios) : 0;
  }

  const custosTotaisFinaisCents = custosOperacionaisFixosCents + caixaBandaEfetivoCents;

  const selectedMusicianDetails = allMusicians.find(m => m.id === selectedMusicianId);
  const isSelectedFreelancer = selectedMusicianDetails?.role === 'Freelancer';

  const availableMusicians = allMusicians.filter(
    m => !event.scheduledMusicians.some(s => s.musicianId === m.id)
  );

  return (
    <div className="p-6">
      <div id="pdf-contract-wrapper" style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, zIndex: -1 }}>
        <ContractTemplate event={event} band={bandProfile} prefs={contractPrefs} />
      </div>

      <header className="mb-6 relative">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white flex items-center space-x-2 mb-4 transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <div className="flex space-x-2 relative z-50">
            <button
              onClick={() => {
                const newStatus = event.status === 'Pago' ? 'A receber' : 'Pago';
                saveEventUpdates({ status: newStatus as any });
              }}
              className={`${event.status === 'Pago' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30'} border p-2.5 rounded-full hover:opacity-80 transition-all shadow-sm active:scale-95 flex items-center justify-center`}
            >
              {event.status === 'Pago' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsContractModalOpen(true)}
              className={`${issuedContracts.some(c => c.eventId === event.id) ? 'text-purple-400 bg-purple-500/10' : 'text-emerald-400 bg-emerald-500/10'} p-2.5 rounded-full hover:opacity-80 transition-colors shadow-sm active:scale-95`}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={openEditModal} className="text-[#FF169B] bg-[#FF169B]/10 p-2.5 rounded-full hover:bg-[#FF169B]/20 transition-colors shadow-sm active:scale-95">
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRemoveEvent}
              className="text-zinc-600 bg-zinc-800/50 p-2.5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-all shadow-sm flex items-center justify-center transition-all active:scale-95"
              title="Excluir Show"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white leading-tight pr-12">{event.contractorName}</h1>

        <div className="flex flex-col space-y-1 mt-2 text-sm text-zinc-400">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-[#FF169B]" />
            <span>{(event.date.split('-').reverse().join('/'))} {event.time ? `às ${event.time}` : ''}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#FF169B]" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
      </header>

      {/* Inputs Operacionais */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8 shadow-sm">
        <h3 className="text-white font-bold flex items-center space-x-2 mb-4">
          <Settings2 className="w-5 h-5 text-[#FF169B]" />
          <span>Fechamento do Palco</span>
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Custos Logística</label>
              <input type="number" step="0.01" value={opExpInput} onChange={e => setOpExpInput(e.target.value)} onBlur={handleBlurFinancials} placeholder="0.00"
                className="w-full h-10 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-300 focus:outline-none focus:border-[#FF169B]" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1 ml-1 h-3 mt-1">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider truncate">Caixa (Fundo)</label>
                {!event.isBandFundAuto && (
                  <button 
                    onClick={handleToggleBandFundAuto} 
                    className="text-[8px] px-1.5 py-0.5 whitespace-nowrap bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20 transition-colors flex items-center space-x-1 animate-in fade-in zoom-in duration-200"
                    title="Voltar para o rateio automático"
                  >
                    <RefreshCw className="w-2 h-2" />
                    <span>Ratear Agora</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input type="number" step="0.01"
                  value={event.isBandFundAuto ? (caixaBandaEfetivoCents / 100).toFixed(2) : bandFundInput}
                  onChange={e => handleChangeBandFundInput(e.target.value)}
                  onBlur={handleBlurFinancials} placeholder="0.00"
                  className={`w-full h-10 bg-zinc-950 border rounded-xl px-4 focus:outline-none transition-all ${event.isBandFundAuto ? 'text-purple-300 border-purple-900/50 bg-purple-900/10' : 'text-zinc-300 border-zinc-800 focus:border-[#FF169B]'}`}
                />
                {event.isBandFundAuto && (
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[9px] text-purple-400 font-bold uppercase pointer-events-none bg-zinc-950/80 px-1 py-0.5 rounded">
                    Automático
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-800/50">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1 mb-1 block">Custos Avulsos</label>
            <div className="grid grid-cols-5 gap-2">
              <input type="text" value={customExpNameInput} onChange={e => setCustomExpNameInput(e.target.value)} onBlur={handleBlurFinancials} placeholder="Descrição"
                className="col-span-3 h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-zinc-300 focus:outline-none focus:border-red-500 text-sm" />
              <input type="number" step="0.01" value={customExpValInput} onChange={e => setCustomExpValInput(e.target.value)} onBlur={handleBlurFinancials} placeholder="0.00"
                className="col-span-2 h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-red-300 focus:outline-none focus:border-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Cachê Líquido</p>
          <p className="text-lg font-bold text-white">{formatCurrency(faturamentoBrutoCents)}</p>
          <Receipt className="absolute bottom-2 right-2 w-10 h-10 text-white/5" />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Custo Fixos</p>
          <p className="text-lg font-bold text-red-400">-{formatCurrency(custosTotaisFinaisCents)}</p>
        </div>

        {/* PIX & PAYMENT ACTIONS */}
        {event.status === 'A receber' && (
          <div className="col-span-2 space-y-2 mb-2">
            <button
               onClick={(e) => {
                 e.stopPropagation();
                 alert(`Processando Faturamento via PIX...\n\nShow: ${event.contractorName}\nValor: ${formatCurrency(event.totalValueCents)}\n\n(A integração com Mercado Pago está sendo preparada)`);
               }}
               className="w-full h-14 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] group"
            >
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Gerar Cobrança PIX</span>
            </button>

            {/* NEW: PAY FREELANCERS BUTTON */}
            {event.scheduledMusicians.some(sm => allMusicians.find(m => m.id === sm.musicianId)?.role === 'Freelancer' && sm.paymentStatus === 'Pendente') && (
              <button
                onClick={() => setIsPayFreelancersModalOpen(true)}
                className="w-full h-14 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] group"
              >
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Pagar Freelancers</span>
              </button>
            )}
          </div>
        )}

        <div className="col-span-2 bg-gradient-to-br from-[#FF169B] to-purple-600 rounded-2xl p-5 shadow-lg relative overflow-hidden">

          <p className="text-white/80 text-[10px] uppercase font-bold tracking-wider mb-1">Divisão por Sócio ({numSocios})</p>
          <h2 className="text-3xl font-bold text-white">{formatCurrency(cotaPorSocioCents)}</h2>
          <Users2 className="absolute right-[-10px] top-4 opacity-20 w-24 h-24" />
        </div>
      </div>

      {/* Escala */}
      <div className="flex justify-between items-center mb-4 mt-8">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Music className="w-5 h-5 text-[#FF169B]" />
          <span>Escala ({event.scheduledMusicians.length})</span>
        </h3>
        <button
          onClick={() => setIsScaleModalOpen(true)}
          disabled={availableMusicians.length === 0}
          className="text-[#FF169B] p-2 bg-[#FF169B]/10 hover:bg-[#FF169B]/20 rounded-full transition-colors"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 mb-12">
        {event.scheduledMusicians.map(schedule => {
          const musicianDetails = allMusicians.find(m => m.id === schedule.musicianId);
          if (!musicianDetails) return null;
          const isSocio = musicianDetails.role === 'Sócio';
          const baseValue = isSocio ? cotaPorSocioCents : schedule.feeOverrideCents;
          const liquid = baseValue - schedule.otherExpensesCents;

          return (
            <div key={schedule.id} className={`bg-zinc-900 border transition-colors rounded-xl p-4 shadow-sm relative ${schedule.paymentStatus === 'Pago' ? 'border-[#FF169B]/30' : 'border-zinc-800'}`}>
              <button onClick={() => handleRemoveSchedule(schedule.id)} className="absolute top-4 right-14 p-2 text-zinc-600 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
              <div className="flex justify-between items-start mb-2 pr-10">
                <div>
                  <h4 className="font-bold text-white text-md flex items-center space-x-2">
                    <span>{musicianDetails.name}</span>
                    <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${isSocio ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>{musicianDetails.role}</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{musicianDetails.instrument}</p>
                </div>
                <button
                  onClick={() => togglePaymentStatus(schedule.id)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${schedule.paymentStatus === 'Pago' ? 'bg-[#FF169B] text-white shadow-lg' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}
                >
                  {schedule.paymentStatus === 'Pago' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800/60">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>{isSocio ? 'Cota de Divisão' : 'Cachê Base'}</span>
                  <span>{formatCurrency(baseValue)}</span>
                </div>
                <div className="flex justify-between text-xs text-red-400/80 mb-2">
                  <span className="cursor-pointer" onClick={() => { setEditingExpenseScheduleId(schedule.id); setExpenseInput((schedule.otherExpensesCents/100).toFixed(2)); }}>Vales/Despesas (Editar)</span>
                  <span>-{formatCurrency(schedule.otherExpensesCents)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-zinc-800/50 pt-2 mt-1">
                  <span className="text-white">Líquido</span>
                  <span className="text-emerald-400">{formatCurrency(liquid)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Escala */}
      {isScaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
            <h2 className="text-xl font-bold text-white mb-6">Escalar Músico</h2>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <select value={selectedMusicianId} onChange={e => setSelectedMusicianId(e.target.value)} required className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white appearance-none">
                <option value="">Selecione um músico</option>
                {availableMusicians.map(m => <option key={m.id} value={m.id}>{m.name} ({m.instrument})</option>)}
              </select>
              {isSelectedFreelancer && (
                <input type="number" step="0.01" value={feeInput} onChange={e => setFeeInput(e.target.value)} required placeholder="Cachê do Freelancer (R$)"
                  className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
              )}
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => setIsScaleModalOpen(false)} className="flex-1 h-12 bg-zinc-900 border border-zinc-800 text-white rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 h-12 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-bold rounded-xl">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edição de Despesa */}
      {editingExpenseScheduleId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-xs rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Lançar Despesa/Vale</h3>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <input type="number" step="0.01" value={expenseInput} onChange={e => setExpenseInput(e.target.value)} autoFocus
                className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
              <div className="flex space-x-2">
                <button type="button" onClick={() => setEditingExpenseScheduleId(null)} className="flex-1 h-10 bg-zinc-900 text-white rounded-lg">Voltar</button>
                <button type="submit" className="flex-1 h-10 bg-emerald-600 text-white font-bold rounded-lg uppercase text-xs">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal: Contrato */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-xl rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Configurar Contrato</h2>
              <button onClick={() => setIsContractModalOpen(false)}><X className="w-6 h-6 text-zinc-400" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleGeneratePDF(); }} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Contratante (A4)</label>
                <input type="text" value={contractPrefs.contratanteRazao} onChange={e => setContractPrefs({...contractPrefs, contratanteRazao: e.target.value})} required className="w-full h-10 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={contractPrefs.contratanteCnpjCpf} onChange={e => setContractPrefs({...contractPrefs, contratanteCnpjCpf: e.target.value})} placeholder="CPF/CNPJ" required className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
                <input type="text" value={contractPrefs.contratanteCityCep} onChange={e => setContractPrefs({...contractPrefs, contratanteCityCep: e.target.value})} placeholder="Cidade/CEP" className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
              </div>
              <input type="text" value={contractPrefs.contratanteAddress} onChange={e => setContractPrefs({...contractPrefs, contratanteAddress: e.target.value})} placeholder="Endereço" className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
              
              <button type="submit" disabled={isGeneratingPDF} className="w-full h-14 mt-4 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center space-x-2">
                {isGeneratingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileText className="w-5 h-5" /><span>Gerar PDF Agora</span></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edição Show */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Editar Informações do Show</h2>
            <form onSubmit={handleEditEvent} className="space-y-4">
              <input type="text" value={editContractorName} onChange={e => setEditContractorName(e.target.value)} required className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} required className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
                <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
              </div>
              <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
              <input type="number" step="0.01" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white font-bold text-emerald-400" />
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={closeEditModal} className="flex-1 h-12 bg-zinc-900 border border-zinc-800 text-white rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 h-12 bg-[#FF169B] text-white font-bold rounded-xl">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Pagar Freelancers em Massa */}
      {isPayFreelancersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">Pagar Freelancers</h2>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Selecione os músicos para liquidar</p>
              </div>
              <button onClick={() => { setIsPayFreelancersModalOpen(false); setSelectedPayIds([]); }} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            <div className="space-y-2 mb-8 max-h-[40vh] overflow-y-auto pr-1">
              {pendingFreelancers.length === 0 ? (
                <p className="text-center py-8 text-zinc-600 text-sm italic">Todos os freelancers já foram pagos.</p>
              ) : (
                pendingFreelancers.map(sm => {
                  const m = allMusicians.find(mus => mus.id === sm.musicianId);
                  const isSelected = selectedPayIds.includes(sm.id);
                  return (
                    <div 
                      key={sm.id} 
                      onClick={() => setSelectedPayIds(prev => isSelected ? prev.filter(p => p !== sm.id) : [...prev, sm.id])}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${isSelected ? 'bg-amber-500/10 border-amber-500/40 shadow-inner shadow-amber-900/10' : 'bg-zinc-900 border-zinc-800'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-zinc-700 bg-zinc-800'}`}>
                          {isSelected && <Check className="w-4 h-4 text-black font-black" />}
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold tracking-tight">{m?.name}</p>
                          <p className="text-[9px] text-zinc-500 uppercase font-black tracking-tighter">{m?.instrument}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-black text-sm">{formatCurrency(sm.feeOverrideCents - sm.otherExpensesCents)}</p>
                        <p className="text-[8px] text-zinc-600 uppercase font-bold">Líquido</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
               onClick={handleBulkPay}
               disabled={selectedPayIds.length === 0}
               className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-3 transition-all ${
                 selectedPayIds.length > 0 ? 'bg-amber-500 text-black shadow-xl shadow-amber-900/20 active:scale-95' : 'bg-zinc-800 text-zinc-600 grayscale cursor-not-allowed opacity-50'
               }`}
            >
              <div className="w-8 h-8 bg-black/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span>Confirmar {selectedPayIds.length} Pagamento(s)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
