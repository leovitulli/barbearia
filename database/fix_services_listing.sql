-- ============================================================
-- FIX: LISTAGEM DE SERVIÇOS E VALORES PARA O TELEGRAM
-- ============================================================

-- 1. Remover versão antiga para evitar conflito de assinatura
DROP FUNCTION IF EXISTS public.listar_servicos_telegram();
DROP FUNCTION IF EXISTS public.listar_servicos_telegram(JSONB);

-- 2. Criar função robusta que aceita parâmetros (mesmo que vazios)
CREATE OR REPLACE FUNCTION public.listar_servicos_telegram(params JSONB DEFAULT '{}'::JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_servicos JSONB;
BEGIN
  -- Buscar todos os serviços ativos transformando em JSON amigável
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'nome', name,
    'preco', 'R$ ' || REPLACE(price::TEXT, '.', ','), -- Formato brasileiro R$ 00,00
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

-- 3. Dar permissão de execução para o Robô (anon)
GRANT EXECUTE ON FUNCTION public.listar_servicos_telegram(JSONB) TO anon, authenticated;

-- 4. Ajustar RLS para permitir consulta anônima na tabela de serviços
-- (Necessário mesmo com SECURITY DEFINER para garantir fluidez)
DROP POLICY IF EXISTS "Permitir ver anon" ON public.services;
CREATE POLICY "Permitir ver anon" ON public.services FOR SELECT TO anon USING (active = true);

-- 5. Mesma coisa para o Perfil dos Barbeiros (se o robô precisar listar)
DROP POLICY IF EXISTS "Permitir ver anon" ON public.barber_profiles;
CREATE POLICY "Permitir ver anon" ON public.barber_profiles FOR SELECT TO anon USING (active = true);

-- 6. Garantir que a função de listar barbeiros também aceite parâmetros
DROP FUNCTION IF EXISTS public.listar_barbeiros_telegram();
CREATE OR REPLACE FUNCTION public.listar_barbeiros_telegram(params JSONB DEFAULT '{}'::JSONB)
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

GRANT EXECUTE ON FUNCTION public.listar_barbeiros_telegram(JSONB) TO anon, authenticated;
