import { supabase } from '../lib/supabase'

export type AuditAction = 
  | 'login' 
  | 'logout' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view'
  | 'export'

export type EntityType = 
  | 'client' 
  | 'appointment' 
  | 'service' 
  | 'barber' 
  | 'user' 
  | 'package'
  | 'promotion'
  | 'settings'
  | 'report'

export interface AuditLog {
  id: string
  timestamp: string
  user_id: string | null
  user_name: string
  user_role: string
  action: string // Na system_logs, action é a descrição
  entity_type?: EntityType | string | null
  entity_id?: string | null
  details: string
  ip_address?: string | null
  user_agent?: string | null
  severity: string
  created_at: string
  // Campos mapeados para compatibilidade
  user_email?: string
  description?: string
}

export interface CreateAuditLogParams {
  action: AuditAction
  entity_type?: EntityType
  entity_id?: string
  description: string
  metadata?: any
}

class AuditLogService {
  // Criar log de auditoria
  async createLog(params: CreateAuditLogParams, user?: any) {
    try {
      // Obter informações do usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const logUser = user || currentUser

      if (!logUser) {
        console.warn('Tentativa de criar log sem usuário autenticado')
        return null
      }

      // Buscar dados completos do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', logUser.id)
        .single()

      const logData = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        user_id: logUser.id,
        user_name: userData?.name || logUser.email || 'Usuário',
        user_role: userData?.role || 'user',
        action: params.description, // system_logs usa 'action' para descrição
        entity_type: params.entity_type || null,
        entity_id: params.entity_id || null,
        details: params.description,
        ip_address: null,
        user_agent: navigator.userAgent,
        severity: 'info'
      }

      const { data, error } = await supabase
        .from('system_logs')
        .insert(logData)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar log de auditoria:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao criar log:', error)
      return null
    }
  }

  // Buscar logs com filtros
  async getLogs(filters?: {
    user_id?: string
    action?: AuditAction
    entity_type?: EntityType
    start_date?: string
    end_date?: string
    limit?: number
  }) {
    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters?.action) {
        query = query.eq('action', filters.action)
      }

      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type)
      }

      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date)
      }

      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date)
      }

      query = query.limit(filters?.limit || 100)

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      return []
    }
  }

  // Logs específicos por tipo de ação
  async logLogin(userId: string, userName: string, userEmail: string) {
    return this.createLog({
      action: 'login',
      description: `${userName} fez login no sistema`,
      metadata: { timestamp: new Date().toISOString() }
    }, { id: userId, email: userEmail })
  }

  async logLogout(userName: string) {
    return this.createLog({
      action: 'logout',
      description: `${userName} saiu do sistema`,
    })
  }

  async logCreate(entityType: EntityType, entityId: string, entityName: string, details?: any) {
    return this.createLog({
      action: 'create',
      entity_type: entityType,
      entity_id: entityId,
      description: `Criou ${this.getEntityLabel(entityType)}: ${entityName}`,
      metadata: details
    })
  }

  async logUpdate(entityType: EntityType, entityId: string, entityName: string, changes?: any) {
    return this.createLog({
      action: 'update',
      entity_type: entityType,
      entity_id: entityId,
      description: `Atualizou ${this.getEntityLabel(entityType)}: ${entityName}`,
      metadata: { changes }
    })
  }

  async logDelete(entityType: EntityType, entityId: string, entityName: string) {
    return this.createLog({
      action: 'delete',
      entity_type: entityType,
      entity_id: entityId,
      description: `Excluiu ${this.getEntityLabel(entityType)}: ${entityName}`,
    })
  }

  async logExport(reportType: string, filters?: any) {
    return this.createLog({
      action: 'export',
      entity_type: 'report',
      description: `Exportou relatório: ${reportType}`,
      metadata: { filters }
    })
  }

  // Helper para traduzir tipos de entidade
  private getEntityLabel(entityType: EntityType): string {
    const labels: Record<EntityType, string> = {
      client: 'cliente',
      appointment: 'agendamento',
      service: 'serviço',
      barber: 'barbeiro',
      user: 'usuário',
      package: 'pacote',
      promotion: 'promoção',
      settings: 'configuração',
      report: 'relatório'
    }
    return labels[entityType] || entityType
  }

  // Obter estatísticas de logs
  async getStats(days: number = 7) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data } = await supabase
        .from('system_logs')
        .select('action, entity_type')
        .gte('created_at', startDate.toISOString())

      if (!data) return null

      const stats = {
        total: data.length,
        byAction: {} as Record<string, number>,
        byEntity: {} as Record<string, number>
      }

      data.forEach(log => {
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
        if (log.entity_type) {
          stats.byEntity[log.entity_type] = (stats.byEntity[log.entity_type] || 0) + 1
        }
      })

      return stats
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return null
    }
  }
}

export const auditLogService = new AuditLogService()
