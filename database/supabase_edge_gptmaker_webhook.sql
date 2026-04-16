-- ============================================================
-- FUNÇÃO: Receber webhook onFirstInteraction do GPT Maker
-- Aceita o payload nativo do GPT Maker e identifica/cria o cliente
-- URL: POST /rest/v1/rpc/bot_v1_gptmaker_webhook
-- ============================================================

CREATE OR REPLACE FUNCTION public.bot_v1_gptmaker_webhook(
  phone TEXT DEFAULT NULL,          -- Número nativo do WhatsApp (ex: 5511947916020)
  "contextId" TEXT DEFAULT NULL,    -- ID da sessão GPT Maker
  "chatName" TEXT DEFAULT NULL,     -- Nome do contato no WhatsApp
  message TEXT DEFAULT NULL         -- Primeira mensagem enviada
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_phone TEXT;
  v_result JSONB;
BEGIN
  -- Usa o phone nativo do GPT Maker (já vem no formato correto: 5511XXXXXXXXX)
  v_phone := COALESCE(phone, "contextId", '');

  IF v_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phone not provided');
  END IF;

  -- Chama a função de estado do cliente com o telefone real
  SELECT public.bot_v1_get_client_state(v_phone, v_phone) INTO v_result;

  -- Se cliente novo, cria com o nome do WhatsApp se disponível
  IF (v_result->>'encontrado')::boolean = false AND "chatName" IS NOT NULL AND "chatName" != '' THEN
    PERFORM public.bot_v1_upsert_client(v_phone, "chatName", v_phone);
    -- Busca novamente após criar
    SELECT public.bot_v1_get_client_state(v_phone, v_phone) INTO v_result;
  END IF;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
