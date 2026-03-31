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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { barber_name, date } = body

    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Parâmetro "date" é obrigatório (DD-MM-YYYY)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Converter data do formato DD-MM-YYYY para YYYY-MM-DD
    let parsedDate = date
    if (date.includes('-') && date.length === 10 && date.indexOf('-') === 2) {
      const [day, month, year] = date.split('-')
      parsedDate = `${year}-${month}-${day}`
    }

    // Verificar se é domingo (dia 0 = fechado por padrão)
    const dateObj = new Date(parsedDate + 'T12:00:00')
    if (dateObj.getDay() === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'A barbearia está fechada aos domingos.',
          available_slots: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Resolver barbeiro (opcional)
    let barberId: string | null = null
    if (barber_name && barber_name.toLowerCase() !== 'qualquer') {
      const { data: barberData } = await supabase
        .from('barber_profiles')
        .select('id, users!inner(name)')
        .ilike('users.name', `%${barber_name}%`)
        .eq('active', true)
        .limit(1)
        .single()

      if (!barberData) {
        return new Response(
          JSON.stringify({ success: false, message: `Barbeiro "${barber_name}" não encontrado.`, available_slots: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      barberId = barberData.id
    }

    // 2. Buscar agendamentos existentes
    let query = supabase
      .from('appointments')
      .select('appointment_time, service_id, services(duration)')
      .eq('appointment_date', parsedDate)
      .neq('status', 'cancelled')

    if (barberId) {
      query = query.eq('barber_id', barberId)
    }

    const { data: bookedSlots } = await query

    // 3. Calcular horários ocupados (considerando duração do serviço)
    const occupiedTimes = new Set<string>()
    if (bookedSlots) {
      for (const slot of bookedSlots) {
        const [h, m] = slot.appointment_time.split(':').map(Number)
        const service = slot.services as any
        const duration = service?.duration ?? 30
        
        // Marcar o horário e os blocos subsequentes como ocupados
        const blocks = Math.ceil(duration / 30)
        for (let i = 0; i < blocks; i++) {
          const totalMinutes = h * 60 + m + i * 30
          const blockedH = Math.floor(totalMinutes / 60)
          const blockedM = totalMinutes % 60
          occupiedTimes.add(`${String(blockedH).padStart(2, '0')}:${String(blockedM).padStart(2, '0')}`)
        }
      }
    }

    // 4. Buscar bloqueios manuais
    let blocksQuery = supabase
      .from('blocked_slots')
      .select('start_time, end_time')
      .eq('date', parsedDate)

    if (barberId) {
      blocksQuery = blocksQuery.or(`barber_id.eq.${barberId},barber_id.is.null`)
    }

    const { data: blockedSlots } = await blocksQuery
    if (blockedSlots) {
      for (const block of blockedSlots) {
        const [sh, sm] = block.start_time.split(':').map(Number)
        const [eh, em] = block.end_time.split(':').map(Number)
        let cur = sh * 60 + sm
        const end = eh * 60 + em
        while (cur < end) {
          const bh = Math.floor(cur / 60)
          const bm = cur % 60
          occupiedTimes.add(`${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}`)
          cur += 30
        }
      }
    }

    // 5. Gerar horários disponíveis (09:00 às 19:30, a cada 30 min)
    const available: string[] = []
    
    // Ajustar para fuso horário de Brasília (UTC-3)
    const nowUtc = new Date()
    const nowBr = new Date(nowUtc.getTime() - (3 * 60 * 60 * 1000))
    
    const isToday = parsedDate === nowBr.toISOString().split('T')[0]
    const currentMinutes = nowBr.getUTCHours() * 60 + nowBr.getUTCMinutes()

    for (let totalMin = 9 * 60; totalMin <= 19 * 60; totalMin += 30) {
      const h = Math.floor(totalMin / 60)
      const m = totalMin % 60
      const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

      // Se for hoje, não mostrar horários já passados
      if (isToday && totalMin <= currentMinutes) continue

      // Sábado fecha às 18:00
      if (dateObj.getDay() === 6 && totalMin > 18 * 60) continue

      if (!occupiedTimes.has(slot)) {
        available.push(`${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        barber: barber_name ?? 'Qualquer',
        date: date,
        available_slots: available,
        total: available.length,
        message: available.length > 0
          ? `${available.length} horários disponíveis para ${date}`
          : 'Nenhum horário disponível para esta data.',
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
