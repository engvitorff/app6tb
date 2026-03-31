export interface Musician {
  id: string;
  name: string;
  instrument: string;
  phone: string;
  pix: string;
  role: 'Sócio' | 'Freelancer';
}

export interface ScheduledMusician {
  id: string;
  eventId: string;
  musicianId: string;
  feeOverrideCents: number;
  otherExpensesCents: number;
  paymentStatus: 'Pendente' | 'Pago';
}

export interface EventShow {
  id: string;
  contractorName: string;
  date: string;
  time: string;
  location: string;
  locationLink?: string;
  totalValueCents: number;
  status: 'A receber' | 'Recebido';
  
  operationalExpensesCents: number;
  customExpenseName?: string;
  customExpenseCents?: number;
  
  bandFundCents: number;
  isBandFundAuto?: boolean;
  
  contractorDiscountCents: number;
  scheduledMusicians: ScheduledMusician[];
}

export interface ContractPreferences {
  contratanteRazao: string;
  contratanteCnpjCpf: string;
  contratanteAddress: string;
  contratanteCityCep: string;
  useDuration: boolean;
  useEquipment: boolean;
  useConsumption: boolean;
  consumptionType: 'Total' | 'Valor';
  consumptionValue: string;
  useRescisao: boolean;
  rescisaoPenaltyPercent: string;
  useCivilLGPD: boolean;
}

export interface IssuedContract {
  id: string; // eventId
  eventId: string;
  sequenceNumber: number;
  contractorName: string;
  eventDate: string;
  eventLocation: string;
  totalValueCents: number;
  issuedAt: string; // ISO date string
  contratanteCnpjCpf: string;
  prefs: ContractPreferences;
}

export interface BandProfile {
  name: string;
  cnpj: string;
  address: string;
  city: string;
  cep: string;
  repName: string;
  repRg: string;
  repCpf: string;
}

const INITIAL_MUSICIANS: Musician[] = [
  { id: '1', name: 'Vitor Fernandes', instrument: 'Surdo/Vocal', phone: '(11) 90000-0001', pix: 'vitor@pix.com', role: 'Sócio' },
  { id: '2', name: 'Josiel Rosa', instrument: 'Pandeiro/Vocal', phone: '(11) 90000-0002', pix: 'josiel@pix.com', role: 'Sócio' },
  { id: '3', name: 'Bruno Borba', instrument: 'Vocal', phone: '(11) 90000-0003', pix: 'bruno@pix.com', role: 'Sócio' },
  { id: '4', name: 'Orlando Junior', instrument: 'Tantan/Vocal', phone: '(11) 90000-0004', pix: 'orlando@pix.com', role: 'Sócio' },
];

export const getBandProfile = (): BandProfile => {
  const data = localStorage.getItem('pagode_band_profile');
  if (data) return JSON.parse(data);
  return {
    name: 'Grupo 6 Tá Bom',
    cnpj: '41.955.002/0001-11',
    address: 'rua Aleixo Rodrigues de Queiroz, nº468, Jundiaí Industrial',
    city: 'ANÁPOLIS/GO',
    cep: '75115-010',
    repName: 'VÍTOR FERNANDES FERREIRA',
    repRg: '569692-9',
    repCpf: '043.552.841-66'
  };
};

export const saveBandProfile = (profile: BandProfile) => {
  localStorage.setItem('pagode_band_profile', JSON.stringify(profile));
};

export const getMusicians = (): Musician[] => {
  const data = localStorage.getItem('pagode_musicians');
  if (data) return JSON.parse(data);
  localStorage.setItem('pagode_musicians', JSON.stringify(INITIAL_MUSICIANS));
  return INITIAL_MUSICIANS;
};

export const saveMusicians = (musicians: Musician[]) => {
  localStorage.setItem('pagode_musicians', JSON.stringify(musicians));
};

// 1. Definimos a chave correta no localStorage
const STORAGE_KEY = 'pagode_events';

export const getEvents = (): EventShow[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  // Se estiver vazio, retorna [] para o filter não dar erro
  return data ? JSON.parse(data) : [];
};

export const saveEvents = (events: EventShow[]) => {
  // Importante: Salvar como String usando a chave certa
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

export const updateEvent = (updatedEvent: EventShow) => {
  const events = getEvents();
  const index = events.findIndex(e => String(e.id) === String(updatedEvent.id));
  if (index !== -1) {
    events[index] = updatedEvent;
    saveEvents(events);
  }
};

export const getIssuedContracts = (): IssuedContract[] => {
  const data = localStorage.getItem('pagode_issued_contracts');
  if (data) {
    const parsed = JSON.parse(data);
    // Migração de dados legados
    return parsed.map((c: any) => ({
      ...c,
      id: c.id || c.eventId,
      sequenceNumber: c.sequenceNumber || 0,
      prefs: c.prefs || { 
        contratanteRazao: c.contractorName || '',
        contratanteCnpjCpf: c.contratanteCnpjCpf || '',
        contratanteAddress: c.eventLocation || '',
        contratanteCityCep: '',
        useDuration: true, useEquipment: true, useConsumption: true,
        consumptionType: 'Total', consumptionValue: '',
        useRescisao: true, rescisaoPenaltyPercent: '50',
        useCivilLGPD: true
      }
    }));
  }
  return [];
};

export const getNextContractSequence = (): number => {
  const current = localStorage.getItem('pagode_contract_sequence');
  const next = current ? parseInt(current, 10) + 1 : 1;
  localStorage.setItem('pagode_contract_sequence', next.toString());
  return next;
};

export const saveIssuedContract = (contract: IssuedContract) => {
  const contracts = getIssuedContracts();
  const exists = contracts.findIndex(c => c.eventId === contract.eventId);
  if (exists !== -1) {
    contracts[exists] = contract;
  } else {
    contracts.unshift(contract);
  }
  localStorage.setItem('pagode_issued_contracts', JSON.stringify(contracts));
};

export const deleteIssuedContract = (eventId: string) => {
  const contracts = getIssuedContracts();
  const filtered = contracts.filter(c => c.eventId !== eventId);
  localStorage.setItem('pagode_issued_contracts', JSON.stringify(filtered));
};

export const deleteEvent = (id: string) => {
  const events = getEvents();
  
  // Forçamos a comparação de String para não falhar no ID
  const filtered = events.filter(e => String(e.id) !== String(id));
  
  // Salva a lista atualizada
  saveEvents(filtered);
  
  // Remove o contrato se a função existir
  if (typeof deleteIssuedContract === 'function') {
    deleteIssuedContract(id);
  }
};
