-- Tabela de Comissões dos Barbeiros
CREATE TABLE IF NOT EXISTS barber_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 40.00, -- Porcentagem (ex: 40.00 = 40%)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_barber_commissions_user_id ON barber_commissions(user_id);

-- RLS (Row Level Security)
ALTER TABLE barber_commissions ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver comissões
CREATE POLICY "Everyone can view commissions"
  ON barber_commissions FOR SELECT
  USING (true);

-- Política: Apenas admins podem atualizar comissões
CREATE POLICY "Only admins can update commissions"
  ON barber_commissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Política: Apenas admins podem inserir comissões
CREATE POLICY "Only admins can insert commissions"
  ON barber_commissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Inserir comissões padrão para barbeiros existentes
INSERT INTO barber_commissions (user_id, commission_rate)
SELECT id, 40.00 
FROM users 
WHERE role = 'barber'
ON CONFLICT (user_id) DO NOTHING;
