-- ============================================================
-- CRIAR/GARANTIR USUÁRIO ADMIN PADRÃO
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- IMPORTANTE: No Supabase, usuários de autenticação são criados via
-- painel (Authentication > Users) ou via API Admin. 
-- Este script garante que o perfil na tabela 'users' existe.

-- Após criar o usuário no painel do Supabase em Authentication > Users,
-- com email: admin@barbearia.com e senha: admin123
-- Execute o script abaixo para garantir o perfil correto:

-- 1. Verificar se o usuário já existe na tabela public.users
DO $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  -- Buscar o ID do usuário na auth.users
  SELECT id INTO v_auth_user_id
  FROM auth.users 
  WHERE email = 'admin@barbearia.com'
  LIMIT 1;

  IF v_auth_user_id IS NOT NULL THEN
    -- Garantir que o perfil existe na tabela public.users
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (
      v_auth_user_id,
      'admin@barbearia.com',
      'Administrador',
      'admin',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      name = COALESCE(EXCLUDED.name, 'Administrador'),
      updated_at = NOW();

    RAISE NOTICE 'Usuário admin configurado com sucesso: %', v_auth_user_id;
  ELSE
    RAISE NOTICE '⚠️  Usuário admin@barbearia.com não encontrado na auth.users.';
    RAISE NOTICE 'Por favor, crie o usuário pelo painel do Supabase:';
    RAISE NOTICE 'Authentication > Users > Add User';
    RAISE NOTICE 'Email: admin@barbearia.com';
    RAISE NOTICE 'Senha: admin123';
  END IF;
END $$;

-- 2. Verificar resultado
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.created_at
FROM public.users u
WHERE u.email = 'admin@barbearia.com';
