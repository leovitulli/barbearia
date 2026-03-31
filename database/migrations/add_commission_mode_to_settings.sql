-- Adicionar configuração de modo de comissão (unified ou individual)
INSERT INTO system_settings (key, value, description, category, is_public)
VALUES 
  ('commission_mode', 'individual', 'Modo de comissão: unified (todos iguais) ou individual (por barbeiro)', 'financial', false),
  ('unified_commission_rate', '40.00', 'Taxa de comissão unificada quando commission_mode = unified', 'financial', false)
ON CONFLICT (key) DO UPDATE 
SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
