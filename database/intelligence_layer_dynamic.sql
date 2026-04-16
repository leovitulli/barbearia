-- ============================================================
-- 🧠 SISTEMA VIVO - SAN PATRICIO BARBEARIA
-- 100% ORIENTADO A DADOS (SEM CONFIGURAÇÕES FIXAS NO CÓDIGO)
-- ============================================================

-- 1. ESTRUTURA DE CONFIGURAÇÃO UNIVERSAL
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_name TEXT DEFAULT 'San Patricio Barbearia',
  opening_hours JSONB,
  default_commission_percentage DECIMAL(5,2) DEFAULT 50.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FUNÇÃO: Motor de Preços e Promoções (O Cérebro Financeiro)
CREATE OR REPLACE FUNCTION public.calculate_active_price(p_service_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql AS $$
DECLARE
  v_base_price NUMERIC;
  v_promo_price NUMERIC;
  v_day_of_week INTEGER := EXTRACT(DOW FROM NOW());
BEGIN
  SELECT price INTO v_base_price FROM public.services WHERE id = p_service_id;
  
  SELECT 
    CASE 
      WHEN p.discount_type = 'percentage' THEN v_base_price * (1 - p.discount_value / 100)
      WHEN p.discount_type = 'fixed' THEN v_base_price - p.discount_value
    END INTO v_promo_price
  FROM public.service_promotions p
  WHERE p.service_id = p_service_id 
    AND p.is_active = true
    AND (v_day_of_week = ANY(p.weekdays) OR p.type = 'fixed')
  LIMIT 1;

  RETURN COALESCE(v_promo_price, v_base_price);
END;
$$;

-- 3. FUNÇÃO: Listagem Dinâmica de Serviços (Para o Robô)
CREATE OR REPLACE FUNCTION public.bot_v1_list_services()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'servicos', (
      SELECT jsonb_agg(jsonb_build_object(
        'nome', s.name,
        'preco_venda', 'R$ ' || public.calculate_active_price(s.id)::TEXT,
        'duracao', s.duration || ' min',
        'detalhes', COALESCE(s.description, '')
      ))
      FROM public.services s
      WHERE s.active = true
      ORDER BY s.name
    )
  );
END;
$$;

-- 4. FUNÇÃO: Listagem Dinâmica de Barbeiros (Com Perfil Completo)
CREATE OR REPLACE FUNCTION public.bot_v1_list_staff()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'equipe', (
      SELECT jsonb_agg(jsonb_build_object(
        'nome', b.name,
        'especialidade', b.specialty,
        'avaliacao', b.rating || ' ⭐',
        'bio', b.bio,
        'foto', b.avatar
      ))
      FROM public.barber_profiles b
      WHERE b.is_active = true AND b.active = true
      ORDER BY b.rating DESC
    )
  );
END;
$$;

-- 5. FUNÇÃO: Gerador de Slots de 10 minutos (Seguindo Configurações)
CREATE OR REPLACE FUNCTION public.bot_v1_get_available_slots(p_date DATE, p_barber_name TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_working_hours JSONB;
  v_day_name TEXT := trim(lower(to_char(p_date, 'day')));
  v_config JSONB;
  v_open TIME; v_close TIME; v_is_closed BOOLEAN;
  v_barber_id UUID;
  v_slots TEXT[] := '{}';
  v_cursor TIME;
BEGIN
  -- Lê as configurações da tabela settings (padrao do projeto)
  SELECT opening_hours INTO v_working_hours FROM public.settings LIMIT 1;
  v_config := v_working_hours->v_day_name;
  v_is_closed := (v_config->>'closed')::BOOLEAN;

  IF v_is_closed OR v_config IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Fechado.');
  END IF;

  v_open := (v_config->>'open')::TIME;
  v_close := (v_config->>'close')::TIME;

  -- Filtro por Barbeiro se solicitado (Vinculado a users no agendamento)
  IF p_barber_name IS NOT NULL AND p_barber_name NOT ILIKE '%qualquer%' THEN
    SELECT id INTO v_barber_id FROM public.users WHERE name ILIKE '%' || p_barber_name || '%' LIMIT 1;
  END IF;

  v_cursor := v_open;
  WHILE v_cursor < v_close LOOP
    IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE appointment_date = p_date AND appointment_time = v_cursor AND status = 'confirmed' AND (v_barber_id IS NULL OR barber_id = v_barber_id)) THEN
      v_slots := array_append(v_slots, TO_CHAR(v_cursor, 'HH24:MI'));
    END IF;
    v_cursor := v_cursor + interval '10 minutes';
  END LOOP;

  RETURN jsonb_build_object('success', true, 'data', p_date, 'horarios', to_jsonb(v_slots));
END;
$$;
