import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventShow, ScheduledMusician, Musician, BandProfile, ContractPreferences, IssuedContract } from '../data/mocks';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Music, UserPlus, X, Check, CheckCircle2, Clock, Settings2, Receipt, Users2, Edit3, RefreshCw, FileText, ExternalLink, Trash2, Loader2, DollarSign } from 'lucide-react';
import { formatCurrency, parseCurrencyInput } from '../utils/currency';
import { ContractTemplate } from '../components/ContractTemplate';
import { MapPickerModal } from '../components/MapPickerModal';
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
  const [isPayTeamModalOpen, setIsPayTeamModalOpen] = useState(false);
  const [selectedPayIds, setSelectedPayIds] = useState<string[]>([]);
  const [editingExpenseScheduleId, setEditingExpenseScheduleId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Edit Event Form States
  const [editContractorName, setEditContractorName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLocationLink, setEditLocationLink] = useState('');
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
  
  // PIX & Checkout State
  const [pixData, setPixData] = useState<{qr_code_base64: string, copy_paste: string} | null>(null);
  const [checkoutData, setCheckoutData] = useState<{checkout_url: string} | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [isGeneratingCheckout, setIsGeneratingCheckout] = useState(false);
  const [isPaymentSelectionOpen, setIsPaymentSelectionOpen] = useState(false);

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
      fetchData();
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
    if (!schedule || !id) return;

    try {
      const newStatus = schedule.paymentStatus === 'Pago' ? 'Pendente' : 'Pago';
      await api.updateSchedule(scheduleId, {
        paymentStatus: newStatus as any
      });

      // Logar Atividade
      await api.logActivity({
        userName: localStorage.getItem('pagode_finance_user') || 'Usuário',
        action: newStatus === 'Pago' ? 'pagou' : 'editou',
        targetType: 'músico',
        targetId: schedule.musicianId,
        description: `pagamento de ${allMusicians.find(m => m.id === schedule.musicianId)?.name} (${event.contractorName})`
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
    setEditLocationLink(event.locationLink || '');
    setEditValue((event.totalValueCents / 100).toFixed(2));
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => setIsEditModalOpen(false);

  const handleRemoveEvent = async () => {
    if (!id || !event || isDeleting) return;
    
    if (window.confirm(`Tem certeza que deseja excluir o show "${event.contractorName}" permanentemente (Nuvem)?`)) {
      setIsDeleting(true);
      try {
        await api.deleteEvent(id, event.contractorName);
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
      locationLink: editLocationLink,
      totalValueCents: parseCurrencyInput(editValue)
    });
    setIsEditModalOpen(false);
  };

  const handleBulkPay = async () => {
    if (selectedPayIds.length === 0 || !event) return;
    try {
      await Promise.all(selectedPayIds.map(async (id) => {
        const sm = event.scheduledMusicians.find(s => s.id === id);
        if (sm) {
          // Atualiza estado do pagamento na escala
          await api.updateSchedule(id, { paymentStatus: 'Pago' });
          
          // Calcula valor real e gera Lançamento Automático no Extrato
          const m = allMusicians.find(mus => mus.id === sm.musicianId);
          if (m) {
            const isSocio = m.role === 'Sócio';
            const baseValue = isSocio ? cotaPorSocioCents : sm.feeOverrideCents;
            const finalValue = baseValue - sm.otherExpensesCents;
            
            await api.createTransaction({
              description: `Pgto. ${m.role}: ${m.name} (Evento: ${event.contractorName})`,
              amountCents: finalValue,
              type: 'OUT',
              category: 'Cachê/Pagamento',
              date: event.date
            });
          }
        }
      }));
      
      // Logar Atividade
      await api.logActivity({
        userName: localStorage.getItem('pagode_finance_user') || 'Usuário',
        action: 'pagou',
        targetType: 'músicos',
        targetId: id || '',
        description: `${selectedPayIds.length} músicos do show ${event.contractorName}`
      });

      alert(`${selectedPayIds.length} pagamento(s) processado(s) com sucesso!`);
      setIsPayTeamModalOpen(false);
      setSelectedPayIds([]);
      fetchData();
    } catch (error) {
      alert('Erro ao processar pagamentos.');
    }
  };

  const handleGeneratePix = async () => {
    if (!event) return;
    setIsGeneratingPix(true);
    setIsPaymentSelectionOpen(false);
    try {
      const data = await api.createMercadoPagoPix(
        event.totalValueCents / 100, 
        `Pagamento do Show: ${event.contractorName}`,
        event.id
      );
      setPixData(data);
    } catch (err: any) {
      alert('Erro ao gerar PIX: ' + err.message);
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleGenerateCheckout = async () => {
    if (!event) return;
    setIsGeneratingCheckout(true);
    setIsPaymentSelectionOpen(false);
    try {
      const data = await api.createMercadoPagoCheckout(
        event.totalValueCents / 100, 
        `Pagamento do Show: ${event.contractorName}`,
        event.id
      );
      setCheckoutData(data);
    } catch (err: any) {
      alert('Erro ao gerar Link: ' + err.message);
    } finally {
      setIsGeneratingCheckout(false);
    }
  };

  const pendingTeam = event.scheduledMusicians.filter(sm => {
    return sm.paymentStatus === 'Pendente';
  });

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
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '-9999px';
    wrapper.style.opacity = '1';
    wrapper.style.zIndex = '-1';
    await new Promise(r => setTimeout(r, 200));
    try {
      const existingContract = issuedContracts.find(c => c.eventId === event.id);
      const sequence = existingContract ? existingContract.sequenceNumber : await api.getNextContractSequence();
      const sequencePadded = sequence.toString().padStart(3, '0');
      const safeName = contractPrefs.contratanteRazao.trim() ? contractPrefs.contratanteRazao.trim() : event.contractorName.trim();
      const filename = `Contrato ${sequencePadded}.6tabom - ${safeName}.pdf`;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.97);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
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
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      fetchData();
    } catch (e: any) {
      if (e?.name !== 'AbortError') alert('Erro ao gerar o PDF do contrato.');
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
    if (mus?.role === 'Freelancer') return sum + Math.max(0, sm.feeOverrideCents - sm.otherExpensesCents);
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
  const availableMusicians = allMusicians.filter(m => !event.scheduledMusicians.some(s => s.musicianId === m.id));

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
            <button onClick={() => { const newStatus = event.status === 'Recebido' ? 'A receber' : 'Recebido'; saveEventUpdates({ status: newStatus as any }); }} className={`${event.status === 'Recebido' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30'} border p-2.5 rounded-full hover:opacity-80 transition-all shadow-sm active:scale-95 flex items-center justify-center`}>
              {event.status === 'Recebido' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsContractModalOpen(true)} className={`${issuedContracts.some(c => c.eventId === event.id) ? 'text-purple-400 bg-purple-500/10' : 'text-emerald-400 bg-emerald-500/10'} p-2.5 rounded-full hover:opacity-80 transition-colors shadow-sm active:scale-95`}>
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={openEditModal} className="text-[#FF169B] bg-[#FF169B]/10 p-2.5 rounded-full hover:bg-[#FF169B]/20 transition-colors shadow-sm active:scale-95">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={handleRemoveEvent} className="text-zinc-600 bg-zinc-800/50 p-2.5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-all shadow-sm flex items-center justify-center transition-all active:scale-95" title="Excluir Show">
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
            {event.locationLink && (
              <a href={event.locationLink} target="_blank" rel="noopener noreferrer" className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md hover:bg-emerald-500/20 transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8 shadow-sm">
        <h3 className="text-white font-bold flex items-center space-x-2 mb-4">
          <Settings2 className="w-5 h-5 text-[#FF169B]" />
          <span>Fechamento do Palco</span>
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center mb-1 ml-1 h-3 mt-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custos Logística</label>
              </div>
              <input type="number" step="0.01" value={opExpInput} onChange={e => setOpExpInput(e.target.value)} onBlur={handleBlurFinancials} placeholder="0.00" className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-300 focus:outline-none focus:border-[#FF169B]" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1 ml-1 h-3 mt-1">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider truncate">Caixa (Fundo)</label>
                {!event.isBandFundAuto && (
                  <button onClick={handleToggleBandFundAuto} className="text-[8px] px-1.5 py-0.5 whitespace-nowrap bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20 transition-colors flex items-center space-x-1">
                    <RefreshCw className="w-2 h-2" />
                    <span>Ratear Agora</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input type="number" step="0.01" value={event.isBandFundAuto ? (caixaBandaEfetivoCents / 100).toFixed(2) : bandFundInput} onChange={e => handleChangeBandFundInput(e.target.value)} onBlur={handleBlurFinancials} placeholder="0.00" className={`w-full h-10 bg-zinc-950 border rounded-xl px-4 focus:outline-none transition-all ${event.isBandFundAuto ? 'text-purple-300 border-purple-900/50 bg-purple-900/10' : 'text-zinc-300 border-zinc-800 focus:border-[#FF169B]'}`} />
                {event.isBandFundAuto && <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[9px] text-purple-400 font-bold uppercase pointer-events-none bg-zinc-950/80 px-1 py-0.5 rounded">Automático</span>}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-800/50">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1 mb-1 block">Custos Avulsos</label>
            <div className="grid grid-cols-5 gap-2">
              <input type="text" value={customExpNameInput} onChange={e => setCustomExpNameInput(e.target.value)} onBlur={handleBlurFinancials} placeholder="Descrição" className="col-span-3 h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-zinc-300 focus:outline-none focus:border-red-500 text-sm" />
              <input type="number" step="0.01" value={customExpValInput} onChange={e => setCustomExpValInput(e.target.value)} onBlur={handleBlurFinancials} placeholder="0.00" className="col-span-2 h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-red-300 focus:outline-none focus:border-red-500" />
            </div>
          </div>
        </div>
      </div>

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
        {event.status === 'A receber' && (
          <div className="col-span-2 space-y-2 mb-2">
            <button 
              onClick={() => setIsPaymentSelectionOpen(true)} 
              disabled={isGeneratingPix || isGeneratingCheckout}
              className="w-full h-14 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] group disabled:opacity-50"
            >
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                {(isGeneratingPix || isGeneratingCheckout) ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5 text-emerald-400" />}
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                {(isGeneratingPix || isGeneratingCheckout) ? 'Processando...' : 'Gerar Cobrança'}
              </span>
            </button>
            <button onClick={() => setIsPayTeamModalOpen(true)} className="w-full h-14 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] group">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><Clock className="w-5 h-5 text-amber-400" /></div>
              <span className="text-xs font-black uppercase tracking-widest">Pagar Equipe</span>
            </button>
          </div>
        )}
        <div className="col-span-2 bg-gradient-to-br from-[#FF169B] to-purple-600 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <p className="text-white/80 text-[10px] uppercase font-bold tracking-wider mb-1">Divisão por Sócio ({numSocios})</p>
          <h2 className="text-3xl font-bold text-white">{formatCurrency(cotaPorSocioCents)}</h2>
          <Users2 className="absolute right-[-10px] top-4 opacity-20 w-24 h-24" />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 mt-8">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2"><Music className="w-5 h-5 text-[#FF169B]" /><span>Escala ({event.scheduledMusicians.length})</span></h3>
        <button onClick={() => setIsScaleModalOpen(true)} disabled={availableMusicians.length === 0} className="text-[#FF169B] p-2 bg-[#FF169B]/10 hover:bg-[#FF169B]/20 rounded-full transition-colors"><UserPlus className="w-5 h-5" /></button>
      </div>

      <div className="space-y-3 mb-12">
        {event.scheduledMusicians.map(schedule => {
          const musicianDetails = allMusicians.find(m => m.id === schedule.musicianId);
          if (!musicianDetails) return null;
          const isSocio = musicianDetails.role === 'Sócio';
          const baseValue = isSocio ? cotaPorSocioCents : schedule.feeOverrideCents;
          const liquid = baseValue - schedule.otherExpensesCents;
          return (
            <div key={schedule.id} className={`bg-zinc-900 border transition-colors rounded-3xl p-5 shadow-sm relative ${schedule.paymentStatus === 'Pago' ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-zinc-800'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 pr-4">
                  <h4 className="font-bold text-white text-base flex items-center space-x-2"><span className="truncate">{musicianDetails.name}</span><span className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-md ${isSocio ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}>{musicianDetails.role}</span></h4>
                  <p className="text-xs text-zinc-500 mt-0.5 font-medium">{musicianDetails.instrument}</p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button onClick={() => togglePaymentStatus(schedule.id)} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-95 ${schedule.paymentStatus === 'Pago' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-amber-500/40 hover:text-amber-400'}`}>
                    {schedule.paymentStatus === 'Pago' ? <><CheckCircle2 className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-widest">PAGO</span></> : <><Clock className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-widest text-[#FF169B]">PAGAR</span></>}
                  </button>
                  <button onClick={() => handleRemoveSchedule(schedule.id)} className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all" title="Remover"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/60">
                <div className="flex justify-between text-[11px] text-zinc-500 mb-1.5"><span className="font-bold uppercase tracking-wider">{isSocio ? 'Cota de Divisão' : 'Cachê Base'}</span><span className="font-medium">{formatCurrency(baseValue)}</span></div>
                <div className="flex justify-between text-[11px] text-red-400/80 mb-3 border-b border-zinc-800/50 pb-2">
                  <span className="cursor-pointer hover:text-red-300 transition-colors flex items-center space-x-1" onClick={() => { setEditingExpenseScheduleId(schedule.id); setExpenseInput((schedule.otherExpensesCents/100).toFixed(2)); }}><Edit3 className="w-3 h-3" /><span className="font-bold uppercase tracking-wider underline">Vales / Despesas</span></span>
                  <span className="font-medium">-{formatCurrency(schedule.otherExpensesCents)}</span>
                </div>
                <div className="flex justify-between items-center pt-1"><span className="text-xs text-zinc-400 font-black uppercase tracking-widest">Líquido</span><span className="text-base font-black text-emerald-400">{formatCurrency(liquid)}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {isScaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
            <h2 className="text-xl font-bold text-white mb-6">Escalar Músico</h2>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1 mb-1 block">Músico no Elenco</label>
                <select value={selectedMusicianId} onChange={e => setSelectedMusicianId(e.target.value)} required className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white appearance-none font-bold">
                  <option value="">Selecione um músico</option>
                  {availableMusicians.map(m => <option key={m.id} value={m.id}>{m.name} ({m.instrument})</option>)}
                </select>
              </div>
              {isSelectedFreelancer && (
                <div>
                  <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1 mb-1 block">Cachê Acordado (R$)</label>
                  <input type="number" step="0.01" value={feeInput} onChange={e => setFeeInput(e.target.value)} required placeholder="0.00" className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white font-bold" />
                </div>
              )}
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => setIsScaleModalOpen(false)} className="flex-1 h-12 bg-zinc-900 border border-zinc-800 text-white rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 h-12 bg-gradient-to-tr from-[#FF169B] to-purple-600 text-white font-bold rounded-xl">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingExpenseScheduleId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-xs rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Lançar Despesa/Vale</h3>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1 mb-1 block">Valor do Vale/Despesa (R$)</label>
                <input type="number" step="0.01" value={expenseInput} onChange={e => setExpenseInput(e.target.value)} autoFocus className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white font-bold" />
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => setEditingExpenseScheduleId(null)} className="flex-1 h-10 bg-zinc-900 text-white rounded-lg">Voltar</button>
                <button type="submit" className="flex-1 h-10 bg-emerald-600 text-white font-bold rounded-lg uppercase text-xs">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
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
                <p className="text-[9px] text-zinc-600 mt-1 ml-1 uppercase font-bold">NOME/RAZÃO SOCIAL QUE APARECERÁ NO CONTRATO.</p>
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

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-6">Editar Show</h2>
            <form onSubmit={handleEditEvent} className="space-y-4">
              <div><label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Contratante</label><input type="text" value={editContractorName} onChange={e => setEditContractorName(e.target.value)} required className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Data</label><input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} required className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" /></div>
                <div><label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Horário</label><input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" /></div>
              </div>
              <div><label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1 border-b border-zinc-800 pb-1 flex justify-between"><span>Local / Endereço</span></label>
                <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white" />
                <p className="text-[9px] text-zinc-600 mt-1 ml-1 uppercase font-bold">DESCRIÇÃO LIVRE DO LOCAL.</p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Link Google Maps</label>
                <div className="flex space-x-2 mt-1">
                  <input type="url" value={editLocationLink} onChange={e => setEditLocationLink(e.target.value)} className="flex-1 h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white text-xs" />
                  <button type="button" onClick={() => setIsMapPickerOpen(true)} className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center active:scale-90 transition-all"><MapPin className="w-5 h-5" /></button>
                </div>
                <p className="text-[9px] text-zinc-600 mt-1 ml-1 uppercase font-bold">LINK PARA NAVEGAÇÃO GPS (Waze/Google Maps).</p>
              </div>
              <div><label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest ml-1">Valor (R$)</label><input type="number" step="0.01" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full h-12 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white font-bold text-emerald-400" /></div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={closeEditModal} className="flex-1 h-12 bg-zinc-900 text-white rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 h-12 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-bold rounded-xl active:scale-95 transition-all">Salvar ALTERAÇÕES</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMapPickerOpen && (
        <MapPickerModal 
          onClose={() => setIsMapPickerOpen(false)} 
          onConfirm={(addr, url) => {
            setEditLocation(addr || editLocation);
            setEditLocationLink(url);
            setIsMapPickerOpen(false);
          }}
          initialAddress={editLocation}
        />
      )}

      {isPayTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <div><h2 className="text-xl font-bold text-white leading-tight">Pagar Equipe</h2><p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Selecione para liquidar</p></div>
              <button onClick={() => { setIsPayTeamModalOpen(false); setSelectedPayIds([]); }} className="p-2 bg-zinc-900 rounded-full"><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <div className="space-y-2 mb-8 max-h-[40vh] overflow-y-auto pr-1">
              {pendingTeam.map(sm => {
                const m = allMusicians.find(mus => mus.id === sm.musicianId);
                const isSelected = selectedPayIds.includes(sm.id);
                const isSocio = m?.role === 'Sócio';
                const baseValue = isSocio ? cotaPorSocioCents : sm.feeOverrideCents;
                return (
                  <div key={sm.id} onClick={() => setSelectedPayIds(prev => isSelected ? prev.filter(p => p !== sm.id) : [...prev, sm.id])} className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${isSelected ? 'bg-amber-500/10 border-amber-500/40' : 'bg-zinc-900 border-zinc-800'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-zinc-700 bg-zinc-800'}`}>{isSelected && <Check className="w-4 h-4 text-black font-black" />}</div>
                      <div><p className="text-white text-sm font-bold">{m?.name}</p><p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{m?.role} - {m?.instrument}</p></div>
                    </div>
                    <div className="text-right"><p className="text-white font-black text-sm">{formatCurrency(baseValue - sm.otherExpensesCents)}</p></div>
                  </div>
                );
              })}
              {pendingTeam.length === 0 && <p className="text-center py-8 text-zinc-600 text-sm italic">Nenhum pagamento pendente.</p>}
            </div>
            <button 
              onClick={handleBulkPay} 
              disabled={selectedPayIds.length === 0} 
              className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-3 transition-all ${selectedPayIds.length > 0 ? 'bg-amber-500 text-black shadow-xl shadow-amber-900/20 active:scale-95' : 'bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'}`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar {selectedPayIds.length} Pagamento(s)</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DO PIX */}
      {pixData && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <DollarSign className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Cobrança Gerada</h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Apresente ou envie para o contratante</p>
            </div>

            <div className="bg-white p-4 rounded-3xl mb-6 flex justify-center shadow-lg shadow-emerald-500/5">
              <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" className="w-full max-w-[200px] h-auto" />
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(pixData.copy_paste);
                  alert('Código PIX copiado!');
                }}
                className="w-full h-14 bg-zinc-900 border border-zinc-800 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <span>Copiar Código</span>
              </button>
              <button 
                onClick={() => setPixData(null)}
                className="w-full h-14 text-white/50 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELEÇÃO DE TIPO DE COBRANÇA */}
      {isPaymentSelectionOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white uppercase tracking-tighter">Tipo de Cobrança</h2>
              <button onClick={() => setIsPaymentSelectionOpen(false)} className="p-2 bg-zinc-900 rounded-full text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleGeneratePix}
                className="w-full p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left hover:bg-emerald-500/20 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">PIX Direto</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">QR Code Imediato no App</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={handleGenerateCheckout}
                className="w-full p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left hover:bg-blue-500/20 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ExternalLink className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Link Multifôrma</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Cartão ou PIX (Cliente escolhe)</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO CHECKOUT (LINK) */}
      {checkoutData && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full md:max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <ExternalLink className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Link Criado</h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Multi-pagamento (Cartão/PIX)</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(checkoutData.checkout_url);
                  alert('Link copiado!');
                }}
                className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <span>Copiar Link de Pagamento</span>
              </button>
              <button 
                onClick={() => setCheckoutData(null)}
                className="w-full h-14 text-white/50 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
