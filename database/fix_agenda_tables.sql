-- ============================================================
-- SCRIPT DE CORREÇÃO: tabelas faltantes e FK correta
-- Execute este script DEPOIS do setup_definitivo.sql
-- ============================================================

-- 1. Corrigir FK de appointments: barber_id deve apontar para barber_profiles
--    (o código faz JOIN appointments -> barber_profiles)
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_barber_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_barber_id_fkey
  FOREIGN KEY (barber_id) REFERENCES barber_profiles(id) ON DELETE CASCADE;

-- 2. Criar tabela system_settings (usada em Configurações e Agenda)
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
CREATE POLICY "Permitir tudo autenticados" ON system_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserir horários de funcionamento padrão
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

-- 3. Criar tabela blocked_slots (bloqueio de horários na agenda)
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
CREATE POLICY "Permitir tudo autenticados" ON blocked_slots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_barber ON blocked_slots(barber_id);

-- 4. Criar tabelas de pacotes de serviços (usadas em Agenda)
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  validity_days INTEGER DEFAULT 90,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS package_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES service_packages(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recriar client_packages com estrutura correta (o original estava incompleto)
DROP TABLE IF EXISTS package_usage CASCADE;
DROP TABLE IF EXISTS client_packages CASCADE;

CREATE TABLE client_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  package_id UUID REFERENCES service_packages(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  price_paid DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE package_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_package_id UUID REFERENCES client_packages(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir tudo autenticados" ON service_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON package_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON client_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON package_usage FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Corrigir service_promotions para ter colunas que o código usa
DROP TABLE IF EXISTS service_promotions CASCADE;
CREATE TABLE service_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'weekday' CHECK (type IN ('weekday', 'time', 'fixed')),
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  weekdays INTEGER[],          -- [0,6] = domingo e sábado
  start_time TIME,             -- para type='time'
  end_time TIME,               -- para type='time'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo autenticados" ON service_promotions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Criar tabela audit_logs (usada por auditLogService.ts)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name TEXT,
  action TEXT NOT NULL,    -- 'create', 'update', 'delete'
  entity_type TEXT,        -- 'appointment', 'client', etc.
  entity_id TEXT,
  entity_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo autenticados" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
