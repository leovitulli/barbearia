-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255), -- Nome do usuário no momento da ação
  user_email VARCHAR(255), -- Email do usuário
  action VARCHAR(100) NOT NULL, -- Tipo de ação: login, logout, create, update, delete
  entity_type VARCHAR(100), -- Tipo de entidade: client, appointment, service, etc
  entity_id UUID, -- ID da entidade afetada
  description TEXT NOT NULL, -- Descrição da ação
  metadata JSONB, -- Dados adicionais (antes/depois, IP, etc)
  ip_address VARCHAR(45), -- Endereço IP
  user_agent TEXT, -- Navegador/dispositivo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);

-- RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver logs
CREATE POLICY "Only admins can view logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Política: Sistema pode inserir logs (qualquer usuário autenticado)
CREATE POLICY "Authenticated users can insert logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Função para limpar logs antigos (opcional - manter últimos 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE audit_logs IS 'Registro de auditoria de todas as ações do sistema';
COMMENT ON COLUMN audit_logs.action IS 'Tipos: login, logout, create, update, delete, view';
COMMENT ON COLUMN audit_logs.entity_type IS 'Tipos: client, appointment, service, barber, user, package, etc';
