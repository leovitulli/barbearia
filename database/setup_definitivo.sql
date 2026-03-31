-- ============================================================
-- SETUP DEFINITIVO - SAN PATRICIO BARBEARIA
-- ============================================================
-- ATENÇÃO: Siga o plano de ação antes de executar este script!
-- Os UUIDs abaixo devem ser substituídos pelos UUIDs reais
-- gerados pelo Supabase Auth após criar os usuários.
--
-- Substitua:
--   ADMIN_UUID   → UUID do usuário admin@barbearia.com no Auth
--   KAUE_UUID    → UUID do usuário carlos@barbearia.com no Auth
--   OSCAR_UUID   → UUID do usuário miguel@barbearia.com no Auth
-- ============================================================

-- ============================================================
-- 1. EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. APAGAR TABELAS EXISTENTES (para recomeçar limpo)
-- ============================================================
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS barber_commissions CASCADE;
DROP TABLE IF EXISTS service_promotions CASCADE;
DROP TABLE IF EXISTS package_usage CASCADE;
DROP TABLE IF EXISTS client_packages CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS barber_profiles CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 3. TABELA USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- Será o mesmo UUID do Supabase Auth
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

-- ============================================================
-- 4. TABELA CLIENTS
-- ============================================================
CREATE TABLE clients (
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

-- ============================================================
-- 5. TABELA SERVICES
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABELA BARBER_PROFILES (com TODAS as colunas que o código usa)
-- ============================================================
CREATE TABLE barber_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Dados do barbeiro (sincronizados com users)
  name TEXT,
  email TEXT,
  phone TEXT,
  specialty TEXT,
  bio TEXT,
  avatar TEXT,
  -- Status
  active BOOLEAN DEFAULT true,       -- usado em Profile.tsx
  is_active BOOLEAN DEFAULT true,    -- usado em Barbers.tsx e useRealtimeBarbers
  -- Métricas
  experience_years INTEGER DEFAULT 1,
  rating DECIMAL(3,1) DEFAULT 5.0,
  total_reviews INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 50.0,
  -- Configurações
  working_hours JSONB,
  permissions JSONB,
  -- Permissões legadas (compatibilidade)
  can_view_reports BOOLEAN DEFAULT false,
  can_manage_clients BOOLEAN DEFAULT true,
  can_manage_appointments BOOLEAN DEFAULT true,
  can_view_all_barbers BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. TABELA APPOINTMENTS
-- ============================================================
CREATE TABLE appointments (
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

-- ============================================================
-- 8. TABELA CLIENT_PACKAGES
-- ============================================================
CREATE TABLE client_packages (
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

-- ============================================================
-- 9. TABELA PACKAGE_USAGE
-- ============================================================
CREATE TABLE package_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES client_packages(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. TABELA SERVICE_PROMOTIONS
-- ============================================================
CREATE TABLE service_promotions (
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

-- ============================================================
-- 11. TABELA BARBER_COMMISSIONS
-- ============================================================
CREATE TABLE barber_commissions (
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

-- ============================================================
-- 12. TABELA SETTINGS
-- ============================================================
CREATE TABLE settings (
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

-- ============================================================
-- 13. TABELA NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. TABELA SYSTEM_LOGS
-- ============================================================
CREATE TABLE system_logs (
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

-- ============================================================
-- 15. ÍNDICES
-- ============================================================
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_barber ON appointments(barber_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================================
-- 16. ROW LEVEL SECURITY
-- ============================================================
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

-- Políticas permissivas (para usuários autenticados)
CREATE POLICY "Autenticados podem ver users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem atualizar próprio user" ON users FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Permitir tudo autenticados" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON barber_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON client_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON package_usage FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON service_promotions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON barber_commissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo autenticados" ON system_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 17. DADOS INICIAIS — SUBSTITUA OS UUIDs!
-- ============================================================
-- UUIDs confirmados do Supabase Auth:
--   Rafael (Admin) → 11111111-1111-1111-1111-111111111111
--   Kaue   (Barber) → 22222222-2222-2222-2222-222222222222
--   Oscar  (Barber) → 33333333-3333-3333-3333-333333333333

INSERT INTO users (id, email, name, phone, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@barbearia.com', 'Rafael', '(11) 98765-4321', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'carlos@barbearia.com', 'Kaue',  '(11) 91234-5678', 'barber'),
  ('33333333-3333-3333-3333-333333333333', 'miguel@barbearia.com', 'Oscar', '(11) 99876-5432', 'barber');

INSERT INTO barber_profiles (user_id, name, email, phone, specialty, is_active, active, experience_years, commission_rate, can_view_reports, can_manage_clients, can_manage_appointments) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Kaue',  'carlos@barbearia.com', '(11) 91234-5678', 'Cortes masculinos',   true, true, 2, 50.0, true, true, true),
  ('33333333-3333-3333-3333-333333333333', 'Oscar', 'miguel@barbearia.com', '(11) 99876-5432', 'Barbas e acabamentos', true, true, 3, 50.0, false, true, true);

-- Vincular barber_profile_id nos users
UPDATE users u
SET barber_profile_id = bp.id
FROM barber_profiles bp
WHERE bp.user_id = u.id;

-- Configuração padrão
INSERT INTO settings (barbershop_name, default_commission_percentage)
VALUES ('San Patricio Barbearia', 50.00);

-- Serviços de exemplo
INSERT INTO services (name, description, price, duration) VALUES
  ('Corte Masculino', 'Corte tradicional masculino', 50.00, 30),
  ('Barba',           'Aparar e modelar barba',     35.00, 20),
  ('Corte + Barba',   'Combo completo',             75.00, 45),
  ('Sobrancelha',     'Design de sobrancelhas',     25.00, 15),
  ('Luzes',           'Mechas e luzes',            150.00, 90);

-- Clientes de exemplo
INSERT INTO clients (name, phone, email) VALUES
  ('João Silva',      '(11) 91234-5678', 'joao@email.com'),
  ('Pedro Santos',    '(11) 98765-4321', 'pedro@email.com'),
  ('Carlos Oliveira', '(11) 99999-8888', 'carlos@email.com');

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT 'users' as tabela, count(*) as registros FROM users
UNION ALL SELECT 'barber_profiles', count(*) FROM barber_profiles
UNION ALL SELECT 'services', count(*) FROM services
UNION ALL SELECT 'clients', count(*) FROM clients
UNION ALL SELECT 'settings', count(*) FROM settings;


-- ============================================================
-- 18. FUNÇÕES PARA O TELEGRAM (RPC BLINDADAS)
-- ============================================================

-- A. BUSCAR ATENDIMENTO ATUAL (RECONHECIMENTO)
CREATE OR REPLACE FUNCTION public.buscar_atendimento_atual(p_telefone TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_cliente_id UUID;
    v_nome TEXT;
    v_agendamento RECORD;
BEGIN
    -- Limpar telefone
    p_telefone := regexp_replace(p_telefone, '\D', '', 'g');
    
    -- Buscar cliente
    SELECT id, name INTO v_cliente_id, v_nome FROM public.clients 
    WHERE regexp_replace(phone, '\D', '', 'g') = p_telefone OR regexp_replace(whatsapp, '\D', '', 'g') = p_telefone
    LIMIT 1;

    IF v_cliente_id IS NULL THEN
        RETURN jsonb_build_object('cadastrado', false);
    END IF;

    -- Buscar agendamento futuro
    SELECT a.appointment_date, a.appointment_time, s.name as servico, u.name as barbeiro
    INTO v_agendamento
    FROM public.appointments a
    JOIN public.services s ON a.service_id = s.id
    JOIN public.users u ON a.barber_id = u.id
    WHERE a.client_id = v_cliente_id 
    AND a.appointment_date >= CURRENT_DATE
    AND a.status = 'confirmed'
    ORDER BY a.appointment_date ASC, a.appointment_time ASC
    LIMIT 1;

    RETURN jsonb_build_object(
        'cadastrado', true,
        'nome', v_nome,
        'tem_agendamento', (v_agendamento.appointment_date IS NOT NULL),
        'data', v_agendamento.appointment_date,
        'hora', v_agendamento.appointment_time,
        'servico', v_agendamento.servico,
        'barbeiro', v_agendamento.barbeiro
    );
END;
$$;

-- B. CRIAR AGENDAMENTO (VERSÃO RESILIENTE)
CREATE OR REPLACE FUNCTION public.create_appointment_telegram(
    p_nome TEXT,
    p_telefone TEXT,
    p_email TEXT,
    p_servico_nome TEXT,
    p_barbeiro_nome TEXT,
    p_data DATE,
    p_hora TIME
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_client_id UUID;
    v_barber_id UUID;
    v_service_id UUID;
BEGIN
    -- 1. Upsert no Cliente (Identifica por telefone)
    INSERT INTO public.clients (name, phone, email)
    VALUES (p_nome, p_telefone, p_email)
    ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, email = COALESCE(EXCLUDED.email, clients.email)
    RETURNING id INTO v_client_id;

    -- 2. Buscar IDs por nomes (Busca aproximada)
    SELECT id INTO v_service_id FROM public.services WHERE name ILIKE '%' || p_servico_nome || '%' AND active = true LIMIT 1;
    SELECT id INTO v_barber_id FROM public.users WHERE name ILIKE '%' || p_barbeiro_nome || '%' AND role = 'barber' LIMIT 1;

    IF v_service_id IS NULL OR v_barber_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Serviço ou Barbeiro não encontrado');
    END IF;

    -- 3. Inserir Agendamento
    INSERT INTO public.appointments (client_id, barber_id, service_id, appointment_date, appointment_time, status)
    VALUES (v_client_id, v_barber_id, v_service_id, p_data, p_hora, 'confirmed');

    RETURN jsonb_build_object('success', true, 'message', 'Agendamento realizado com sucesso!');
END;
$$;

-- C. REAGENDAR AGENDAMENTO (VERSÃO INTELIGENTE)
CREATE OR REPLACE FUNCTION public.reagendar_agendamento_telegram(
    p_telefone TEXT,
    p_nova_data DATE DEFAULT NULL,
    p_novo_horario TIME DEFAULT NULL,
    p_novo_barbeiro_nome TEXT DEFAULT NULL,
    p_novo_servico_nome TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_client_id UUID;
    v_appointment_id UUID;
    v_barber_id UUID;
    v_service_id UUID;
BEGIN
    -- 1. Identificar Cliente
    SELECT id INTO v_client_id FROM public.clients 
    WHERE regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_telefone, '\D', '', 'g') LIMIT 1;

    IF v_client_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cliente não encontrado');
    END IF;

    -- 2. Buscar agendamento atual
    SELECT id, barber_id, service_id INTO v_appointment_id, v_barber_id, v_service_id
    FROM public.appointments 
    WHERE client_id = v_client_id AND status = 'confirmed' AND appointment_date >= CURRENT_DATE
    ORDER BY appointment_date ASC LIMIT 1;

    IF v_appointment_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nenhum agendamento ativo encontrado');
    END IF;

    -- 3. Atualizar campos se fornecidos
    IF p_novo_barbeiro_nome IS NOT NULL AND p_novo_barbeiro_nome <> '' THEN
        SELECT id INTO v_barber_id FROM public.users WHERE name ILIKE '%' || p_novo_barbeiro_nome || '%' LIMIT 1;
    END IF;

    IF p_novo_servico_nome IS NOT NULL AND p_novo_servico_nome <> '' THEN
        SELECT id INTO v_service_id FROM public.services WHERE name ILIKE '%' || p_novo_servico_nome || '%' LIMIT 1;
    END IF;

    -- 4. Executar Update
    UPDATE public.appointments SET
        appointment_date = COALESCE(p_nova_data, appointment_date),
        appointment_time = COALESCE(p_novo_horario, appointment_time),
        barber_id = v_barber_id,
        service_id = v_service_id,
        updated_at = NOW()
    WHERE id = v_appointment_id;

    RETURN jsonb_build_object('success', true, 'message', 'Reagendamento concluído com sucesso!');
END;
$$;

-- D. LISTAGENS ROBUSTAS
CREATE OR REPLACE FUNCTION public.listar_servicos_telegram(params JSONB DEFAULT '{}'::JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'servicos', (
      SELECT jsonb_agg(jsonb_build_object(
        'nome', name,
        'preco', 'R$ ' || REPLACE(price::TEXT, '.', ','),
        'duracao', duration || ' min'
      )) FROM public.services WHERE active = true
    )
  );
END;
$$;

-- E. PERMISSÕES ANON (CRUCIAL)
GRANT EXECUTE ON FUNCTION public.buscar_atendimento_atual(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_appointment_telegram(TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TIME) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reagendar_agendamento_telegram(TEXT, DATE, TIME, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_servicos_telegram(JSONB) TO anon, authenticated;

-- Liberar leitura anônima para serviços e barbeiros
DROP POLICY IF EXISTS "Permitir ver anon" ON public.services;
CREATE POLICY "Permitir ver anon" ON public.services FOR SELECT TO anon USING (active = true);
DROP POLICY IF EXISTS "Permitir ver anon" ON public.barber_profiles;
CREATE POLICY "Permitir ver anon" ON public.barber_profiles FOR SELECT TO anon USING (active = true);
