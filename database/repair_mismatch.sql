-- ============================================================
-- SCRIPT DE REPARAÇÃO: BARBEARIA SAN PATRICIO
-- OBJETIVO: Sincronizar banco de dados com Site e Robô
-- ============================================================

-- 1. CORRIGIR REFERÊNCIA DE BARBEIRO NOS AGENDAMENTOS
-- O site precisa que seja o ID do PERFIL do barbeiro (barber_profiles)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_barber_id_fkey;

-- Se o banco já tiver dados, precisamos limpar para o migration das referências
-- UPDATE appointments a SET barber_id = bp.id FROM barber_profiles bp WHERE bp.user_id = a.barber_id;

ALTER TABLE public.appointments 
  ADD CONSTRAINT appointments_barber_id_fkey 
  FOREIGN KEY (barber_id) REFERENCES public.barber_profiles(id) ON DELETE CASCADE;

-- 2. ATUALIZAR FUNÇÃO DE CRIAR AGENDAMENTO (ROBÔ)
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
    v_barber_profile_id UUID;
    v_service_id UUID;
BEGIN
    -- Identificar/Criar Cliente
    INSERT INTO public.clients (name, phone, email)
    VALUES (p_nome, p_telefone, p_email)
    ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, email = COALESCE(EXCLUDED.email, clients.email)
    RETURNING id INTO v_client_id;

    -- Buscar ID do Perfil do Barbeiro (Crucial para o Site mostrar)
    SELECT id INTO v_barber_profile_id FROM public.barber_profiles WHERE name ILIKE '%' || p_barbeiro_nome || '%' AND active = true LIMIT 1;
    
    -- Se não achou pelo nome no perfil, tenta o nome do usuário vinculado
    IF v_barber_profile_id IS NULL THEN
        SELECT bp.id INTO v_barber_profile_id FROM public.barber_profiles bp 
        JOIN public.users u ON bp.user_id = u.id
        WHERE u.name ILIKE '%' || p_barbeiro_nome || '%' LIMIT 1;
    END IF;

    -- Buscar ID do Serviço
    SELECT id INTO v_service_id FROM public.services WHERE name ILIKE '%' || p_servico_nome || '%' AND active = true LIMIT 1;

    IF v_service_id IS NULL OR v_barber_profile_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Serviço ou Barbeiro não encontrado');
    END IF;

    -- Inserir Agendamento com o ID de PERFIL
    INSERT INTO public.appointments (client_id, barber_id, service_id, appointment_date, appointment_time, status)
    VALUES (v_client_id, v_barber_profile_id, v_service_id, p_data, p_hora, 'confirmed');

    RETURN jsonb_build_object('success', true, 'message', 'Agendamento realizado com sucesso!');
END;
$$;

-- 3. ATUALIZAR FUNÇÃO DE REAGENDAR (ROBÔ)
CREATE OR REPLACE FUNCTION public.reagendar_agendamento_telegram(
    p_telefone TEXT,
    p_nova_data DATE DEFAULT NULL,
    p_novo_horario TIME DEFAULT NULL,
    p_novo_barbeiro_nome TEXT DEFAULT NULL,
    p_novo_servico_nome TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_active_appointment_id UUID;
    v_new_barber_profile_id UUID;
    v_new_service_id UUID;
BEGIN
    -- Buscar agendamento atual que não esteja cancelado e seja de hoje em diante
    SELECT a.id, a.barber_id, a.service_id INTO v_active_appointment_id, v_new_barber_profile_id, v_new_service_id
    FROM public.appointments a
    JOIN public.clients c ON a.client_id = c.id
    WHERE regexp_replace(c.phone, '\D', '', 'g') = regexp_replace(p_telefone, '\D', '', 'g')
    AND a.status = 'confirmed' AND a.appointment_date >= CURRENT_DATE
    ORDER BY a.appointment_date ASC LIMIT 1;

    IF v_active_appointment_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nenhum agendamento futuro encontrado');
    END IF;

    -- Traduzir nomes para IDs de Perfil se necessário
    IF p_novo_barbeiro_nome IS NOT NULL AND p_novo_barbeiro_nome <> '' THEN
        SELECT id INTO v_new_barber_profile_id FROM public.barber_profiles WHERE name ILIKE '%' || p_novo_barbeiro_nome || '%' LIMIT 1;
    END IF;

    IF p_novo_servico_nome IS NOT NULL AND p_novo_servico_nome <> '' THEN
        SELECT id INTO v_new_service_id FROM public.services WHERE name ILIKE '%' || p_novo_servico_nome || '%' LIMIT 1;
    END IF;

    UPDATE public.appointments SET
        appointment_date = COALESCE(p_nova_data, appointment_date),
        appointment_time = COALESCE(p_novo_horario, appointment_time),
        barber_id = v_new_barber_profile_id,
        service_id = v_new_service_id,
        updated_at = NOW()
    WHERE id = v_active_appointment_id;

    RETURN jsonb_build_object('success', true, 'message', 'Reagendado com sucesso!');
END;
$$;

-- 4. ATUALIZAR FUNÇÃO DE BUSCA (OI)
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

    -- Buscar agendamento futuro cruzando com Perfil (barber_profiles)
    SELECT a.appointment_date, a.appointment_time, s.name as servico, bp.name as barbeiro
    INTO v_agendamento
    FROM public.appointments a
    JOIN public.services s ON a.service_id = s.id
    JOIN public.barber_profiles bp ON a.barber_id = bp.id
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
        'hora', SUBSTRING(v_agendamento.appointment_time::TEXT, 1, 5),
        'servico', v_agendamento.servico,
        'barbeiro', v_agendamento.barbeiro
    );
END;
$$;

-- 5. DAR PERMISSÕES NOVAMENTE
GRANT EXECUTE ON FUNCTION public.create_appointment_telegram(TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TIME) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reagendar_agendamento_telegram(TEXT, DATE, TIME, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_atendimento_atual(TEXT) TO anon, authenticated;
