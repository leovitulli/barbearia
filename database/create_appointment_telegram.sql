-- ============================================================
-- FUNÇÕES AUXILIARES COMPLETAS DO TELEGRAM (GPT MAKER)
-- Execute no SQL Editor do Supabase para ativar todas as funções
-- ============================================================

-- ====================================================
-- 1. CRIAR AGENDAMENTO (função principal)
-- ====================================================
CREATE OR REPLACE FUNCTION public.create_appointment_telegram(
  p_cliente_nome TEXT,
  p_cliente_telefone TEXT,
  p_barbeiro_nome TEXT,
  p_servico_nome TEXT,
  p_data DATE,
  p_horario TIME,
  p_cliente_email TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'confirmed'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
  v_barber_id UUID;
  v_service_id UUID;
  v_appointment_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM public.clients
  WHERE phone = p_cliente_telefone
  OR (p_cliente_email IS NOT NULL AND email = p_cliente_email)
  LIMIT 1;

  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (name, phone, email)
    VALUES (p_cliente_nome, p_cliente_telefone, p_cliente_email)
    RETURNING id INTO v_client_id;
  ELSE
    UPDATE public.clients SET name = p_cliente_nome WHERE id = v_client_id;
  END IF;

  SELECT bp.id INTO v_barber_id
  FROM public.barber_profiles bp
  JOIN public.users u ON bp.user_id = u.id
  WHERE u.name ILIKE '%' || p_barbeiro_nome || '%'
  AND bp.active = true LIMIT 1;

  IF v_barber_id IS NULL AND p_barbeiro_nome NOT ILIKE '%qualquer%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Barbeiro não encontrado: ' || p_barbeiro_nome);
  END IF;

  SELECT id INTO v_service_id FROM public.services
  WHERE name ILIKE '%' || p_servico_nome || '%' AND active = true LIMIT 1;

  IF v_service_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Serviço não encontrado: ' || p_servico_nome);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE barber_id = v_barber_id AND appointment_date = p_data
    AND appointment_time = p_horario AND status != 'cancelled'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Horário indisponível para este barbeiro.');
  END IF;

  INSERT INTO public.appointments (client_id, barber_id, service_id, appointment_date, appointment_time, status, created_at)
  VALUES (v_client_id, v_barber_id, v_service_id, p_data, p_horario, p_status, NOW())
  RETURNING id INTO v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', '✅ Agendamento confirmado! ' || p_cliente_nome || ' — ' || p_servico_nome || ' com ' || p_barbeiro_nome || ' em ' || TO_CHAR(p_data, 'DD/MM/YYYY') || ' às ' || TO_CHAR(p_horario, 'HH24:MI') || '.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ====================================================
-- 2. BUSCAR CLIENTE POR TELEFONE
-- ====================================================
CREATE OR REPLACE FUNCTION public.buscar_cliente_por_telefone_telegram(
  p_telefone TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client JSONB;
  v_appointment JSONB;
  v_perdido BOOLEAN := false;
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := regexp_replace(p_telefone, '[^0-9]', '', 'g');

  SELECT jsonb_build_object(
    'id', c.id,
    'nome', c.name,
    'telefone', c.phone,
    'email', c.email
  ) INTO v_client
  FROM public.clients c
  WHERE regexp_replace(c.phone, '[^0-9]', '', 'g') = v_clean_phone
  LIMIT 1;

  IF v_client IS NULL THEN
    RETURN jsonb_build_object('encontrado', false, 'message', 'Cliente não cadastrado. Vamos criar seu perfil!');
  END IF;

  -- Buscar próximo agendamento futuro real (data futura OU hoje mas horário ainda não passou)
  SELECT jsonb_build_object(
    'servico', s.name,
    'barbeiro', u.name,
    'data', TO_CHAR(a.appointment_date, 'DD/MM/YYYY'),
    'horario', TO_CHAR(a.appointment_time, 'HH24:MI'),
    'perdido', false
  ) INTO v_appointment
  FROM public.appointments a
  JOIN public.services s ON a.service_id = s.id
  JOIN public.barber_profiles bp ON a.barber_id = bp.id
  JOIN public.users u ON bp.user_id = u.id
  WHERE a.client_id = (v_client->>'id')::UUID
  AND a.status != 'cancelled'
  AND (
    a.appointment_date > CURRENT_DATE
    OR (a.appointment_date = CURRENT_DATE AND a.appointment_time > (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME)
  )
  ORDER BY a.appointment_date, a.appointment_time
  LIMIT 1;

  -- Se não achou futuro, verificar se tem um agendamento perdido hoje
  IF v_appointment IS NULL THEN
    SELECT jsonb_build_object(
      'servico', s.name,
      'barbeiro', u.name,
      'data', TO_CHAR(a.appointment_date, 'DD/MM/YYYY'),
      'horario', TO_CHAR(a.appointment_time, 'HH24:MI'),
      'perdido', true
    ) INTO v_appointment
    FROM public.appointments a
    JOIN public.services s ON a.service_id = s.id
    JOIN public.barber_profiles bp ON a.barber_id = bp.id
    JOIN public.users u ON bp.user_id = u.id
    WHERE a.client_id = (v_client->>'id')::UUID
    AND a.status != 'cancelled'
    AND a.appointment_date = CURRENT_DATE
    AND a.appointment_time <= (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'encontrado', true,
    'cliente', v_client,
    'proximo_agendamento', v_appointment
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('encontrado', false, 'error', SQLERRM);
END;
$$;

-- ====================================================
-- 3. VERIFICAR DISPONIBILIDADE
-- ====================================================
CREATE OR REPLACE FUNCTION public.verificar_disponibilidade_telegram(
  p_barbeiro_nome TEXT,
  p_data DATE,
  p_horario_preferido TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_barber_id UUID;
  v_horarios_ocupados TIME[];
  v_horarios_livres TEXT[];
  v_h INT;
  v_slot TIME;
  v_slot_str TEXT;
  v_day_of_week INT;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_data);

  IF v_day_of_week = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'A barbearia está fechada aos domingos. Escolha outro dia!', 'horarios_livres', '[]'::jsonb);
  END IF;

  IF p_barbeiro_nome NOT ILIKE '%qualquer%' THEN
    SELECT bp.id INTO v_barber_id
    FROM public.barber_profiles bp
    JOIN public.users u ON bp.user_id = u.id
    WHERE u.name ILIKE '%' || p_barbeiro_nome || '%' AND bp.active = true LIMIT 1;
  END IF;

  SELECT array_agg(appointment_time) INTO v_horarios_ocupados
  FROM public.appointments
  WHERE (barber_id = v_barber_id OR v_barber_id IS NULL)
  AND appointment_date = p_data AND status != 'cancelled';

  -- Gerar horários livres (09:00 às 18:30, cada 30min)
  FOR v_h IN 9..18 LOOP
    FOREACH v_slot IN ARRAY ARRAY[
      MAKE_TIME(v_h, 0, 0),
      MAKE_TIME(v_h, 30, 0)
    ] LOOP
      IF v_slot > '18:30'::TIME THEN CONTINUE; END IF;
      IF v_day_of_week = 6 AND v_slot > '17:30'::TIME THEN CONTINUE; END IF;
      
      -- Se for hoje, não mostrar horários que já passaram (Horário de Brasília)
      IF p_data = CURRENT_DATE AND v_slot <= (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME THEN
        CONTINUE;
      END IF;

      IF NOT (v_horarios_ocupados @> ARRAY[v_slot]) OR v_horarios_ocupados IS NULL THEN
        v_slot_str := TO_CHAR(v_slot, 'HH24:MI');
        v_horarios_livres := array_append(v_horarios_livres, v_slot_str);
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'barbeiro', COALESCE(p_barbeiro_nome, 'Qualquer'),
    'data', TO_CHAR(p_data, 'DD/MM/YYYY'),
    'horarios_livres', to_jsonb(COALESCE(v_horarios_livres, '{}'::TEXT[])),
    'total', COALESCE(array_length(v_horarios_livres, 1), 0)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ====================================================
-- 4. LISTAR SERVIÇOS
-- ====================================================
CREATE OR REPLACE FUNCTION public.listar_servicos_telegram()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_servicos JSONB;
BEGIN
  -- Buscar todos os serviços ativos
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'nome', name,
    'preco', 'R$ ' || price::text,
    'descricao', COALESCE(description, ''),
    'duracao', duration || ' min'
  )), '[]'::jsonb) INTO v_servicos
  FROM public.services
  WHERE active = true;

  RETURN jsonb_build_object(
    'success', true,
    'servicos', v_servicos
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ====================================================
-- 5. LISTAR BARBEIROS
-- ====================================================
CREATE OR REPLACE FUNCTION public.listar_barbeiros_telegram()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'barbeiros', (
      SELECT jsonb_agg(jsonb_build_object(
        'nome', u.name,
        'avaliacao', ROUND(bp.rating::numeric, 1),
        'especialidade', bp.specialty
      ))
      FROM public.barber_profiles bp
      JOIN public.users u ON bp.user_id = u.id
      WHERE bp.active = true
    )
  );
END;
$$;

-- ====================================================
-- 6. REMARCAR AGENDAMENTO
-- ====================================================
CREATE OR REPLACE FUNCTION public.remarcar_agendamento_telegram(
  p_telefone TEXT,
  p_nova_data DATE,
  p_novo_horario TIME,
  p_barbeiro_nome TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
  v_barber_id UUID;
  v_appointment_id UUID;
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := regexp_replace(p_telefone, '[^0-9]', '', 'g');

  SELECT id INTO v_client_id FROM public.clients
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = v_clean_phone LIMIT 1;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cliente não encontrado.');
  END IF;

  -- Pegar o agendamento mais próximo futuro
  SELECT id INTO v_appointment_id FROM public.appointments
  WHERE client_id = v_client_id AND appointment_date >= CURRENT_DATE AND status != 'cancelled'
  ORDER BY appointment_date, appointment_time LIMIT 1;

  IF v_appointment_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum agendamento futuro encontrado.');
  END IF;

  IF p_barbeiro_nome IS NOT NULL THEN
    SELECT bp.id INTO v_barber_id
    FROM public.barber_profiles bp
    JOIN public.users u ON bp.user_id = u.id
    WHERE u.name ILIKE '%' || p_barbeiro_nome || '%' AND bp.active = true LIMIT 1;
  END IF;

  UPDATE public.appointments
  SET appointment_date = p_nova_data,
      appointment_time = p_novo_horario,
      barber_id = COALESCE(v_barber_id, barber_id),
      updated_at = NOW()
  WHERE id = v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', '✅ Agendamento remarcado para ' || TO_CHAR(p_nova_data, 'DD/MM/YYYY') || ' às ' || TO_CHAR(p_novo_horario, 'HH24:MI') || '!'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ====================================================
-- 7. CANCELAR AGENDAMENTO (com validação de telefone)
-- ====================================================
CREATE OR REPLACE FUNCTION public.cancelar_agendamento_telegram(
  p_telefone TEXT
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
  -- Limpar telefone
  v_clean_phone := regexp_replace(p_telefone, '[^0-9]', '', 'g');

  -- Validar: cliente existe com este telefone?
  SELECT id INTO v_client_id FROM public.clients
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = v_clean_phone LIMIT 1;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum cliente encontrado com este telefone.');
  END IF;

  -- Buscar o próximo agendamento futuro deste cliente
  SELECT
    a.id,
    s.name,
    u.name,
    TO_CHAR(a.appointment_date, 'DD/MM/YYYY'),
    TO_CHAR(a.appointment_time, 'HH24:MI')
  INTO v_appointment_id, v_servico, v_barbeiro, v_data, v_horario
  FROM public.appointments a
  JOIN public.services s ON a.service_id = s.id
  JOIN public.barber_profiles bp ON a.barber_id = bp.id
  JOIN public.users u ON bp.user_id = u.id
  WHERE a.client_id = v_client_id
  AND a.status != 'cancelled'
  AND (
    a.appointment_date > CURRENT_DATE
    OR (a.appointment_date = CURRENT_DATE AND a.appointment_time > (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME)
  )
  ORDER BY a.appointment_date, a.appointment_time
  LIMIT 1;

  IF v_appointment_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum agendamento futuro encontrado para cancelar.');
  END IF;

  -- Cancelar
  UPDATE public.appointments
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', '❌ Agendamento cancelado: ' || v_servico || ' com ' || v_barbeiro || ' em ' || v_data || ' às ' || v_horario || '. Esperamos te ver em breve! 😊'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ====================================================
-- PERMISSÕES
-- ====================================================
GRANT EXECUTE ON FUNCTION public.create_appointment_telegram(TEXT, TEXT, TEXT, TEXT, DATE, TIME, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_cliente_por_telefone_telegram(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_disponibilidade_telegram(TEXT, DATE, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_servicos_telegram() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_barbeiros_telegram() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remarcar_agendamento_telegram(TEXT, DATE, TIME, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_agendamento_telegram(TEXT) TO anon, authenticated;
