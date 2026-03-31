-- ============================================================
-- CORREÇÃO DA TABELA barber_profiles
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/kzlilaflnnbepacccijx/sql
-- ============================================================

-- 1. Adicionar colunas que o código espera mas não existem
ALTER TABLE barber_profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 50.0,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS permissions JSONB;

-- 2. Popular is_active a partir do campo 'active' existente
UPDATE barber_profiles SET is_active = active WHERE is_active IS NULL;

-- 3. Popular name, phone, email a partir da tabela users
UPDATE barber_profiles bp
SET
  name  = u.name,
  phone = u.phone,
  email = u.email
FROM users u
WHERE bp.user_id = u.id
  AND bp.name IS NULL;

-- 4. Garantir que todos os registros existentes têm is_active = true se active = true
UPDATE barber_profiles SET is_active = true WHERE active = true AND is_active IS NULL;
UPDATE barber_profiles SET is_active = false WHERE active = false AND is_active IS NULL;

-- 5. Confirmar resultado
SELECT id, user_id, name, email, is_active, commission_rate FROM barber_profiles;
