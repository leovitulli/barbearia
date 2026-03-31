-- ============================================================
-- FIX URGENTE: RAFAEL NA AGENDA - SAN PATRICIO
-- ============================================================

-- 1. CORRIGIR: Rafael não tem nome no barber_profiles (aparece como "?")
UPDATE public.barber_profiles
SET 
  name = 'Rafael',
  email = 'admin@barbearia.com',
  is_active = true,
  active = true,
  updated_at = NOW()
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- 2. VERIFICAR: Confirmar que o nome foi aplicado
SELECT id, name, user_id, is_active, active 
FROM public.barber_profiles 
ORDER BY name;

-- 3. VERIFICAR: Ver os agendamentos de hoje e para qual barber_profile_id estão vinculados
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  c.name as cliente,
  bp.name as barbeiro,
  bp.id as barber_profile_id
FROM public.appointments a
LEFT JOIN public.clients c ON a.client_id = c.id
LEFT JOIN public.barber_profiles bp ON a.barber_id = bp.id
WHERE a.appointment_date = CURRENT_DATE
ORDER BY a.appointment_time;
