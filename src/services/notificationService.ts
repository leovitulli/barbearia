import { supabase } from '../lib/supabase'

export interface Notification {
  id: string
  user_id: string
  type: 'new_appointment' | 'cancellation' | 'no_show' | 'review' | 'daily_report'
  title: string
  message: string
  read: boolean
  data?: any
  created_at: string
}

export interface NotificationSettings {
  new_appointment: boolean
  cancellation: boolean
  no_show: boolean
  review: boolean
  daily_report: boolean
  email_enabled: boolean
}

export const notificationService = {
  // Criar notificação
  async create(notification: Omit<Notification, 'id' | 'read' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      return null
    }
  },

  // Buscar notificações do usuário
  async getByUser(userId: string, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (unreadOnly) {
        query = query.eq('read', false)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      return []
    }
  },

  // Marcar como lida
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      return false
    }
  },

  // Marcar todas como lidas
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      return false
    }
  },

  // Enviar email de notificação
  async sendEmail(to: string, subject: string, body: string) {
    // TODO: Integrar com serviço de email (SendGrid, AWS SES, etc)
    // Por enquanto, apenas simula o envio
    console.log('📧 Email enviado:', { to, subject, body })
    return true
  },

  // Notificar novo agendamento
  async notifyNewAppointment(barberId: string, clientName: string, appointmentData: any) {
    const notification = {
      user_id: barberId,
      type: 'new_appointment' as const,
      title: 'Novo Agendamento',
      message: `${clientName} agendou um horário com você`,
      data: appointmentData
    }

    await this.create(notification)
    
    // Buscar email do barbeiro
    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', barberId)
      .single()

    if (user?.email) {
      await this.sendEmail(
        user.email,
        'Novo Agendamento - San Patricio',
        `Olá ${user.name},\n\n${clientName} agendou um horário com você.\n\nDetalhes: ${JSON.stringify(appointmentData, null, 2)}`
      )
    }
  },

  // Notificar cancelamento
  async notifyCancellation(barberId: string, clientName: string, appointmentData: any) {
    const notification = {
      user_id: barberId,
      type: 'cancellation' as const,
      title: 'Agendamento Cancelado',
      message: `${clientName} cancelou o agendamento`,
      data: appointmentData
    }

    await this.create(notification)

    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', barberId)
      .single()

    if (user?.email) {
      await this.sendEmail(
        user.email,
        'Agendamento Cancelado - San Patricio',
        `Olá ${user.name},\n\n${clientName} cancelou o agendamento.\n\nDetalhes: ${JSON.stringify(appointmentData, null, 2)}`
      )
    }
  },

  // Notificar no-show
  async notifyNoShow(barberId: string, clientName: string, appointmentData: any) {
    const notification = {
      user_id: barberId,
      type: 'no_show' as const,
      title: 'Cliente Não Compareceu',
      message: `${clientName} não compareceu ao agendamento`,
      data: appointmentData
    }

    await this.create(notification)
  },

  // Notificar nova avaliação
  async notifyNewReview(barberId: string, clientName: string, rating: number, comment: string) {
    const notification = {
      user_id: barberId,
      type: 'review' as const,
      title: 'Nova Avaliação',
      message: `${clientName} avaliou seu atendimento com ${rating} estrelas`,
      data: { rating, comment }
    }

    await this.create(notification)

    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', barberId)
      .single()

    if (user?.email) {
      await this.sendEmail(
        user.email,
        'Nova Avaliação - San Patricio',
        `Olá ${user.name},\n\n${clientName} avaliou seu atendimento com ${rating} estrelas.\n\nComentário: ${comment}`
      )
    }
  }
}
