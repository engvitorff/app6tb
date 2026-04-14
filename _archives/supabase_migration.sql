-- ============================================================
-- PAGODE FINANCE - Script de Migração do Banco de Dados
-- Execute este SQL no painel do Supabase:
-- Projeto > SQL Editor > New Query > Cole e clique em RUN
-- ============================================================

-- 1. TABELA: Músicos
CREATE TABLE IF NOT EXISTS musicians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  instrument TEXT NOT NULL,
  phone TEXT,
  pix TEXT,
  role TEXT NOT NULL DEFAULT 'Freelancer' CHECK (role IN ('Sócio', 'Freelancer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA: Eventos/Shows
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  total_value_cents INTEGER DEFAULT 0,
  status TEXT DEFAULT 'A receber' CHECK (status IN ('A receber', 'Pago')),
  operational_expenses_cents INTEGER DEFAULT 0,
  custom_expense_name TEXT,
  custom_expense_cents INTEGER DEFAULT 0,
  band_fund_cents INTEGER DEFAULT 0,
  is_band_fund_auto BOOLEAN DEFAULT true,
  contractor_discount_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA: Escala de Músicos por Show
CREATE TABLE IF NOT EXISTS scheduled_musicians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  musician_id UUID REFERENCES musicians(id) ON DELETE CASCADE,
  fee_override_cents INTEGER DEFAULT 0,
  other_expenses_cents INTEGER DEFAULT 0,
  payment_status TEXT DEFAULT 'Pendente' CHECK (payment_status IN ('Pendente', 'Pago')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA: Perfil da Banda (Isolado por Usuário)
CREATE TABLE IF NOT EXISTS band_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Seu Grupo',
  cnpj TEXT,
  address TEXT,
  city TEXT,
  cep TEXT,
  rep_name TEXT,
  rep_rg TEXT,
  rep_cpf TEXT,
  bank TEXT,
  agency TEXT,
  account TEXT,
  pix TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA: Contratos Emitidos
CREATE TABLE IF NOT EXISTS issued_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  sequence_number INTEGER NOT NULL,
  contractor_name TEXT NOT NULL,
  event_date DATE,
  event_location TEXT,
  total_value_cents INTEGER DEFAULT 0,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  contratante_cnpj_cpf TEXT,
  prefs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA: Logs de Atividade
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEGURANÇA: Row Level Security (RLS)
-- Permite que usuários autenticados leiam e escrevam seus dados
-- ============================================================

ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_contracts ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (todos os usuários autenticados têm acesso total)
CREATE POLICY "Authenticated users can do everything on musicians"
  ON musicians FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on events"
  ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on scheduled_musicians"
  ON scheduled_musicians FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on band_profile"
  ON band_profile FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on issued_contracts"
  ON issued_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything on activity_logs"
  ON activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- DADOS INICIAIS: Sócios da Banda (Opcional - Pode remover se quiser banco limpo)
-- ============================================================
INSERT INTO musicians (name, instrument, phone, pix, role)
VALUES
  ('Sócio 1', 'Instrumento', '(00) 00000-0000', 'pix1@exemplo.com', 'Sócio'),
  ('Sócio 2', 'Instrumento', '(00) 00000-0000', 'pix2@exemplo.com', 'Sócio')
ON CONFLICT DO NOTHING;
