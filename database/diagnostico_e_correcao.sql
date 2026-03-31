-- ============================================================
-- DIAGNÓSTICO E CORREÇÃO - SAN PATRICIO BARBEARIA
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- PASSO 1: VERIFICAR QUAIS TABELAS EXISTEM
-- ============================================================
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================================
-- PASSO 2: VERIFICAR SE system_settings EXISTE E TEM DADOS
-- ============================================================
SELECT key, value, category, is_public, updated_at
FROM system_settings
ORDER BY key;

-- ============================================================
-- PASSO 3: CRIAR system_settings SE NÃO EXISTIR
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo autenticados" ON system_settings;
CREATE POLICY "Permitir tudo autenticados" ON system_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permitir leitura pública para is_public = true (usado pelo bot e LoginPage)
DROP POLICY IF EXISTS "Leitura publica configuracoes publicas" ON system_settings;
CREATE POLICY "Leitura publica configuracoes publicas" ON system_settings
  FOR SELECT TO anon USING (is_public = true);

-- ============================================================
-- PASSO 4: INSERIR CONFIGURAÇÕES PADRÃO SE FALTAREM
-- ============================================================

-- Horários de funcionamento
INSERT INTO system_settings (key, value, description, category, is_public)
VALUES (
  'working_hours',
  '{
    "monday":    {"open": "09:00", "close": "20:00", "closed": false},
    "tuesday":   {"open": "09:00", "close": "20:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "20:00", "closed": false},
    "thursday":  {"open": "09:00", "close": "20:00", "closed": false},
    "friday":    {"open": "09:00", "close": "20:00", "closed": false},
    "saturday":  {"open": "09:00", "close": "18:00", "closed": false},
    "sunday":    {"open": "09:00", "close": "18:00", "closed": true}
  }'::jsonb,
  'Horários de funcionamento da barbearia',
  'general',
  true
)
ON CONFLICT (key) DO NOTHING;

-- Nome da barbearia
INSERT INTO system_settings (key, value, description, category, is_public)
VALUES (
  'company_name',
  '"San Patricio"'::jsonb,
  'Nome fantasia da barbearia',
  'general',
  true
)
ON CONFLICT (key) DO NOTHING;

-- Descrição
INSERT INTO system_settings (key, value, description, category, is_public)
VALUES (
  'company_description',
  '"Sistema de Gestão de Barbearia"'::jsonb,
  'Descrição/slogan da barbearia',
  'general',
  true
)
ON CONFLICT (key) DO NOTHING;

-- Modo de comissão
INSERT INTO system_settings (key, value, description, category, is_public)
VALUES (
  'commission_mode',
  '"individual"'::jsonb,
  'Modo de comissão: unified ou individual',
  'financial',
  false
)
ON CONFLICT (key) DO NOTHING;

-- Taxa unificada de comissão
INSERT INTO system_settings (key, value, description, category, is_public)
VALUES (
  'unified_commission_rate',
  '"40.00"'::jsonb,
  'Taxa de comissão unificada',
  'financial',
  false
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PASSO 5: VERIFICAR E CORRIGIR barber_commissions
-- ============================================================
-- O código CommissionSettings.tsx usa user_id, mas o schema original
-- define barber_id. Vamos garantir que a coluna correta existe:

ALTER TABLE barber_commissions 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_barber_commissions_user_id ON barber_commissions(user_id);

-- ============================================================
-- PASSO 6: VERIFICAR tabelas necessárias para Agenda
-- ============================================================
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID REFERENCES barber_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT DEFAULT 'Bloqueio manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo autenticados" ON blocked_slots;
CREATE POLICY "Permitir tudo autenticados" ON blocked_slots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo autenticados" ON audit_logs;
CREATE POLICY "Permitir tudo autenticados" ON audit_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PASSO 7: VERIFICAR COLUNAS QUE O CÓDIGO ESPERA EM appointments
-- ============================================================
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- O código também usa status 'scheduled', mas o schema original só tem 'confirmed'
-- Adicionar 'scheduled' ao CHECK constraint:
ALTER TABLE appointments 
  DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments 
  ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- ============================================================
-- PASSO 8: VERIFICAR services.is_active vs services.active
-- ============================================================
-- O código usa .eq('is_active', true) mas o schema define 'active'
ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Sincronizar is_active com active
UPDATE services SET is_active = active WHERE is_active IS NULL OR is_active != active;

-- ============================================================
-- VERIFICAÇÃO FINAL: STATUS DAS CONFIGURAÇÕES
-- ============================================================
SELECT 
  key,
  value,
  is_public,
  updated_at
FROM system_settings
ORDER BY category, key;
