import { supabase } from '../lib/supabase';
import { EventShow, Musician, BandProfile, ScheduledMusician, IssuedContract } from '../data/mocks';

// --- Mappers for CamelCase <-> SnakeCase ---
const mapEventToDB = (ev: Partial<EventShow>) => ({
  id: ev.id,
  contractor_name: ev.contractorName,
  date: ev.date,
  time: ev.time,
  location: ev.location,
  location_link: ev.locationLink,
  total_value_cents: ev.totalValueCents,
  status: ev.status,
  operational_expenses_cents: ev.operationalExpensesCents,
  custom_expense_name: ev.customExpenseName,
  custom_expense_cents: ev.customExpenseCents,
  band_fund_cents: ev.bandFundCents,
  is_band_fund_auto: ev.isBandFundAuto,
  contractor_discount_cents: ev.contractorDiscountCents,
});

const mapEventFromDB = (dbEv: any): EventShow => ({
  id: dbEv.id,
  contractorName: dbEv.contractor_name,
  date: dbEv.date,
  time: dbEv.time,
  location: dbEv.location,
  locationLink: dbEv.location_link || '',
  totalValueCents: dbEv.total_value_cents,
  status: dbEv.status,
  operationalExpensesCents: dbEv.operational_expenses_cents,
  customExpenseName: dbEv.custom_expense_name,
  customExpenseCents: dbEv.custom_expense_cents,
  bandFundCents: dbEv.band_fund_cents,
  isBandFundAuto: dbEv.is_band_fund_auto,
  contractorDiscountCents: dbEv.contractor_discount_cents || 0,
  scheduledMusicians: (dbEv.scheduled_musicians || []).map(mapScheduleFromDB),
});

const mapScheduleToDB = (s: Partial<ScheduledMusician>) => ({
  id: s.id,
  event_id: s.eventId,
  musician_id: s.musicianId,
  fee_override_cents: s.feeOverrideCents,
  other_expenses_cents: s.otherExpensesCents,
  payment_status: s.paymentStatus,
});

const mapScheduleFromDB = (dbS: any): ScheduledMusician => ({
  id: dbS.id,
  eventId: dbS.event_id,
  musicianId: dbS.musician_id,
  feeOverrideCents: dbS.fee_override_cents,
  otherExpensesCents: dbS.other_expenses_cents,
  paymentStatus: dbS.payment_status,
});

const mapProfileToDB = (p: Partial<BandProfile>) => ({
  name: p.name,
  cnpj: p.cnpj,
  address: p.address,
  city: p.city,
  cep: p.cep,
  rep_name: p.repName,
  rep_rg: p.repRg,
  rep_cpf: p.repCpf,
  bank: p.bank,
  agency: p.agency,
  account: p.account,
  pix: p.pix,
});

const mapProfileFromDB = (dbP: any): BandProfile => ({
  name: dbP.name,
  cnpj: dbP.cnpj,
  address: dbP.address,
  city: dbP.city,
  cep: dbP.cep,
  repName: dbP.rep_name,
  repRg: dbP.rep_rg,
  repCpf: dbP.rep_cpf,
  bank: dbP.bank || '',
  agency: dbP.agency || '',
  account: dbP.account || '',
  pix: dbP.pix || '',
});

// --- MUSICIAN SERVICES ---
export const getMusicians = async (): Promise<Musician[]> => {
  const { data, error } = await supabase
    .from('musicians')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const saveMusician = async (musician: Partial<Musician>) => {
  const { data, error } = await supabase
    .from('musicians')
    .upsert(musician)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteMusician = async (id: string) => {
  const { error } = await supabase
    .from('musicians')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// --- EVENT SERVICES ---
export const getEvents = async (): Promise<EventShow[]> => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      scheduled_musicians (*)
    `)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(mapEventFromDB);
};

// --- Integração Mercado Pago ---

export const getMercadoPagoIntegration = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data, error } = await supabase.from('user_integrations').select('updated_at').eq('user_id', user.id).single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching integration', error);
    return false;
  }
  
  return !!data;
};

export const connectMercadoPago = async (code: string, redirectUri: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // Endpoint genérico para as edge functions do Supabase local ou remoto
  const edgeUrl = supabaseUrl.replace('.co', '.co/functions/v1').replace('http://127.0.0.1:54321', 'http://127.0.0.1:54321/functions/v1');
  
  const response = await fetch(`${edgeUrl}/mp-connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ code, redirectUri })
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.error || 'Falha ao vincular com o Mercado Pago.');
  }

  return responseData.success;
};

export const getMercadoPagoBalance = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const edgeUrl = supabaseUrl.replace('.co', '.co/functions/v1').replace('http://127.0.0.1:54321', 'http://127.0.0.1:54321/functions/v1');
  
  try {
    const response = await fetch(`${edgeUrl}/mp-balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      }
    });

    const data = await response.json();
    if (data.success && data.balance !== undefined) {
      return data.balance;
    }
  } catch (err) {
    console.error('Erro buscando balance do MP:', err);
  }
  return 0;
};

export const createMercadoPagoPix = async (amount: number, description: string, externalReference: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const edgeUrl = supabaseUrl.replace('.co', '.co/functions/v1').replace('http://127.0.0.1:54321', 'http://127.0.0.1:54321/functions/v1');
  
  const response = await fetch(`${edgeUrl}/mp-payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ 
      amount, 
      description, 
      external_reference: externalReference,
      email: session.user.email
    })
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.error || 'Falha ao gerar pagamento PIX.');
  }

  return responseData;
};

export const createMercadoPagoCheckout = async (amount: number, description: string, externalReference: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const edgeUrl = supabaseUrl.replace('.co', '.co/functions/v1').replace('http://127.0.0.1:54321', 'http://127.0.0.1:54321/functions/v1');
  
  const response = await fetch(`${edgeUrl}/mp-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ 
      amount, 
      description, 
      external_reference: externalReference
    })
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.error || 'Falha ao gerar link de pagamento.');
  }

  return responseData;
};

export const createEvent = async (event: Partial<EventShow>) => {
  // 1. Criar o evento
  const dbPayload = mapEventToDB(event);
  delete (dbPayload as any).id; // Deixar o Supabase gerar o UUID

  console.log('Criando evento no Supabase...', dbPayload);
  const { data: newEvent, error: eventError } = await supabase
    .from('events')
    .insert(dbPayload)
    .select()
    .single();
  
  if (eventError) {
    console.error('Erro detalhado do Supabase (Event):', eventError);
    throw eventError;
  }

  console.log('Evento criado com sucesso:', newEvent);

  // 3. Logar Atividade
  try {
    const userName = localStorage.getItem('pagode_finance_user') || 'Usuário';
    await logActivity({
      userName,
      action: 'criou',
      targetType: 'evento',
      targetId: newEvent.id,
      description: newEvent.contractor_name
    });
  } catch (err) {
    console.error('Erro ao logar atividade de criação:', err);
  }

  // 2. Escalar AUTOMATICAMENTE os 4 sócios
  try {
    const musicians = await getMusicians();
    const partners = musicians.filter(m => m.role === 'Sócio');
    
    if (partners.length > 0) {
      console.log(`Escalando ${partners.length} sócios automaticamente...`);
      const schedules = partners.map(p => ({
        event_id: newEvent.id,
        musician_id: p.id,
        fee_override_cents: 0, 
        other_expenses_cents: 0,
        payment_status: 'Pendente'
      }));

      const { error: scheduleError } = await supabase
        .from('scheduled_musicians')
        .insert(schedules);
      
      if (scheduleError) {
        console.error('Erro ao escalar sócios:', scheduleError);
      } else {
        console.log('Sócios escalados com sucesso.');
      }
    }
  } catch (err) {
    console.error('Erro não crítico ao tentar buscar/escalar sócios:', err);
    // Não paramos o fluxo aqui pois o evento principal já foi criado
  }

  return mapEventFromDB(newEvent);
};

export const updateEvent = async (event: Partial<EventShow>) => {
  const dbPayload = mapEventToDB(event);
  const { data, error } = await supabase
    .from('events')
    .update(dbPayload)
    .eq('id', event.id)
    .select()
    .single();
  
  if (error) throw error;

  // Logar Atividade
  try {
    const userName = localStorage.getItem('pagode_finance_user') || 'Usuário';
    await logActivity({
      userName,
      action: 'editou',
      targetType: 'evento',
      targetId: event.id,
      description: data.contractor_name
    });
  } catch (err) {
    console.error('Erro ao logar atividade de edição:', err);
  }

  return mapEventFromDB(data);
};

export const deleteEvent = async (id: string, name?: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  
  if (error) throw error;

  // Logar Atividade
  try {
    const userName = localStorage.getItem('pagode_finance_user') || 'Usuário';
    await logActivity({
      userName,
      action: 'excluiu',
      targetType: 'evento',
      targetId: id,
      description: name || 'Evento removido'
    });
  } catch (err) {
    console.error('Erro ao logar atividade de exclusão:', err);
  }
};

// --- SCHEDULE SERVICES ---
export const addMusicianToSchedule = async (schedule: Partial<ScheduledMusician>) => {
  const dbPayload = mapScheduleToDB(schedule);
  const { data, error } = await supabase
    .from('scheduled_musicians')
    .insert(dbPayload)
    .select()
    .single();
  
  if (error) throw error;
  return mapScheduleFromDB(data);
};

export const updateSchedule = async (id: string, updates: Partial<ScheduledMusician>) => {
  const dbPayload = mapScheduleToDB(updates);
  const { data, error } = await supabase
    .from('scheduled_musicians')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return mapScheduleFromDB(data);
};

export const removeMusicianFromSchedule = async (id: string) => {
  const { error } = await supabase
    .from('scheduled_musicians')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// --- BAND PROFILE SERVICES ---
export const getBandProfile = async (): Promise<BandProfile | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('band_profile')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro se não houver perfil
  
  if (error || !data) return null;
  return mapProfileFromDB(data);
};

export const saveBandProfile = async (profile: Partial<BandProfile>) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const dbPayload = mapProfileToDB(profile);
  const { data, error } = await supabase
    .from('band_profile')
    .upsert({ 
      ...dbPayload, 
      user_id: session.user.id 
    }, { onConflict: 'user_id' }) // Conflito baseado em user_id agora
    .select()
    .single();
  
  if (error) throw error;

  // Logar Atividade
  try {
    const userName = localStorage.getItem('pagode_finance_user') || 'Usuário';
    await logActivity({
      userName,
      action: 'editou',
      targetType: 'perfil',
      targetId: session.user.id,
      description: 'Dados Pessoais / Cadastro'
    });
  } catch (err) {
    console.warn('Erro ao logar perfil:', err);
  }

  return mapProfileFromDB(data);
};

// --- CONTRACT SERVICES ---
export const getIssuedContracts = async (): Promise<IssuedContract[]> => {
  const { data, error } = await supabase
    .from('issued_contracts')
    .select('*')
    .order('issued_at', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map(c => ({
    id: c.id,
    eventId: c.event_id,
    sequenceNumber: c.sequence_number,
    contractorName: c.contractor_name,
    eventDate: c.event_date,
    eventLocation: c.event_location,
    totalValueCents: c.total_value_cents,
    issuedAt: c.issued_at,
    contratanteCnpjCpf: c.contratante_cnpj_cpf,
    prefs: c.prefs,
  }));
};

export const saveIssuedContract = async (contract: Partial<IssuedContract>) => {
  const dbPayload = {
    event_id: contract.eventId,
    sequence_number: contract.sequenceNumber,
    contractor_name: contract.contractorName,
    event_date: contract.eventDate,
    event_location: contract.eventLocation,
    total_value_cents: contract.totalValueCents,
    issued_at: contract.issuedAt,
    contratante_cnpj_cpf: contract.contratanteCnpjCpf,
    prefs: contract.prefs,
  };

  const { data, error } = await supabase
    .from('issued_contracts')
    .upsert(dbPayload)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteIssuedContract = async (contractId: string) => {
  const { error } = await supabase
    .from('issued_contracts')
    .delete()
    .eq('id', contractId);
  
  if (error) throw error;
};

export const deleteIssuedContractByEventId = async (eventId: string) => {
  if (!eventId) return;
  const { error } = await supabase
    .from('issued_contracts')
    .delete()
    .eq('event_id', eventId);
  
  if (error) throw error;
};

export const getNextContractSequence = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('issued_contracts')
    .select('sequence_number')
    .order('sequence_number', { ascending: false })
    .limit(1);
  
  if (error) return 1;
  return data && data.length > 0 ? (data[0] as any).sequence_number + 1 : 1;
};

// --- ACTIVITY LOGS SERVICES ---
export interface ActivityLog {
  id?: string;
  userName: string;
  action: 'criou' | 'editou' | 'excluiu' | 'pagou';
  targetType: string;
  targetId: string;
  description: string;
  createdAt?: string;
}

export const logActivity = async (activity: Partial<ActivityLog>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const dbPayload = {
    user_id: user?.id,
    user_name: activity.userName,
    action: activity.action,
    target_type: activity.targetType,
    target_id: activity.targetId,
    description: activity.description,
  };

  const { error } = await supabase.from('activity_logs').insert(dbPayload);
  if (error) {
    // Se a tabela ainda não existir no Supabase, falhamos silenciosamente para não quebrar o app
    console.warn('Erro ao inserir log (provavelmente tabela activity_logs não existe):', error);
  }
};

// --- TRANSACTIONS (CAIXA DA BANDA) SERVICES ---

export interface Transaction {
  id: string;
  description: string;
  amountCents: number;
  type: 'IN' | 'OUT';
  category: string;
  date: string;
  createdAt?: string;
}

const mapTransactionFromDB = (dbTx: any): Transaction => ({
  id: dbTx.id,
  description: dbTx.description,
  amountCents: dbTx.amount_cents,
  type: dbTx.type,
  category: dbTx.category,
  date: dbTx.date,
  createdAt: dbTx.created_at
});

const mapTransactionToDB = (tx: Partial<Transaction>) => ({
  description: tx.description,
  amount_cents: tx.amountCents,
  type: tx.type,
  category: tx.category,
  date: tx.date
});

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.warn('Erro ao buscar transações (tabela não existe?):', error);
    return [];
  }
  return (data || []).map(mapTransactionFromDB);
};

export const createTransaction = async (tx: Partial<Transaction>) => {
  const dbPayload = mapTransactionToDB(tx);
  const { data, error } = await supabase
    .from('transactions')
    .insert(dbPayload)
    .select()
    .single();
  
  if (error) throw error;

  // Log Activity
  try {
    const userName = localStorage.getItem('pagode_finance_user') || 'Usuário';
    await logActivity({
      userName,
      action: 'criou',
      targetType: 'transacao',
      targetId: data.id,
      description: `${tx.type === 'IN' ? 'Entrada' : 'Saída'}: ${tx.description}`
    });
  } catch (err) { }

  return mapTransactionFromDB(data);
};

export const deleteTransaction = async (id: string, description?: string) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;

  // Log Activity
  try {
    const userName = localStorage.getItem('pagode_finance_user') || 'Usuário';
    await logActivity({
      userName,
      action: 'excluiu',
      targetType: 'transacao',
      targetId: id,
      description: description || 'Lançamento de Caixa'
    });
  } catch (err) { }
};

export const getActivities = async (): Promise<ActivityLog[]> => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) return [];
  return (data || []).map(d => ({
    id: d.id,
    userName: d.user_name,
    action: d.action,
    targetType: d.target_type,
    targetId: d.target_id,
    description: d.description,
    createdAt: d.created_at
  }));
};

// --- UTILS: TIME / OVERLAP ---
export const checkEventOverlap = async (date: string, time: string, excludeId?: string): Promise<EventShow | null> => {
  const events = await getEvents();
  const newStart = new Date(`${date}T${time}:00`);
  const newEnd = new Date(newStart.getTime() + 3 * 60 * 60 * 1000); // +3h

  for (const ev of events) {
    if (ev.date === date && ev.id !== excludeId) {
      const evStart = new Date(`${ev.date}T${ev.time || '00:00'}:00`);
      const evEnd = new Date(evStart.getTime() + 3 * 60 * 60 * 1000); // 3h padrão

      // Overlap logic: (Start1 < End2) and (End1 > Start2)
      if (newStart < evEnd && newEnd > evStart) {
        return ev;
      }
    }
  }
  return null;
};
