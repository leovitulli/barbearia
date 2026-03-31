-- ============================================================
-- MIGRATION: Colunas faltantes para finalização de atendimento
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Adicionar colunas necessárias na tabela public.appointments
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Garantir que total_price aceita NULL
ALTER TABLE public.appointments 
  ALTER COLUMN total_price DROP NOT NULL;

-- Atualizar tipos se necessário (caso o total_price tenha sido criado como TEXT antes por algum motivo)
-- ALTER TABLE public.appointments ALTER COLUMN total_price TYPE NUMERIC(10,2) USING total_price::numeric;

SELECT 'Migration aplicada com sucesso! Colunas: total_price, original_price, discount_amount, updated_at' as resultado;
