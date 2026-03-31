-- ============================================================
-- FIX: PERMISSÕES DE LEITURA PARA O BOT (TELEGRAM / GPT MAKER)
-- ============================================================

-- 1. Políticas de RLS para acesso anônimo (público)
-- Permitir que o bot (acesso 'anon') leia a lista de serviços e o perfil dos barbeiros
DROP POLICY IF EXISTS "Todos podem ver serviços" ON public.services;
CREATE POLICY "Todos podem ver serviços" ON public.services
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Todos podem ver perfis de barbeiros" ON public.barber_profiles;
CREATE POLICY "Todos podem ver perfis de barbeiros" ON public.barber_profiles
    FOR SELECT TO anon, authenticated USING (true);

-- 2. Garantir permissões de execução explícitas para as funções do bot (acesso 'anon')
GRANT EXECUTE ON FUNCTION public.listar_servicos_telegram() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_barbeiros_telegram() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_disponibilidade_telegram(TEXT, DATE, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_cliente_por_telefone_telegram(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_appointment_telegram(TEXT, TEXT, TEXT, TEXT, DATE, TIME, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_agendamento_telegram(TEXT) TO anon, authenticated;

-- 3. (OPCIONAL) Se houver usuários públicos na tabela 'clients', liberar busca tbm
DROP POLICY IF EXISTS "Permitir busca de clientes por telefone" ON public.clients;
CREATE POLICY "Permitir busca de clientes por telefone" ON public.clients
    FOR SELECT TO anon, authenticated USING (true);

-- NOTA: Execute este script no SQL Editor do seu Supabase para ativar as mudanças.
