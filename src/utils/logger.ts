// Helper para registrar logs em qualquer lugar da aplicação
export const logAction = async (
  action: string,
  entity_type: 'appointment' | 'client' | 'user' | 'service' | 'system' | 'auth',
  details: string,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
  entity_id?: string
) => {
  try {
    // Obter dados do usuário atual do localStorage
    const authStorage = localStorage.getItem('supabase-auth-storage')
    const user = authStorage ? JSON.parse(authStorage)?.state?.user : null

    if (!user) {
      return
    }

    // Usar auditLogService para registrar logs
    const { auditLogService } = await import('../services/auditLogService')
    
    // Mapear entity_type para o tipo correto
    const mappedEntityType = entity_type === 'auth' ? undefined : entity_type as any
    
    await auditLogService.createLog({
      action: action as any,
      entity_type: mappedEntityType,
      entity_id,
      description: details,
      metadata: { severity }
    }, user)

  } catch (error) {
    console.error('Erro ao registrar log:', error)
  }
}

// Logs específicos para diferentes ações
export const logAuth = {
  login: (userEmail: string, success: boolean) => 
    logAction(
      success ? 'Login realizado' : 'Tentativa de login falhada',
      'auth',
      success 
        ? `Usuário ${userEmail} fez login com sucesso`
        : `Tentativa de login falhada para ${userEmail}`,
      success ? 'info' : 'warning'
    ),
  
  logout: (userEmail: string) =>
    logAction(
      'Logout realizado',
      'auth',
      `Usuário ${userEmail} fez logout do sistema`,
      'info'
    ),

  socialLogin: (provider: string, userEmail: string) =>
    logAction(
      'Login social realizado',
      'auth',
      `Usuário ${userEmail} fez login via ${provider}`,
      'info'
    )
}

export const logUser = {
  create: (userName: string, userId: string) =>
    logAction(
      'Usuário criado',
      'user',
      `Novo usuário criado: ${userName}`,
      'info',
      userId
    ),

  update: (userName: string, userId: string, changes: string) =>
    logAction(
      'Usuário atualizado',
      'user',
      `Usuário ${userName} atualizado: ${changes}`,
      'info',
      userId
    ),

  delete: (userName: string, userId: string) =>
    logAction(
      'Usuário removido',
      'user',
      `Usuário ${userName} foi removido do sistema`,
      'warning',
      userId
    )
}

export const logAppointment = {
  create: (clientName: string, appointmentId: string, details: string) =>
    logAction(
      'Agendamento criado',
      'appointment',
      `Novo agendamento para ${clientName}: ${details}`,
      'info',
      appointmentId
    ),

  update: (clientName: string, appointmentId: string, changes: string) =>
    logAction(
      'Agendamento atualizado',
      'appointment',
      `Agendamento de ${clientName} atualizado: ${changes}`,
      'info',
      appointmentId
    ),

  cancel: (clientName: string, appointmentId: string, reason: string) =>
    logAction(
      'Agendamento cancelado',
      'appointment',
      `Agendamento de ${clientName} cancelado: ${reason}`,
      'warning',
      appointmentId
    ),

  complete: (clientName: string, appointmentId: string) =>
    logAction(
      'Agendamento concluído',
      'appointment',
      `Agendamento de ${clientName} foi concluído`,
      'info',
      appointmentId
    )
}

export const logClient = {
  create: (clientName: string, clientId: string) =>
    logAction(
      'Cliente criado',
      'client',
      `Novo cliente cadastrado: ${clientName}`,
      'info',
      clientId
    ),

  update: (clientName: string, clientId: string, changes: string) =>
    logAction(
      'Cliente atualizado',
      'client',
      `Cliente ${clientName} atualizado: ${changes}`,
      'info',
      clientId
    ),

  delete: (clientName: string, clientId: string) =>
    logAction(
      'Cliente removido',
      'client',
      `Cliente ${clientName} foi removido`,
      'warning',
      clientId
    )
}

export const logService = {
  create: (serviceName: string, serviceId: string, price: number) =>
    logAction(
      'Serviço criado',
      'service',
      `Novo serviço criado: ${serviceName} - R$ ${price.toFixed(2)}`,
      'info',
      serviceId
    ),

  update: (serviceName: string, serviceId: string, changes: string) =>
    logAction(
      'Serviço atualizado',
      'service',
      `Serviço ${serviceName} atualizado: ${changes}`,
      'info',
      serviceId
    ),

  delete: (serviceName: string, serviceId: string) =>
    logAction(
      'Serviço removido',
      'service',
      `Serviço ${serviceName} foi removido`,
      'warning',
      serviceId
    )
}

export const logSystem = {
  startup: () =>
    logAction(
      'Sistema iniciado',
      'system',
      'Sistema iniciado com sucesso',
      'info'
    ),

  backup: (success: boolean, details: string) =>
    logAction(
      success ? 'Backup realizado' : 'Falha no backup',
      'system',
      details,
      success ? 'info' : 'error'
    ),

  error: (error: string, details: string) =>
    logAction(
      'Erro do sistema',
      'system',
      `Erro: ${error} - ${details}`,
      'error'
    ),

  critical: (error: string, details: string) =>
    logAction(
      'Erro crítico',
      'system',
      `Erro crítico: ${error} - ${details}`,
      'critical'
    )
}
