-- ============================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA - SAN PATRICIO BARBEARIA
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Dashboard → SQL Editor → New Query → Cole e Execute
-- ============================================

-- ============================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. TABELA DE USUÁRIOS (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  specialty TEXT,
  avatar TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'barber')),
  barber_profile_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABELA DE CLIENTES (clients)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABELA DE SERVIÇOS (services)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- em minutos
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABELA DE PERFIS DE BARBEIROS (barber_profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS barber_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  specialty TEXT,
  bio TEXT,
  avatar TEXT,
  active BOOLEAN DEFAULT true,
  -- Permissões
  can_view_reports BOOLEAN DEFAULT false,
  can_manage_clients BOOLEAN DEFAULT true,
  can_manage_appointments BOOLEAN DEFAULT true,
  can_view_all_barbers BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABELA DE AGENDAMENTOS (appointments)
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABELA DE PACOTES DE CLIENTES (client_packages)
-- ============================================
CREATE TABLE IF NOT EXISTS client_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  expiration_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TABELA DE USO DE PACOTES (package_usage)
-- ============================================
CREATE TABLE IF NOT EXISTS package_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES client_packages(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. TABELA DE PROMOÇÕES (service_promotions)
-- ============================================
CREATE TABLE IF NOT EXISTS service_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5,2) NOT NULL,
  discounted_price DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. TABELA DE COMISSÕES (barber_commissions)
-- ============================================
CREATE TABLE IF NOT EXISTS barber_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  service_price DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. TABELA DE CONFIGURAÇÕES (settings)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_name TEXT DEFAULT 'San Patricio Barbearia',
  address TEXT,
  phone TEXT,
  email TEXT,
  opening_hours JSONB,
  commission_mode TEXT DEFAULT 'percentage' CHECK (commission_mode IN ('percentage', 'fixed')),
  default_commission_percentage DECIMAL(5,2) DEFAULT 50.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. TABELA DE NOTIFICAÇÕES (notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. TABELA DE LOGS DO SISTEMA (system_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_barber ON appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
CREATE POLICY "Usuários podem ver próprio perfil" ON users
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON users
  FOR UPDATE USING (id = auth.uid());

-- Políticas para CLIENTS  
CREATE POLICY "Todos podem ver clientes" ON clients
  FOR SELECT USING (true);

CREATE POLICY "Todos podem criar clientes" ON clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos podem atualizar clientes" ON clients
  FOR UPDATE USING (true);

-- Políticas para SERVICES
CREATE POLICY "Todos podem ver serviços" ON services
  FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar serviços" ON services
  FOR ALL USING (true);

-- Políticas para APPOINTMENTS
CREATE POLICY "Todos podem ver agendamentos" ON appointments
  FOR SELECT USING (true);

CREATE POLICY "Todos podem criar agendamentos" ON appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos podem atualizar agendamentos" ON appointments
  FOR UPDATE USING (true);

-- Políticas para outros (permissivo por enquanto)
CREATE POLICY "Permitir tudo" ON barber_profiles FOR ALL USING (true);
CREATE POLICY "Permitir tudo" ON client_packages FOR ALL USING (true);
CREATE POLICY "Permitir tudo" ON package_usage FOR ALL USING (true);
CREATE POLICY "Permitir tudo" ON service_promotions FOR ALL USING (true);
CREATE POLICY "Permitir tudo" ON barber_commissions FOR ALL USING (true);
CREATE POLICY "Permitir tudo" ON settings FOR ALL USING (true);
CREATE POLICY "Permitir tudo" ON notifications FOR ALL USING (true);
CREATE POLICY "Permitir tudo" ON system_logs FOR ALL USING (true);

-- ============================================
-- 16. DADOS INICIAIS
-- ============================================

-- Inserir configuração padrão
INSERT INTO settings (barbershop_name, default_commission_percentage)
VALUES ('San Patricio Barbearia', 50.00)
ON CONFLICT DO NOTHING;

-- Inserir usuários de teste
INSERT INTO users (id, email, name, phone, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@barbearia.com', 'Rafael', '(11) 98765-4321', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'carlos@barbearia.com', 'Kaue', '(11) 91234-5678', 'barber'),
  ('33333333-3333-3333-3333-333333333333', 'miguel@barbearia.com', 'Oscar', '(11) 99876-5432', 'barber')
ON CONFLICT (email) DO NOTHING;

-- Inserir perfis de barbeiros
INSERT INTO barber_profiles (id, user_id, specialty, can_view_reports, can_manage_clients, can_manage_appointments) VALUES
  ('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Cortes masculinos', true, true, true),
  ('bbbb2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Barbas e acabamentos', false, true, true)
ON CONFLICT (id) DO NOTHING;

-- Atualizar barber_profile_id nos usuários
UPDATE users SET barber_profile_id = 'bbbb1111-1111-1111-1111-111111111111', specialty = 'Cortes masculinos' 
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE users SET barber_profile_id = 'bbbb2222-2222-2222-2222-222222222222', specialty = 'Barbas e acabamentos'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Inserir serviços de exemplo
INSERT INTO services (name, description, price, duration) VALUES
  ('Corte Masculino', 'Corte tradicional masculino', 50.00, 30),
  ('Barba', 'Aparar e modelar barba', 35.00, 20),
  ('Corte + Barba', 'Combo completo', 75.00, 45),
  ('Sobrancelha', 'Design de sobrancelhas', 25.00, 15),
  ('Luzes', 'Mechas e luzes', 150.00, 90)
ON CONFLICT DO NOTHING;

-- Inserir clientes de exemplo
INSERT INTO clients (name, phone, email) VALUES
  ('João Silva', '(11) 91234-5678', 'joao@email.com'),
  ('Pedro Santos', '(11) 98765-4321', 'pedro@email.com'),
  ('Carlos Oliveira', '(11) 99999-8888', 'carlos@email.com')
ON CONFLICT DO NOTHING;

-- ============================================
-- SCRIPT CONCLUÍDO!
-- ============================================
-- Próximo passo: Criar usuários de autenticação no Supabase Auth
-- Isso será feito separadamente via API
-- ============================================
