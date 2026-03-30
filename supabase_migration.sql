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

-- 4. TABELA: Perfil da Banda
-- Se já existir, adicionamos as colunas que podem estar faltando
CREATE TABLE IF NOT EXISTS band_profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'Grupo 6 Tá Bom',
  cnpj TEXT,
  address TEXT,
  city TEXT,
  cep TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona colunas extras (ignora se já existirem)
ALTER TABLE band_profile ADD COLUMN IF NOT EXISTS rep_name TEXT;
ALTER TABLE band_profile ADD COLUMN IF NOT EXISTS rep_rg TEXT;
ALTER TABLE band_profile ADD COLUMN IF NOT EXISTS rep_cpf TEXT;

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

-- ============================================================
-- DADOS INICIAIS: Sócios da Banda
-- ============================================================
INSERT INTO musicians (name, instrument, phone, pix, role)
VALUES
  ('Vitor Fernandes', 'Surdo/Vocal', '(11) 90000-0001', 'vitor@pix.com', 'Sócio'),
  ('Josiel Rosa', 'Pandeiro/Vocal', '(11) 90000-0002', 'josiel@pix.com', 'Sócio'),
  ('Bruno Borba', 'Vocal', '(11) 90000-0003', 'bruno@pix.com', 'Sócio'),
  ('Orlando Junior', 'Tantan/Vocal', '(11) 90000-0004', 'orlando@pix.com', 'Sócio')
ON CONFLICT DO NOTHING;

-- Perfil inicial da banda
INSERT INTO band_profile (id, name, cnpj, address, city, cep, rep_name, rep_rg, rep_cpf)
VALUES (
  1,
  'Grupo 6 Tá Bom',
  '41.955.002/0001-11',
  'rua Aleixo Rodrigues de Queiroz, nº468, Jundiaí Industrial',
  'ANÁPOLIS/GO',
  '75115-010',
  'VÍTOR FERNANDES FERREIRA',
  '569692-9',
  '043.552.841-66'
)
ON CONFLICT (id) DO NOTHING;
