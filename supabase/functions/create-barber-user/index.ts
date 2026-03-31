import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Usar service_role para ter permissão de criar usuários
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar que quem está chamando é um admin autenticado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar o token do chamador
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    const { data: { user: callerUser } } = await supabaseUser.auth.getUser(authHeader.replace('Bearer ', ''))

    if (!callerUser) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que o chamador é admin
    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem criar barbeiros.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { name, email, password, phone, specialty, bio, avatar, experience_years, commission_rate } = body

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Os campos nome, email e senha são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Criar o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
    })

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: `Erro ao criar login: ${authError?.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newAuthUserId = authData.user.id

    // 2. Criar o perfil na tabela public.users
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newAuthUserId, // VINCULA ao auth.users
        email,
        name,
        phone: phone || null,
        specialty: specialty || null,
        avatar: avatar || null,
        role: 'barber',
      })
      .select()
      .single()

    if (userError) {
      // Rollback: remover usuário do auth se a tabela falhou
      await supabaseAdmin.auth.admin.deleteUser(newAuthUserId)
      return new Response(
        JSON.stringify({ error: `Erro ao criar perfil: ${userError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Criar o barber_profile
    const { data: newBarber, error: barberError } = await supabaseAdmin
      .from('barber_profiles')
      .insert({
        user_id: newAuthUserId,
        name,
        phone: phone || null,
        email,
        specialty: specialty || null,
        bio: bio || null,
        avatar: avatar || null,
        experience_years: experience_years ?? 1,
        commission_rate: commission_rate ?? 50,
        is_active: true,
        active: true,
        rating: 5.0,
        total_reviews: 0,
      })
      .select()
      .single()

    if (barberError) {
      // Rollback completo
      await supabaseAdmin.from('users').delete().eq('id', newAuthUserId)
      await supabaseAdmin.auth.admin.deleteUser(newAuthUserId)
      return new Response(
        JSON.stringify({ error: `Erro ao criar perfil de barbeiro: ${barberError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Atualizar o barber_profile_id no user
    await supabaseAdmin
      .from('users')
      .update({ barber_profile_id: newBarber.id })
      .eq('id', newAuthUserId)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Barbeiro ${name} criado com sucesso! Ele já pode fazer login.`,
        barber_id: newBarber.id,
        user_id: newUser.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
