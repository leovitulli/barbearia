import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { 
  DollarSign, 
  Calendar, 
  Users, 
  Plus, 
  TrendingUp, 
  Scissors, 
  Star,
  Clock,
  Award,
  Eye,
  EyeOff,
  BarChart3,
  Activity,
  Percent
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'
import { usePermissions } from '../hooks/usePermissions'
import { useRealtimeBarbers } from '../hooks/useRealtimeBarbers'

const Dashboard = () => {
  const { user } = useSupabaseAuthStore()
  const { isBarber } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('day') // day, week, month, year
  const [showValues, setShowValues] = useState(true) // Controla visibilidade dos valores
  const [chartType, setChartType] = useState('bar') // bar, line, pie
  const [companyName, setCompanyName] = useState('Barbearia')
  
  // Dados de comissão do barbeiro
  const [commissionRate, setCommissionRate] = useState(0)
  const [barberCommission, setBarberCommission] = useState(0)
  
  // Estados para dados
  const [stats, setStats] = useState({
    todayAppointments: 0,
    tomorrowAppointments: 0,
    weekAppointments: 0,
    revenue: 0,
    totalClients: 0,
    avgRating: 0
  })
  
  const [revenueData, setRevenueData] = useState({
    day: 0,
    week: 0,
    month: 0,
    year: 0
  })
  
  const [chartData, setChartData] = useState<number[]>([])
  const [topServices, setTopServices] = useState<any[]>([])
  const [topBarbers, setTopBarbers] = useState<any[]>([])
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  
  // Modal de novo agendamento
  const [modalOpen, setModalOpen] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [initialBarbers, setInitialBarbers] = useState<any[]>([])
  const barbers = useRealtimeBarbers(initialBarbers) // Sincronização em tempo real
  const [services, setServices] = useState<any[]>([])
  
  const [clientSearch, setClientSearch] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [formData, setFormData] = useState({
    clientId: '',
    barberId: '',
    serviceId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00'
  })
  
  // Modal de confirmação de valor
  const [valueModalOpen, setValueModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [finalValue, setFinalValue] = useState('')
  

  useEffect(() => {
    loadAllData()
    loadChartData()
    loadCompanyName()
  }, [period])

  useEffect(() => {
    if (isBarber && user?.barber_profile_id) {
      loadBarberCommission()
    }
  }, [isBarber, user])

  // Recarregar topBarbers quando barbeiros mudarem (realtime)
  useEffect(() => {
    if (barbers.length > 0) {
      loadTopBarbers()
    }
  }, [barbers])

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [modalOpen])

  // Carregar nome da barbearia das configurações
  const loadCompanyName = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'company_name')
        .single()
      if (data?.value) {
        setCompanyName(data.value as string)
      }
    } catch {
      // Usar nome padrão
    }
  }

  // Carregar taxa de comissão do barbeiro
  const loadBarberCommission = async () => {
    if (!user?.barber_profile_id) return

    try {
      const { data, error } = await supabase
        .from('barber_profiles')
        .select('commission_rate')
        .eq('id', user.barber_profile_id)
        .single()

      if (error) throw error
      if (data) {
        setCommissionRate(data.commission_rate || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar comissão:', error)
    }
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadStats(),
        loadRevenueData(),
        loadTopServices(),
        loadTopBarbers(),
        loadRecentAppointments(),
        loadReviews(),
        loadClients(),
        loadBarbers(),
        loadServices()
      ])
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)
    
    // OTIMIZAÇÃO: 1 query para buscar todos os agendamentos necessários
    let query = supabase
      .from('appointments')
      .select('appointment_date, status, total_price, barber_id')
      .gte('appointment_date', todayStr)
      .lte('appointment_date', format(weekEnd, 'yyyy-MM-dd'))
    
    // Se for barbeiro, filtrar apenas seus agendamentos
    if (isBarber && user?.barber_profile_id) {
      query = query.eq('barber_id', user.barber_profile_id)
    }
    
    const { data: allAppts } = await query
    
    // Processar dados localmente (muito mais rápido)
    const todayAppts = allAppts?.filter(apt => 
      apt.appointment_date === todayStr && (apt.status === 'scheduled' || apt.status === 'confirmed')
    ) || []
    
    const tomorrowAppts = allAppts?.filter(apt => 
      apt.appointment_date === tomorrowStr && (apt.status === 'scheduled' || apt.status === 'confirmed')
    ) || []
    
    const weekAppts = allAppts?.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed') || []
    
    const completedAppts = allAppts?.filter(apt => apt.status === 'completed') || []
    const totalRevenue = completedAppts.reduce((sum, apt) => sum + (parseFloat(apt.total_price) || 0), 0)
    
    // Queries paralelas para dados independentes
    const [clientsData, reviewsData] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('rating')
    ])
    
    const avgRating = reviewsData.data?.length 
      ? reviewsData.data.reduce((sum, r) => sum + r.rating, 0) / reviewsData.data.length 
      : 0

    setStats({
      todayAppointments: todayAppts.length,
      tomorrowAppointments: tomorrowAppts.length,
      weekAppointments: weekAppts.length,
      revenue: totalRevenue,
      totalClients: clientsData.count || 0,
      avgRating: Math.round(avgRating * 10) / 10
    })
  }

  const loadRevenueData = async () => {
    const today = new Date()
    const periods = {
      day: format(today, 'yyyy-MM-dd'),
      week: format(startOfWeek(today), 'yyyy-MM-dd'),
      month: format(startOfMonth(today), 'yyyy-MM-dd'),
      year: format(startOfYear(today), 'yyyy-MM-dd')
    }

    // OTIMIZAÇÃO: 1 query para buscar todos os dados do ano
    let query = supabase
      .from('appointments')
      .select('appointment_date, total_price, barber_id')
      .gte('appointment_date', periods.year)
      .eq('status', 'completed')
    
    // Se for barbeiro, filtrar apenas seus agendamentos
    if (isBarber && user?.barber_profile_id) {
      query = query.eq('barber_id', user.barber_profile_id)
    }
    
    const { data: allRevenue } = await query

    // Processar localmente (muito mais rápido que 4 queries)
    const revenue = { day: 0, week: 0, month: 0, year: 0 }
    
    allRevenue?.forEach(apt => {
      const price = parseFloat(apt.total_price) || 0
      const aptDate = apt.appointment_date
      
      if (aptDate >= periods.day) revenue.day += price
      if (aptDate >= periods.week) revenue.week += price
      if (aptDate >= periods.month) revenue.month += price
      revenue.year += price
    })

    setRevenueData(revenue)
    
    // Se for barbeiro, calcular comissão
    if (isBarber && commissionRate > 0) {
      const currentRevenue = revenue[period as keyof typeof revenue] || 0
      const commission = (currentRevenue * commissionRate) / 100
      setBarberCommission(commission)
    }
  }

  const loadChartData = async () => {
    const today = new Date()
    let data: number[] = []
    let startDate = ''

    // Definir data inicial baseada no período
    if (period === 'day') {
      startDate = format(today, 'yyyy-MM-dd')
    } else if (period === 'week') {
      startDate = format(startOfWeek(today), 'yyyy-MM-dd')
    } else if (period === 'month') {
      startDate = format(startOfMonth(today), 'yyyy-MM-dd')
    } else {
      startDate = format(startOfYear(today), 'yyyy-MM-dd')
    }

    // OTIMIZAÇÃO: 1 query para buscar todos os dados do período
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_date, appointment_time, total_price')
      .gte('appointment_date', startDate)
      .eq('status', 'completed')

    // Processar dados localmente (muito mais rápido)
    if (period === 'day') {
      data = Array(24).fill(0)
      appointments?.forEach(apt => {
        const hour = parseInt(apt.appointment_time?.split(':')[0] || '0')
        data[hour] += parseFloat(apt.total_price || '0')
      })
    } else if (period === 'week') {
      data = Array(7).fill(0)
      const weekStart = startOfWeek(today)
      appointments?.forEach(apt => {
        const aptDate = new Date(apt.appointment_date)
        const daysDiff = Math.floor((aptDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff >= 0 && daysDiff < 7) {
          data[daysDiff] += parseFloat(apt.total_price || '0')
        }
      })
    } else if (period === 'month') {
      data = Array(4).fill(0)
      const monthStart = startOfMonth(today)
      appointments?.forEach(apt => {
        const aptDate = new Date(apt.appointment_date)
        const daysDiff = Math.floor((aptDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24))
        const weekIndex = Math.floor(daysDiff / 7)
        if (weekIndex >= 0 && weekIndex < 4) {
          data[weekIndex] += parseFloat(apt.total_price || '0')
        }
      })
    } else {
      data = Array(12).fill(0)
      appointments?.forEach(apt => {
        const aptDate = new Date(apt.appointment_date)
        const month = aptDate.getMonth()
        data[month] += parseFloat(apt.total_price || '0')
      })
    }

    setChartData(data)
  }

  const loadTopServices = async () => {
    // Definir período baseado na seleção
    const today = new Date()
    let startDate = ''
    
    switch (period) {
      case 'day':
        startDate = format(today, 'yyyy-MM-dd')
        break
      case 'week':
        startDate = format(startOfWeek(today), 'yyyy-MM-dd')
        break
      case 'month':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd')
        break
      case 'year':
        startDate = format(startOfYear(today), 'yyyy-MM-dd')
        break
    }

    const { data } = await supabase
      .from('appointments')
      .select(`
        service_id,
        services(name, price),
        status,
        appointment_date
      `)
      .eq('status', 'completed')
      .gte('appointment_date', startDate)
    
    if (!data) return

    const serviceCount: { [key: string]: { name: string, count: number, revenue: number } } = {}
    
    data.forEach(apt => {
      const serviceId = apt.service_id
      const serviceName = (apt.services as any)?.name || 'Desconhecido'
      const price = parseFloat((apt.services as any)?.price || '0')
      
      if (!serviceCount[serviceId]) {
        serviceCount[serviceId] = { name: serviceName, count: 0, revenue: 0 }
      }
      
      serviceCount[serviceId].count++
      serviceCount[serviceId].revenue += price
    })

    const sortedServices = Object.values(serviceCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setTopServices(sortedServices)
  }

  const loadTopBarbers = async () => {
    // Definir período baseado na seleção
    const today = new Date()
    let startDate = ''
    
    switch (period) {
      case 'day':
        startDate = format(today, 'yyyy-MM-dd')
        break
      case 'week':
        startDate = format(startOfWeek(today), 'yyyy-MM-dd')
        break
      case 'month':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd')
        break
      case 'year':
        startDate = format(startOfYear(today), 'yyyy-MM-dd')
        break
    }

    const { data } = await supabase
      .from('appointments')
      .select(`
        barber_id,
        barber_profiles(name, avatar),
        status,
        total_price,
        appointment_date
      `)
      .eq('status', 'completed')
      .gte('appointment_date', startDate)
    
    if (!data) return

    const barberStats: { [key: string]: { name: string, avatar: string | null, appointments: number, revenue: number } } = {}
    
    data.forEach(apt => {
      const barberId = apt.barber_id
      const barberProfile = apt.barber_profiles as any
      const barberName = barberProfile?.name || 'Desconhecido'
      const barberAvatar = barberProfile?.avatar || null
      const revenue = parseFloat(apt.total_price || '0')
      
      if (!barberStats[barberId]) {
        barberStats[barberId] = { name: barberName, avatar: barberAvatar, appointments: 0, revenue: 0 }
      }
      
      barberStats[barberId].appointments++
      barberStats[barberId].revenue += revenue
    })

    const sortedBarbers = Object.values(barberStats)
      .sort((a, b) => b.appointments - a.appointments)
      .slice(0, 5)

    setTopBarbers(sortedBarbers)
  }

  const loadRecentAppointments = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        clients(name),
        barber_profiles(name),
        services(name)
      `)
      .eq('appointment_date', today)
      .order('appointment_time', { ascending: true })
      .limit(5)
    
    if (data) {
      const appointmentsWithNames = data.map(apt => ({
        ...apt,
        client_name: apt.clients?.name,
        barber_name: apt.barber_profiles?.name,
        service_name: apt.services?.name
      }))
      setRecentAppointments(appointmentsWithNames)
    }
  }

  const loadReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        clients(name),
        barber_profiles(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) {
      setReviews(data)
    }
  }

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    
    setClients(data || [])
  }

  const loadBarbers = async () => {
    const { data } = await supabase
      .from('barber_profiles')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    setInitialBarbers(data || []) // Atualizar initialBarbers para realtime
  }

  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    setServices(data || [])
  }

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let clientId = formData.clientId

      // Se não selecionou cliente existente, criar novo
      if (!clientId && clientSearch) {
        if (!newClientPhone) {
          toast.error('Preencha o telefone do novo cliente')
          return
        }

        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: clientSearch,
            phone: newClientPhone,
            whatsapp: newClientPhone
          })
          .select()
          .single()

        if (clientError) {
          toast.error('Erro ao criar cliente')
          return
        }

        clientId = newClient.id
        toast.success('Cliente criado!')
      }

      if (!clientId) {
        toast.error('Selecione ou crie um cliente')
        return
      }

      // Criar agendamento
      const selectedService = services.find(s => s.id === formData.serviceId)
      
      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          barber_id: formData.barberId,
          service_id: formData.serviceId,
          appointment_date: formData.date,
          appointment_time: formData.time,
          status: 'confirmed',
          total_price: selectedService?.price || 0
        })
        .select()
        .single()

      if (appointmentError) {
        toast.error('Erro ao criar agendamento')
        return
      }

      toast.success('Agendamento criado com sucesso!')
      setModalOpen(false)
      loadAllData()
      
      // Registrar log
      try {
        const { auditLogService } = await import('../services/auditLogService')
        const client = clients.find(c => c.id === clientId)
        await auditLogService.logCreate(
          'appointment',
          newAppointment?.id || 'new',
          `Agendamento criado para ${client?.name || 'cliente'} em ${formData.date} às ${formData.time}`
        )
      } catch (error) {
        console.error('Erro ao registrar log:', error)
      }
      
      // Limpar formulário
      setFormData({
        clientId: '',
        barberId: '',
        serviceId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00'
      })
      setClientSearch('')
      setNewClientPhone('')

    } catch (error) {
      
      toast.error('Erro interno')
    }
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      no_show: 'bg-orange-100 text-orange-800 border-orange-300'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300'
  }
  
  
  const handleStatusChange = async (appointmentId: string, newStatus: string, appointment: any) => {
    try {
      if (newStatus === 'completed') {
        // Abrir modal para confirmar valor
        // Usar original_price se existir, senão usar total_price
        let suggestedValue = parseFloat(appointment.original_price || appointment.total_price || '0')
        
        // Verificar se há promoção ativa (função simplificada para Dashboard)
        try {
          const date = new Date(appointment.appointment_date)
          const dayOfWeek = date.getDay()
          const time = appointment.appointment_time.substring(0, 5)

          const { data: promotions } = await supabase
            .from('service_promotions')
            .select('*')
            .eq('service_id', appointment.service_id)
            .eq('is_active', true)

          for (const promo of promotions || []) {
            let applies = false

            if (promo.type === 'weekday' && promo.weekdays?.includes(dayOfWeek)) {
              applies = true
            } else if (promo.type === 'time' && promo.start_time && promo.end_time) {
              const promoStart = promo.start_time.substring(0, 5)
              const promoEnd = promo.end_time.substring(0, 5)
              if (time >= promoStart && time < promoEnd) {
                applies = true
              }
            }

            if (applies) {
              let discountAmount = 0
              if (promo.discount_type === 'percentage') {
                discountAmount = (suggestedValue * promo.discount_value) / 100
              } else {
                discountAmount = promo.discount_value
              }
              suggestedValue = suggestedValue - discountAmount
              
              toast.info(`🎉 Promoção "${promo.name}" detectada! Desconto de R$ ${discountAmount.toFixed(2)} aplicado.`, {
                duration: 4000
              })
              break
            }
          }
        } catch (error) {
          console.error('Erro ao verificar promoções:', error)
        }
        
        setSelectedAppointment(appointment)
        setFinalValue(suggestedValue.toFixed(2))
        setValueModalOpen(true)
        return
      }
      
      if (newStatus === 'cancelled') {
        // Confirmar e deletar
        if (!confirm('Deseja cancelar este agendamento? O horário será liberado.')) {
          return
        }
        
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointmentId)
        
        if (error) {
          toast.error('Erro ao cancelar agendamento')
          return
        }
        
        toast.success('Agendamento cancelado e horário liberado!')
        
        // Registrar log
        try {
          const { auditLogService } = await import('../services/auditLogService')
          await auditLogService.logDelete(
            'appointment',
            appointmentId,
            `Agendamento cancelado - ${appointment.client?.name || 'Cliente'} em ${appointment.appointment_date}`
          )
        } catch (error) {
          console.error('Erro ao registrar log:', error)
        }
        
        loadAllData()
        return
      }
      
      // Atualizar status normalmente
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
      
      if (error) {
        toast.error('Erro ao atualizar status')
        return
      }
      
      toast.success('Status atualizado!')
      
      // Registrar log
      try {
        const { auditLogService } = await import('../services/auditLogService')
        await auditLogService.logUpdate(
          'appointment',
          appointmentId,
          `Status alterado para ${newStatus}`,
          { old_status: appointment.status, new_status: newStatus }
        )
      } catch (error) {
        console.error('Erro ao registrar log:', error)
      }
      
      // Recarregar todos os dados incluindo gráficos
      await Promise.all([
        loadAllData(),
        loadChartData()
      ])
    } catch (error) {
      toast.error('Erro interno')
    }
  }
  
  const handleConfirmValue = async () => {
    if (!selectedAppointment) return
    
    const originalPrice = parseFloat(selectedAppointment.total_price || '0')
    const paidValue = parseFloat(finalValue || '0')
    const discount = originalPrice - paidValue
    
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        total_price: paidValue,
        original_price: originalPrice,
        discount_amount: discount > 0 ? discount : 0
      })
      .eq('id', selectedAppointment.id)
    
    if (error) {
      toast.error('Erro ao finalizar agendamento')
      return
    }
    
    toast.success(`Agendamento finalizado! ${discount > 0 ? `Desconto: R$ ${discount.toFixed(2)}` : ''}`)
    setValueModalOpen(false)
    setSelectedAppointment(null)
    
    // Recarregar todos os dados incluindo gráficos
    await Promise.all([
      loadAllData(),
      loadChartData()
    ])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente colorido */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">📊 Dashboard Completo</h2>
            <p className="mt-2 text-blue-100">
              Análise completa do desempenho da {companyName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Controle de Visibilidade */}
            <button
              onClick={() => setShowValues(!showValues)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {showValues ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
            
            {/* Seletor de Período */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-medium"
            >
              <option value="day" className="text-gray-900">📅 Hoje</option>
              <option value="week" className="text-gray-900">📆 Esta Semana</option>
              <option value="month" className="text-gray-900">🗓️ Este Mês</option>
              <option value="year" className="text-gray-900">📊 Este Ano</option>
            </select>
            
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6 py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Agendamentos
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-700">📅 Hoje</span>
                <span className="text-lg font-bold text-blue-900">{stats.todayAppointments}</span>
              </div>
              <div className="text-xs text-blue-600">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'short' })}
                {stats.todayAppointments === 0 && ' - 🔒 Fechado'}
              </div>
              
              <div className="border-t border-blue-200 pt-2 flex items-center justify-between">
                <span className="text-xs text-green-700">🔜 Amanhã</span>
                <span className="text-lg font-bold text-green-900">{stats.tomorrowAppointments}</span>
              </div>
              
              <div className="border-t border-blue-200 pt-2 flex items-center justify-between">
                <span className="text-xs text-purple-700">📊 Semana</span>
                <span className="text-lg font-bold text-purple-900">{stats.weekAppointments}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              {isBarber ? 'Meu Faturamento' : 'Faturamento Total'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {showValues ? `R$ ${stats.revenue.toFixed(2)}` : '••••••'}
            </div>
            {isBarber && commissionRate > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Comissão: {commissionRate}%
                </p>
                <div className="pt-2 border-t border-green-200">
                  <p className="text-xs text-green-700 font-medium">Sua comissão:</p>
                  <p className="text-lg font-bold text-green-800">
                    {showValues ? `R$ ${barberCommission.toFixed(2)}` : '••••••'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-green-600">
                Agendamentos completados
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.totalClients}</div>
            <p className="text-xs text-purple-600">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Avaliação Média
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {stats.avgRating.toFixed(1)} ⭐
            </div>
            <p className="text-xs text-yellow-600">
              Média de avaliações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Faturamento e Serviços Mais Vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Faturamento - {period === 'day' ? 'Hoje' : period === 'week' ? 'Esta Semana' : period === 'month' ? 'Este Mês' : 'Este Ano'}
              </CardTitle>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-1 rounded ${chartType === 'bar' ? 'bg-white shadow-sm' : ''}`}
                  title="Gráfico de Barras"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`p-1 rounded ${chartType === 'line' ? 'bg-white shadow-sm' : ''}`}
                  title="Gráfico de Linha"
                >
                  <Activity className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {showValues ? `R$ ${revenueData[period as keyof typeof revenueData].toFixed(2)}` : '••••••'}
              </div>
            </div>
            
            {/* Gráfico de Faturamento Real */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              {chartType === 'bar' && (
                <div className="flex items-end justify-center gap-1 h-48">
                  {(() => {
                    const maxValue = Math.max(...chartData, 1)
                    const labels = period === 'day' ? 
                      Array.from({ length: 24 }, (_, i) => `${i}h`) :
                      period === 'week' ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] :
                      period === 'month' ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'] :
                      ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                    
                    return chartData.map((value, i) => {
                      const height = maxValue > 0 ? (value / maxValue) * 180 : 10
                      return (
                        <div key={i} className="flex flex-col items-center flex-1">
                          <div
                            className="bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                            style={{ 
                              height: `${height}px`,
                              minHeight: '4px',
                              width: period === 'day' ? '8px' : period === 'year' ? '12px' : '20px'
                            }}
                            title={`${labels[i]} - ${showValues ? `R$ ${value.toFixed(2)}` : '••••••'}`}
                          />
                          {period !== 'day' && (
                            <span className={`text-xs mt-1 text-gray-500 ${period === 'year' ? 'transform -rotate-45' : ''}`}>
                              {labels[i]}
                            </span>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
              
              {chartType === 'line' && (
                <div className="flex items-center justify-center h-48 relative">
                  <svg width="100%" height="180" viewBox="0 0 300 180" className="text-blue-500">
                    {(() => {
                      const maxValue = Math.max(...chartData, 1)
                      const points = chartData.map((value, i) => {
                        const x = (i / (chartData.length - 1)) * 280 + 10
                        const y = 170 - (maxValue > 0 ? (value / maxValue) * 150 : 0)
                        return `${x},${y}`
                      }).join(' ')
                      
                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            points={points}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {chartData.map((value, i) => {
                            const x = (i / (chartData.length - 1)) * 280 + 10
                            const y = 170 - (maxValue > 0 ? (value / maxValue) * 150 : 0)
                            return (
                              <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="currentColor"
                                className="hover:r-6 cursor-pointer"
                              >
                                <title>{showValues ? `R$ ${value.toFixed(2)}` : '••••••'}</title>
                              </circle>
                            )
                          })}
                        </>
                      )
                    })()}
                  </svg>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Serviços Mais Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Serviços Mais Vendidos - {period === 'day' ? 'Hoje' : period === 'week' ? 'Esta Semana' : period === 'month' ? 'Este Mês' : 'Este Ano'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Gráfico Pizza dos Serviços */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <div className="flex items-center justify-center h-40 mb-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden" style={{
                    background: topServices.length > 0 ? `conic-gradient(
                      #3B82F6 0deg ${topServices[0] ? (topServices[0].count / topServices.reduce((sum, s) => sum + s.count, 0)) * 360 : 0}deg,
                      #10B981 ${topServices[0] ? (topServices[0].count / topServices.reduce((sum, s) => sum + s.count, 0)) * 360 : 0}deg ${topServices[1] ? ((topServices[0]?.count + topServices[1]?.count) / topServices.reduce((sum, s) => sum + s.count, 0)) * 360 : 120}deg,
                      #F59E0B ${topServices[1] ? ((topServices[0]?.count + topServices[1]?.count) / topServices.reduce((sum, s) => sum + s.count, 0)) * 360 : 120}deg ${topServices[2] ? ((topServices[0]?.count + topServices[1]?.count + topServices[2]?.count) / topServices.reduce((sum, s) => sum + s.count, 0)) * 360 : 240}deg,
                      #EF4444 ${topServices[2] ? ((topServices[0]?.count + topServices[1]?.count + topServices[2]?.count) / topServices.reduce((sum, s) => sum + s.count, 0)) * 360 : 240}deg ${topServices[3] ? ((topServices[0]?.count + topServices[1]?.count + topServices[2]?.count + topServices[3]?.count) / topServices.reduce((sum, s) => sum + s.count, 0)) * 360 : 300}deg,
                      #8B5CF6 ${topServices[3] ? ((topServices[0]?.count + topServices[1]?.count + topServices[2]?.count + topServices[3]?.count) / topServices.reduce((sum, s) => sum + s.count, 0)) * 360 : 300}deg 360deg
                    )` : '#E5E7EB'
                  }}>
                    <div className="w-16 h-16 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              </div>
              
              {/* Legenda */}
              <div className="space-y-2">
                {topServices.slice(0, 5).map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] 
                        }}
                      />
                      <span className="text-sm font-medium">{service.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {service.count} vendas
                    </div>
                  </div>
                ))}
              </div>
              
              {topServices.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum serviço vendido ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Barbeiros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            🏆 Ranking dos Barbeiros - {period === 'day' ? 'Hoje' : period === 'week' ? 'Esta Semana' : period === 'month' ? 'Este Mês' : 'Este Ano'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topBarbers.map((barber, index) => (
              <div key={index} className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300' :
                index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300' :
                index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {barber.avatar ? (
                      <img
                        src={barber.avatar}
                        alt={barber.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                        'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}>
                        {barber?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{barber.name}</div>
                    <div className="text-sm text-gray-600">{barber.appointments} atendimentos realizados</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl text-green-600">
                    {showValues ? `R$ ${barber.revenue.toFixed(2)}` : '••••••'}
                  </div>
                  <div className="text-sm text-gray-500">faturamento gerado</div>
                </div>
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    👑 LÍDER
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {topBarbers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum atendimento realizado ainda neste período</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agendamentos de Hoje e Avaliações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agendamentos de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAppointments.length > 0 ? (
                recentAppointments.map((apt) => (
                  <div key={apt.id} className="p-3 border-2 rounded-lg hover:shadow-md transition-all bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{apt.client_name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          💈 {apt.service_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ✂️ {apt.barber_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>🕐 {apt.appointment_time?.substring(0, 5)}</span>
                        <span>💰 R$ {(parseFloat(apt.total_price || '0') || 0).toFixed(2)}</span>
                      </div>
                      <select
                        value={apt.status}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleStatusChange(apt.id, e.target.value, apt)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer transition-all border-2 ${getStatusColor(apt.status)} hover:opacity-80`}
                        style={{ 
                          backgroundImage: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none'
                        }}
                      >
                        <option value="scheduled">📅 Agendado</option>
                        <option value="completed">✅ Realizado</option>
                        <option value="cancelled">❌ Cancelado</option>
                        <option value="no_show">⚠️ Não Compareceu</option>
                      </select>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum agendamento para hoje</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Avaliações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{review.clients?.name}</div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.barber_profiles && (
                      <div className="text-sm text-gray-500 mb-1">
                        Barbeiro: {review.barber_profiles.name}
                      </div>
                    )}
                    {review.comment && (
                      <div className="text-sm text-gray-600">"{review.comment}"</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma avaliação ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Novo Agendamento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            <div>
              <Label htmlFor="clientSearch">Cliente *</Label>
              <Input
                id="clientSearch"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Digite o nome do cliente"
                required
              />
              {clientSearch && filteredClients.length > 0 && (
                <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setFormData({ ...formData, clientId: client.id })
                        setClientSearch(client.name)
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {client.name} - {client.phone}
                    </div>
                  ))}
                </div>
              )}
              {clientSearch && filteredClients.length === 0 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">Cliente não encontrado. Preencha o telefone para criar:</p>
                  <Input
                    className="mt-2"
                    placeholder="Telefone"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="barberId">Barbeiro *</Label>
              <Select
                id="barberId"
                value={formData.barberId}
                onChange={(e) => setFormData({ ...formData, barberId: e.target.value })}
                required
              >
                <option value="">Selecione um barbeiro</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="serviceId">Serviço *</Label>
              <Select
                id="serviceId"
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                required
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - R$ {service.price}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Horário *</Label>
                <Select
                  id="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                >
                  <option value="09:00">09:00</option>
                  <option value="09:30">09:30</option>
                  <option value="10:00">10:00</option>
                  <option value="10:30">10:30</option>
                  <option value="11:00">11:00</option>
                  <option value="11:30">11:30</option>
                  <option value="14:00">14:00</option>
                  <option value="14:30">14:30</option>
                  <option value="15:00">15:00</option>
                  <option value="15:30">15:30</option>
                  <option value="16:00">16:00</option>
                  <option value="16:30">16:30</option>
                  <option value="17:00">17:00</option>
                  <option value="17:30">17:30</option>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Agendamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Confirmação de Valor */}
      <Dialog open={valueModalOpen} onOpenChange={setValueModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Valor do Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Cliente: <span className="font-medium">{selectedAppointment?.client_name}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Serviço: <span className="font-medium">{selectedAppointment?.service_name}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Valor original: <span className="font-medium">R$ {parseFloat(selectedAppointment?.original_price || selectedAppointment?.total_price || 0).toFixed(2)}</span>
              </p>
            </div>
            
            <div>
              <Label htmlFor="finalValue">Valor Final Pago *</Label>
              <Input
                id="finalValue"
                type="number"
                step="0.01"
                value={finalValue}
                onChange={(e) => setFinalValue(e.target.value)}
                placeholder="0.00"
                className="text-lg font-medium"
              />
              {parseFloat(finalValue || '0') < parseFloat(selectedAppointment?.original_price || selectedAppointment?.total_price || '0') && (
                <p className="text-sm text-green-600 mt-1">
                  💰 Desconto: R$ {(parseFloat(selectedAppointment?.original_price || selectedAppointment?.total_price || '0') - parseFloat(finalValue || '0')).toFixed(2)}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setValueModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmValue} className="bg-green-600 hover:bg-green-700">
              ✅ Confirmar e Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Dashboard
