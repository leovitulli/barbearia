-- ============================================
-- TABELA DE LOGS DE AUDITORIA
-- Registra TODAS as ações do sistema
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Quem fez a ação
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  
  -- O que foi feito
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', etc.
  entity_type TEXT NOT NULL, -- 'appointment', 'client', 'service', 'package', etc.
  entity_id UUID,
  
  -- Detalhes da ação
  description TEXT NOT NULL,
  old_values JSONB, -- Valores antes da mudança
  new_values JSONB, -- Valores depois da mudança
  
  -- Metadados
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para busca rápida
  CONSTRAINT audit_logs_action_check CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 
    'LOGIN', 'LOGOUT',
    'EXPORT', 'IMPORT',
    'STATUS_CHANGE',
    'PAYMENT',
    'OTHER'
  ))
);

-- Índices para performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Comentários
COMMENT ON TABLE audit_logs IS 'Registro de todas as ações do sistema para auditoria';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de ação realizada';
COMMENT ON COLUMN audit_logs.entity_type IS 'Tipo de entidade afetada';
COMMENT ON COLUMN audit_logs.old_values IS 'Valores antes da mudança (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'Valores depois da mudança (JSON)';

-- ============================================
-- FUNÇÃO PARA REGISTRAR LOGS AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Registra automaticamente mudanças em tabelas importantes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      action,
      entity_type,
      entity_id,
      description,
      new_values
    ) VALUES (
      'CREATE',
      TG_TABLE_NAME,
      NEW.id,
      'Novo registro criado em ' || TG_TABLE_NAME,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      action,
      entity_type,
      entity_id,
      description,
      old_values,
      new_values
    ) VALUES (
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      'Registro atualizado em ' || TG_TABLE_NAME,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      action,
      entity_type,
      entity_id,
      description,
      old_values
    ) VALUES (
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      'Registro deletado de ' || TG_TABLE_NAME,
      to_jsonb(OLD)
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ============================================

-- Appointments
DROP TRIGGER IF EXISTS audit_appointments ON appointments;
CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Clients
DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Services
DROP TRIGGER IF EXISTS audit_services ON services;
CREATE TRIGGER audit_services
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Barber Profiles
DROP TRIGGER IF EXISTS audit_barber_profiles ON barber_profiles;
CREATE TRIGGER audit_barber_profiles
  AFTER INSERT OR UPDATE OR DELETE ON barber_profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Client Packages
DROP TRIGGER IF EXISTS audit_client_packages ON client_packages;
CREATE TRIGGER audit_client_packages
  AFTER INSERT OR UPDATE OR DELETE ON client_packages
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Package Usage
DROP TRIGGER IF EXISTS audit_package_usage ON package_usage;
CREATE TRIGGER audit_package_usage
  AFTER INSERT OR UPDATE OR DELETE ON package_usage
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Service Promotions
DROP TRIGGER IF EXISTS audit_service_promotions ON service_promotions;
CREATE TRIGGER audit_service_promotions
  AFTER INSERT OR UPDATE OR DELETE ON service_promotions
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs
CREATE POLICY "Apenas admins podem ver logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Sistema pode inserir logs
CREATE POLICY "Sistema pode inserir logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Ninguém pode deletar logs (apenas admin via SQL)
CREATE POLICY "Ninguém pode deletar logs"
  ON audit_logs FOR DELETE
  USING (false);

-- ============================================
-- VIEW PARA LOGS FORMATADOS
-- ============================================

CREATE OR REPLACE VIEW audit_logs_formatted AS
SELECT 
  al.id,
  al.user_email,
  al.user_name,
  al.action,
  al.entity_type,
  al.entity_id,
  al.description,
  al.old_values,
  al.new_values,
  al.ip_address,
  al.created_at,
  
  -- Formatação amigável
  CASE al.action
    WHEN 'CREATE' THEN '➕ Criou'
    WHEN 'UPDATE' THEN '✏️ Editou'
    WHEN 'DELETE' THEN '🗑️ Deletou'
    WHEN 'LOGIN' THEN '🔐 Login'
    WHEN 'LOGOUT' THEN '🚪 Logout'
    WHEN 'STATUS_CHANGE' THEN '🔄 Mudou Status'
    WHEN 'PAYMENT' THEN '💰 Pagamento'
    ELSE '❓ Outro'
  END as action_formatted,
  
  -- Nome da entidade em português
  CASE al.entity_type
    WHEN 'appointments' THEN 'Agendamento'
    WHEN 'clients' THEN 'Cliente'
    WHEN 'services' THEN 'Serviço'
    WHEN 'barber_profiles' THEN 'Barbeiro'
    WHEN 'client_packages' THEN 'Pacote de Cliente'
    WHEN 'service_promotions' THEN 'Promoção'
    ELSE al.entity_type
  END as entity_type_formatted
  
FROM audit_logs al
ORDER BY al.created_at DESC;

-- ============================================
-- FUNÇÃO PARA LIMPAR LOGS ANTIGOS
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_logs IS 'Remove logs mais antigos que X dias (padrão: 90)';
