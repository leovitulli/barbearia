-- Script para alterar senhas dos usuários no Supabase
-- Execute este script no SQL Editor do Supabase (https://orribcnlrrxyobganzrb.supabase.co)
-- IMPORTANTE: Este script altera as senhas na tabela auth.users do Supabase

-- Senha: 123mudar
-- Hash bcrypt da senha (você precisa gerar usando o Supabase)

-- OPÇÃO 1: Atualizar usando a API Admin do Supabase (RECOMENDADO)
-- Use este código TypeScript/JavaScript no console do navegador ou crie um script:

/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orribcnlrrxyobganzrb.supabase.co'
const supabaseServiceRoleKey = 'SUA_SERVICE_ROLE_KEY_AQUI' // Você precisa pegar isso no painel do Supabase

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Buscar todos os usuários
const { data: users } = await supabaseAdmin.auth.admin.listUsers()

// Atualizar senha de cada usuário
for (const user of users.users) {
  await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: '123mudar' }
  )
  console.log(`Senha atualizada para: ${user.email}`)
}
*/

-- OPÇÃO 2: Se você tem os IDs dos usuários, pode fazer assim:
-- (Substitua os UUIDs pelos IDs reais dos seus usuários)

-- Exemplo de como resetar senha via SQL (NÃO FUNCIONA DIRETAMENTE - APENAS REFERÊNCIA)
-- O Supabase Auth não permite update direto de senhas via SQL por segurança
-- Você DEVE usar a API Admin

-- OPÇÃO 3: SOLUÇÃO TEMPORÁRIA - Desabilitar validação de senha no código
-- Como o código já aceita qualquer senha (linha 72-77 do supabaseAuthStore.ts),
-- você pode simplesmente digitar QUALQUER senha no login!

-- Credenciais de teste:
-- Email: admin@barbearia.com - Senha: QUALQUER COISA (123mudar, abc, 123, etc)
-- Email: carlos@barbearia.com - Senha: QUALQUER COISA
-- Email: miguel@barbearia.com - Senha: QUALQUER COISA

SELECT 
  id, 
  email,
  'A senha pode ser QUALQUER COISA (o código não valida)' as nota
FROM auth.users
ORDER BY email;
