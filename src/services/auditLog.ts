import { supabase } from '../lib/supabase'

export interface AuditLogEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'STATUS_CHANGE' | 'PAYMENT' | 'EXPORT' | 'OTHER'
  entityType: string
  entityId?: string
  description: string
  oldValues?: any
  newValues?: any
}

/**
 * Registra uma ação no sistema de auditoria
 */
export const logAction = async (entry: AuditLogEntry) => {
  try {
    // Pegar informações do usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.user_metadata?.name || user?.email,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        description: entry.description,
        old_values: entry.oldValues,
        new_values: entry.newValues,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      })
    
    if (error) {
      console.error('Erro ao registrar log:', error)
    }
  } catch (error) {
    console.error('Erro ao registrar log:', error)
  }
}

/**
 * Pega o IP do cliente (simplificado)
 */
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch {
    return 'unknown'
  }
}

/**
 * Helpers para ações comuns
 */
export const auditLog = {
  // Agendamentos
  createAppointment: (appointmentId: string, data: any) => 
    logAction({
      action: 'CREATE',
      entityType: 'appointments',
      entityId: appointmentId,
      description: `Novo agendamento criado para ${data.client_name}`,
      newValues: data
    }),
  
  updateAppointment: (appointmentId: string, oldData: any, newData: any) =>
    logAction({
      action: 'UPDATE',
      entityType: 'appointments',
      entityId: appointmentId,
      description: `Agendamento atualizado`,
      oldValues: oldData,
      newValues: newData
    }),
  
  deleteAppointment: (appointmentId: string, data: any) =>
    logAction({
      action: 'DELETE',
      entityType: 'appointments',
      entityId: appointmentId,
      description: `Agendamento deletado de ${data.client_name}`,
      oldValues: data
    }),
  
  changeAppointmentStatus: (appointmentId: string, oldStatus: string, newStatus: string, clientName: string) =>
    logAction({
      action: 'STATUS_CHANGE',
      entityType: 'appointments',
      entityId: appointmentId,
      description: `Status mudado de "${oldStatus}" para "${newStatus}" - Cliente: ${clientName}`,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus }
    }),
  
  // Clientes
  createClient: (clientId: string, data: any) =>
    logAction({
      action: 'CREATE',
      entityType: 'clients',
      entityId: clientId,
      description: `Novo cliente cadastrado: ${data.name}`,
      newValues: data
    }),
  
  updateClient: (clientId: string, oldData: any, newData: any) =>
    logAction({
      action: 'UPDATE',
      entityType: 'clients',
      entityId: clientId,
      description: `Cliente atualizado: ${newData.name}`,
      oldValues: oldData,
      newValues: newData
    }),
  
  deleteClient: (clientId: string, data: any) =>
    logAction({
      action: 'DELETE',
      entityType: 'clients',
      entityId: clientId,
      description: `Cliente deletado: ${data.name}`,
      oldValues: data
    }),
  
  // Serviços
  createService: (serviceId: string, data: any) =>
    logAction({
      action: 'CREATE',
      entityType: 'services',
      entityId: serviceId,
      description: `Novo serviço criado: ${data.name} - R$ ${data.price}`,
      newValues: data
    }),
  
  updateService: (serviceId: string, oldData: any, newData: any) =>
    logAction({
      action: 'UPDATE',
      entityType: 'services',
      entityId: serviceId,
      description: `Serviço atualizado: ${newData.name}`,
      oldValues: oldData,
      newValues: newData
    }),
  
  deleteService: (serviceId: string, data: any) =>
    logAction({
      action: 'DELETE',
      entityType: 'services',
      entityId: serviceId,
      description: `Serviço deletado: ${data.name}`,
      oldValues: data
    }),
  
  // Pacotes
  sellPackage: (packageId: string, clientName: string, packageName: string, price: number) =>
    logAction({
      action: 'CREATE',
      entityType: 'client_packages',
      entityId: packageId,
      description: `Pacote "${packageName}" vendido para ${clientName} por R$ ${price}`,
      newValues: { client_name: clientName, package_name: packageName, price }
    }),
  
  usePackage: (usageId: string, clientName: string, serviceName: string) =>
    logAction({
      action: 'CREATE',
      entityType: 'package_usage',
      entityId: usageId,
      description: `Pacote usado: ${clientName} - ${serviceName}`,
      newValues: { client_name: clientName, service_name: serviceName }
    }),
  
  // Pagamentos
  registerPayment: (appointmentId: string, amount: number, clientName: string) =>
    logAction({
      action: 'PAYMENT',
      entityType: 'appointments',
      entityId: appointmentId,
      description: `Pagamento registrado: R$ ${amount.toFixed(2)} - ${clientName}`,
      newValues: { amount, client_name: clientName }
    }),
  
  // Exportações
  exportReport: (reportType: string, filters: any) =>
    logAction({
      action: 'EXPORT',
      entityType: 'reports',
      description: `Relatório exportado: ${reportType}`,
      newValues: { report_type: reportType, filters }
    }),
  
  // Login/Logout
  login: (email: string) =>
    logAction({
      action: 'LOGIN',
      entityType: 'auth',
      description: `Login realizado: ${email}`
    }),
  
  logout: (email: string) =>
    logAction({
      action: 'LOGOUT',
      entityType: 'auth',
      description: `Logout realizado: ${email}`
    })
}
