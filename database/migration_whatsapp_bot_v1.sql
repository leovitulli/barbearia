-- ============================================================
-- MIGRATION: WhatsApp Bot Functions (v1)
-- San Patricio Barbearia
-- ============================================================
-- Execução: Cole este arquivo inteiro no SQL Editor do Supabase
-- Substitui todas as funções *_telegram por bot_v1_*
-- agnósticas a canal (funciona com Telegram, WhatsApp, etc.)
-- ============================================================

-- ============================================================
-- 1. MIGRATION: Adicionar colunas WhatsApp nas tabelas existentes
-- ============================================================

-- Adicionar whatsapp_jid na tabela clients (identificador único do WA)
-- O JID no WhatsApp é o número completo: 5511999999999@s.whatsapp.net
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS whatsapp_jid TEXT,
  ADD COLUMN IF NOT EXISTS wa_profile_name TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'presencial'; -- 'presencial' | 'whatsapp' | 'telegram'

-- Adicionar rastreabilidade de canal nos agendamentos
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS booking_channel TEXT DEFAULT 'presencial', -- 'presencial' | 'whatsapp' | 'bot'
  ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Índice para busca rápida por JID do WhatsApp
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp_jid ON public.clients (whatsapp_jid);

-- Índice para busca por número de telefone normalizado
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients (phone);

-- Índice para busca por whatsapp
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON public.clients (whatsapp);

-- ============================================================
-- 2. FUNÇÃO UTILITÁRIA: Normalizar número de telefone
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_normalize_phone(p_phone TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  -- Remove tudo que não é número
  RETURN regexp_replace(p_phone, '[^0-9]', '', 'g');
END;
$$;

-- ============================================================
-- 3. FUNÇÃO: Identificar/Criar cliente pelo JID ou telefone
-- Núcleo da integração WhatsApp — usa o sender_id nativo
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_v1_upsert_client(
  p_phone TEXT,                    -- Número bruto do cliente (ex: 5511999999999)
  p_name TEXT DEFAULT NULL,        -- Nome do perfil WhatsApp
  p_whatsapp_jid TEXT DEFAULT NULL -- JID completo: 5511999999999@s.whatsapp.net
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
  v_clean_phone TEXT;
  v_is_new BOOLEAN := false;
BEGIN
  v_clean_phone := bot_normalize_phone(p_phone);

  -- Buscar pelo JID primeiro (mais preciso no WhatsApp)
  IF p_whatsapp_jid IS NOT NULL THEN
    SELECT id INTO v_client_id FROM public.clients
    WHERE whatsapp_jid = p_whatsapp_jid LIMIT 1;
  END IF;

  -- Fallback: buscar por telefone normalizado
  IF v_client_id IS NULL THEN
    SELECT id INTO v_client_id FROM public.clients
    WHERE bot_normalize_phone(phone) = v_clean_phone
       OR bot_normalize_phone(COALESCE(whatsapp, '')) = v_clean_phone
    LIMIT 1;
  END IF;

  -- Criar cliente se não existe
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (name, phone, whatsapp, whatsapp_jid, wa_profile_name, channel)
    VALUES (
      COALESCE(p_name, 'Cliente WhatsApp'),
      v_clean_phone,
      v_clean_phone,
      p_whatsapp_jid,
      p_name,
      'whatsapp'
    )
    RETURNING id INTO v_client_id;
    v_is_new := true;
  ELSE
    -- Atualizar dados do WhatsApp se o cliente já existia mas veio pelo canal
    UPDATE public.clients SET
      whatsapp_jid = COALESCE(p_whatsapp_jid, whatsapp_jid),
      wa_profile_name = COALESCE(p_name, wa_profile_name),
      whatsapp = COALESCE(v_clean_phone, whatsapp),
      name = CASE WHEN p_name IS NOT NULL AND name = 'Cliente WhatsApp' THEN p_name ELSE name END,
      channel = 'whatsapp',
      updated_at = NOW()
    WHERE id = v_client_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'client_id', v_client_id,
    'is_new', v_is_new
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 4. FUNÇÃO PRINCIPAL: Criar Agendamento via Bot (WhatsApp)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_v1_create_appointment(
  p_phone TEXT,                         -- Telefone/JID do cliente (sender_id do WhatsApp)
  p_barber_name TEXT,                   -- Nome do barbeiro ou 'qualquer'
  p_service_name TEXT,                  -- Nome do serviço
  p_date DATE,                          -- Data do agendamento
  p_time TIME,                          -- Hora do agendamento
  p_client_name TEXT DEFAULT NULL,      -- Nome do cliente (do perfil WA)
  p_whatsapp_jid TEXT DEFAULT NULL,     -- JID completo do WhatsApp
  p_channel TEXT DEFAULT 'whatsapp'     -- Canal de origem
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_result JSONB;
  v_client_id UUID;
  v_barber_id UUID;
  v_service_id UUID;
  v_service_price DECIMAL(10,2);
  v_service_duration INTEGER;
  v_appointment_id UUID;
BEGIN
  -- 1. Identificar/criar cliente pelo telefone/JID
  v_client_result := bot_v1_upsert_client(p_phone, p_client_name, p_whatsapp_jid);
  IF NOT (v_client_result->>'success')::BOOLEAN THEN
    RETURN v_client_result;
  END IF;
  v_client_id := (v_client_result->>'client_id')::UUID;

  -- 2. Resolver barbeiro
  IF p_barber_name IS NOT NULL AND p_barber_name NOT ILIKE '%qualquer%' THEN
    SELECT bp.id INTO v_barber_id
    FROM public.barber_profiles bp
    JOIN public.users u ON bp.user_id = u.id
    WHERE u.name ILIKE '%' || p_barber_name || '%'
      AND bp.active = true
    LIMIT 1;

    IF v_barber_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Barbeiro "' || p_barber_name || '" não encontrado. Tente "qualquer" para o primeiro disponível.'
      );
    END IF;
  END IF;
  -- Se não especificou barbeiro, v_barber_id fica NULL = primeiro livre

  -- 3. Resolver serviço
  SELECT id, price, duration INTO v_service_id, v_service_price, v_service_duration
  FROM public.services
  WHERE name ILIKE '%' || p_service_name || '%' AND active = true
  LIMIT 1;

  IF v_service_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Serviço "' || p_service_name || '" não encontrado. Digite "serviços" para ver os disponíveis.'
    );
  END IF;

  -- 4. Verificar conflito de horário
  IF v_barber_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.appointments
    WHERE barber_id = v_barber_id
      AND appointment_date = p_date
      AND appointment_time = p_time
      AND status NOT IN ('cancelled')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Horário ' || TO_CHAR(p_time, 'HH24:MI') || ' já está ocupado. Digite "horários" para ver os disponíveis.'
    );
  END IF;

  -- 5. Criar agendamento
  INSERT INTO public.appointments (
    client_id, barber_id, service_id,
    appointment_date, appointment_time,
    status, total_price, original_price,
    booking_channel, created_at
  )
  VALUES (
    v_client_id, v_barber_id, v_service_id,
    p_date, p_time,
    'confirmed', v_service_price, v_service_price,
    p_channel, NOW()
  )
  RETURNING id INTO v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'message', '✅ Agendamento confirmado!' ||
      E'\n📋 *' || p_service_name || '*' ||
      E'\n📅 ' || TO_CHAR(p_date, 'DD/MM/YYYY') ||
      E'\n⏰ ' || TO_CHAR(p_time, 'HH24:MI') ||
      E'\n✂️ ' || COALESCE(p_barber_name, 'Primeiro disponível') ||
      E'\n💰 R$ ' || v_service_price::TEXT ||
      E'\n\n_Até lá! A San Patricio te espera! 🪒_'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 5. FUNÇÃO: Estado do cliente (histórico + próximo agendamento)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_v1_get_client_state(
  p_phone TEXT,
  p_whatsapp_jid TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client JSONB;
  v_next_appointment JSONB;
  v_clean_phone TEXT;
  v_client_id UUID;
BEGIN
  v_clean_phone := bot_normalize_phone(p_phone);

  -- Buscar cliente
  SELECT
    jsonb_build_object(
      'id', c.id,
      'nome', c.name,
      'telefone', c.phone,
      'email', c.email,
      'total_visitas', (
        SELECT COUNT(*) FROM public.appointments
        WHERE client_id = c.id AND status = 'completed'
      )
    )
  INTO v_client
  FROM public.clients c
  WHERE
    (p_whatsapp_jid IS NOT NULL AND c.whatsapp_jid = p_whatsapp_jid)
    OR bot_normalize_phone(c.phone) = v_clean_phone
    OR bot_normalize_phone(COALESCE(c.whatsapp, '')) = v_clean_phone
  LIMIT 1;

  IF v_client IS NULL THEN
    RETURN jsonb_build_object(
      'encontrado', false,
      'message', 'Olá! Parece que é sua primeira vez aqui. Vamos criar seu perfil! 😊 Me diga seu nome completo.'
    );
  END IF;

  v_client_id := (v_client->>'id')::UUID;

  -- Buscar próximo agendamento futuro
  SELECT jsonb_build_object(
    'servico', s.name,
    'barbeiro', u.name,
    'data', TO_CHAR(a.appointment_date, 'DD/MM/YYYY'),
    'horario', TO_CHAR(a.appointment_time, 'HH24:MI'),
    'status', a.status
  ) INTO v_next_appointment
  FROM public.appointments a
  JOIN public.services s ON a.service_id = s.id
  JOIN public.barber_profiles bp ON a.barber_id = bp.id
  JOIN public.users u ON bp.user_id = u.id
  WHERE a.client_id = v_client_id
    AND a.status = 'confirmed'
    AND (
      a.appointment_date > CURRENT_DATE OR
      (a.appointment_date = CURRENT_DATE AND
       a.appointment_time > (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME)
    )
  ORDER BY a.appointment_date, a.appointment_time
  LIMIT 1;

  RETURN jsonb_build_object(
    'encontrado', true,
    'cliente', v_client,
    'proximo_agendamento', v_next_appointment
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('encontrado', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 6. FUNÇÃO: Listar horários disponíveis (agnóstico)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_v1_get_available_slots(
  p_date DATE,
  p_barber_name TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_barber_id UUID;
  v_day_of_week INTEGER;
  v_slots TEXT[] := '{}';
  v_slot TIME;
  v_hour INTEGER;
  v_now_br TIME;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);
  v_now_br := (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME;

  -- Domingo = fechado
  IF v_day_of_week = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '😴 A San Patricio está fechada aos domingos. Que tal outro dia? De segunda a sábado estamos te esperando!'
    );
  END IF;

  -- Resolver barbeiro
  IF p_barber_name IS NOT NULL AND p_barber_name NOT ILIKE '%qualquer%' THEN
    SELECT bp.id INTO v_barber_id
    FROM public.barber_profiles bp
    JOIN public.users u ON bp.user_id = u.id
    WHERE u.name ILIKE '%' || p_barber_name || '%' AND bp.active = true
    LIMIT 1;
  END IF;

  -- Gerar slots (09:00 a 19:00, cada 30 min; sábado até 18:00)
  FOR v_hour IN 9..19 LOOP
    FOREACH v_slot IN ARRAY ARRAY[
      MAKE_TIME(v_hour, 0, 0),
      MAKE_TIME(v_hour, 30, 0)
    ] LOOP
      -- Limites de horário
      IF v_slot > '19:00'::TIME THEN CONTINUE; END IF;
      IF v_day_of_week = 6 AND v_slot > '18:00'::TIME THEN CONTINUE; END IF;

      -- Horários passados (hoje)
      IF p_date = CURRENT_DATE AND v_slot <= v_now_br THEN CONTINUE; END IF;

      -- Verificar ocupação
      IF NOT EXISTS (
        SELECT 1 FROM public.appointments
        WHERE appointment_date = p_date
          AND appointment_time = v_slot
          AND status NOT IN ('cancelled')
          AND (v_barber_id IS NULL OR barber_id = v_barber_id)
      ) THEN
        v_slots := array_append(v_slots, TO_CHAR(v_slot, 'HH24:MI'));
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'data', TO_CHAR(p_date, 'DD/MM/YYYY'),
    'barbeiro', COALESCE(p_barber_name, 'Qualquer disponível'),
    'horarios_livres', to_jsonb(v_slots),
    'total', array_length(v_slots, 1)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 7. FUNÇÃO: Cancelar agendamento via WhatsApp
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_v1_cancel_appointment(
  p_phone TEXT,
  p_whatsapp_jid TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
  v_appointment_id UUID;
  v_servico TEXT;
  v_barbeiro TEXT;
  v_data TEXT;
  v_horario TEXT;
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := bot_normalize_phone(p_phone);

  -- Localizar cliente
  SELECT id INTO v_client_id FROM public.clients
  WHERE
    (p_whatsapp_jid IS NOT NULL AND whatsapp_jid = p_whatsapp_jid)
    OR bot_normalize_phone(phone) = v_clean_phone
    OR bot_normalize_phone(COALESCE(whatsapp, '')) = v_clean_phone
  LIMIT 1;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Não encontrei nenhum cliente com este número. 🤔 Você já fez um agendamento conosco?'
    );
  END IF;

  -- Localizar próximo agendamento ativo
  SELECT
    a.id, s.name, u.name,
    TO_CHAR(a.appointment_date, 'DD/MM/YYYY'),
    TO_CHAR(a.appointment_time, 'HH24:MI')
  INTO v_appointment_id, v_servico, v_barbeiro, v_data, v_horario
  FROM public.appointments a
  JOIN public.services s ON a.service_id = s.id
  JOIN public.barber_profiles bp ON a.barber_id = bp.id
  JOIN public.users u ON bp.user_id = u.id
  WHERE a.client_id = v_client_id
    AND a.status = 'confirmed'
    AND (
      a.appointment_date > CURRENT_DATE OR
      (a.appointment_date = CURRENT_DATE AND
       a.appointment_time > (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME)
    )
  ORDER BY a.appointment_date, a.appointment_time
  LIMIT 1;

  IF v_appointment_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Você não tem nenhum agendamento futuro para cancelar. 😊'
    );
  END IF;

  -- Cancelar
  UPDATE public.appointments SET status = 'cancelled', updated_at = NOW()
  WHERE id = v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', '❌ Agendamento cancelado com sucesso!' ||
      E'\n\n📋 ' || v_servico ||
      ' com ' || v_barbeiro ||
      E'\n📅 ' || v_data || ' às ' || v_horario ||
      E'\n\nEsperamos te ver em breve! Para reagendar, é só chamar. 💈'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 8. FUNÇÃO: Listar serviços com preços (para o bot)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_v1_list_services()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'servicos', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'nome', name,
        'preco', 'R$ ' || price::TEXT,
        'duracao', duration || ' min',
        'descricao', COALESCE(description, '')
      ) ORDER BY name), '[]'::JSONB)
      FROM public.services WHERE active = true
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 9. FUNÇÃO: Listar barbeiros ativos (para o bot)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_v1_list_staff()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'barbeiros', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'nome', u.name,
        'especialidade', bp.specialty,
        'avaliacao', ROUND(bp.rating::NUMERIC, 1),
        'foto', bp.avatar
      ) ORDER BY u.name), '[]'::JSONB)
      FROM public.barber_profiles bp
      JOIN public.users u ON bp.user_id = u.id
      WHERE bp.active = true
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 10. FUNÇÃO: Remarcar agendamento (WhatsApp)
-- ============================================================
CREATE OR REPLACE FUNCTION public.bot_v1_reschedule_appointment(
  p_phone TEXT,
  p_new_date DATE,
  p_new_time TIME,
  p_barber_name TEXT DEFAULT NULL,
  p_whatsapp_jid TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
  v_barber_id UUID;
  v_appointment_id UUID;
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := bot_normalize_phone(p_phone);

  SELECT id INTO v_client_id FROM public.clients
  WHERE
    (p_whatsapp_jid IS NOT NULL AND whatsapp_jid = p_whatsapp_jid)
    OR bot_normalize_phone(phone) = v_clean_phone
    OR bot_normalize_phone(COALESCE(whatsapp, '')) = v_clean_phone
  LIMIT 1;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cliente não encontrado com este número.');
  END IF;

  SELECT id INTO v_appointment_id FROM public.appointments
  WHERE client_id = v_client_id
    AND status = 'confirmed'
    AND appointment_date >= CURRENT_DATE
  ORDER BY appointment_date, appointment_time
  LIMIT 1;

  IF v_appointment_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum agendamento futuro para remarcar.');
  END IF;

  -- Resolver barbeiro (opcional)
  IF p_barber_name IS NOT NULL AND p_barber_name NOT ILIKE '%qualquer%' THEN
    SELECT bp.id INTO v_barber_id
    FROM public.barber_profiles bp
    JOIN public.users u ON bp.user_id = u.id
    WHERE u.name ILIKE '%' || p_barber_name || '%' AND bp.active = true
    LIMIT 1;
  END IF;

  -- Verificar conflito no novo horário
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointment_date = p_new_date
      AND appointment_time = p_new_time
      AND status NOT IN ('cancelled')
      AND (v_barber_id IS NULL OR barber_id = v_barber_id)
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Horário indisponível. Tente outro horário ou data.'
    );
  END IF;

  UPDATE public.appointments SET
    appointment_date = p_new_date,
    appointment_time = p_new_time,
    barber_id = COALESCE(v_barber_id, barber_id),
    updated_at = NOW()
  WHERE id = v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', '✅ Reagendado com sucesso!' ||
      E'\n📅 ' || TO_CHAR(p_new_date, 'DD/MM/YYYY') ||
      ' às ' || TO_CHAR(p_new_time, 'HH24:MI') ||
      E'\n\nEsperamos você! 💈'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 11. PERMISSÕES: Liberar acesso ao bot (chamadas anon via API)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.bot_normalize_phone(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_v1_upsert_client(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_v1_create_appointment(TEXT, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_v1_get_client_state(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_v1_get_available_slots(DATE, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_v1_cancel_appointment(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_v1_list_services() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_v1_list_staff() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_v1_reschedule_appointment(TEXT, DATE, TIME, TEXT, TEXT) TO anon, authenticated;

-- ============================================================
-- 12. RETROCOMPATIBILIDADE: Manter funções _telegram como aliases
-- (Não apaga as antigas para não quebrar fluxos existentes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.lista_servicos_telegram_v2()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER AS $$
  SELECT bot_v1_list_services();
$$;

GRANT EXECUTE ON FUNCTION public.lista_servicos_telegram_v2() TO anon, authenticated;

-- ============================================================
-- FIM DA MIGRATION WHATSAPP v1
-- Execute este script no SQL Editor do Supabase →
-- https://supabase.com/dashboard/project/[SEU_PROJECT]/sql
-- ============================================================
