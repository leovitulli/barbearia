-- Corrigir: admin também é barbeiro
-- Execute no SQL Editor do Supabase

-- 1. Adicionar perfil de barbeiro para o Admin (Rafael)
INSERT INTO barber_profiles (id, user_id, specialty, can_view_reports, can_manage_clients, can_manage_appointments, can_view_all_barbers)
VALUES (
  'bbbb0000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'Cortes e gestão',
  true,
  true,
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Vincular o perfil ao usuário admin
UPDATE users
SET barber_profile_id = 'bbbb0000-0000-0000-0000-000000000000',
    specialty = 'Cortes e gestão'
WHERE id = '11111111-1111-1111-1111-111111111111';
