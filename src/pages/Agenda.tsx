import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, Scissors, Gift } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRealtimeBarbers } from '../hooks/useRealtimeBarbers'
import { auditLogService } from '../services/auditLogService'

interface Appointment {
  id: string
  client_id: string
  barber_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  status: string
  total_price?: number
  original_price?: number
  discount_amount?: number
  notes?: string
  client_name?: string
  barber_name?: string
  service_name?: string
}

interface Client {
  id: string
  name: string
  phone?: string
  email?: string
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

// Gerar slots de 10 em 10 minutos (9h às 20h)
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 9; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    }
  }
  return slots
}

const timeSlots = generateTimeSlots()

const Agenda = () => {

  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [initialBarbers, setInitialBarbers] = useState<any[]>([])
  const barbers = useRealtimeBarbers(initialBarbers as any) // Sincronização em tempo real
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [blockedSlots, setBlockedSlots] = useState<any[]>([])

  const [formData, setFormData] = useState({
    clientId: '',
    barberId: '',
    serviceId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    notes: ''
  })

  const [blockFormData, setBlockFormData] = useState({
    barberId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    reason: ''
  })

  const [clientSearch, setClientSearch] = useState('')
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const [newClientPhone, setNewClientPhone] = useState('')

  // Modal de confirmação de valor
  const [valueModalOpen, setValueModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [finalValue, setFinalValue] = useState('')
  const [workingHours, setWorkingHours] = useState<any>(null)

  // Pacotes do cliente
  const [clientPackages, setClientPackages] = useState<any[]>([])
  const [showPackageOption, setShowPackageOption] = useState(false)
  const [usePackage, setUsePackage] = useState(false)
  const [selectedClientPackage, setSelectedClientPackage] = useState<any>(null)

  useEffect(() => {
    loadData()
    loadWorkingHours()
  }, [currentDate])

  // Carregar pacotes quando cliente for selecionado
  useEffect(() => {
    if (formData.clientId) {
      loadClientPackages(formData.clientId)
    }
  }, [formData.clientId])

  const loadWorkingHours = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'working_hours')
        .single()

      if (data && data.value) {
        setWorkingHours(data.value)
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
    }
  }

  const isDayClosed = () => {
    if (!workingHours) return false

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[currentDate.getDay()]

    return workingHours[dayName]?.closed || false
  }

  // Fechar modais com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dialogOpen) {
          setDialogOpen(false)
        }
        if (blockDialogOpen) {
          setBlockDialogOpen(false)
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [dialogOpen, blockDialogOpen])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadAppointments(),
        loadBarbers(),
        loadClients(),
        loadServices(),
        loadBlockedSlots()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da agenda')
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd')

    // OTIMIZAÇÃO: Usar JOIN para carregar tudo de uma vez
    const { data: appointmentsData, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (name),
        barber_profiles (name),
        services (name, price)
      `)
      .eq('appointment_date', dateStr)
      .neq('status', 'cancelled')
      .order('appointment_time')

    if (error) {
      console.error('Erro ao carregar agendamentos:', error)
      return
    }

    // Mapear dados para formato esperado
    const appointmentsWithNames = (appointmentsData || []).map(apt => ({
      ...apt,
      client_name: apt.clients?.name,
      barber_name: apt.barber_profiles?.name,
      service_name: apt.services?.name
    }))

    setAppointments(appointmentsWithNames)
  }

  const loadBarbers = async () => {
    const { data, error } = await supabase
      .from('barber_profiles')
      .select('id, name, is_active, avatar')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Erro ao carregar barbeiros:', error)
      toast.error('Erro ao carregar barbeiros')
      return
    }

    setInitialBarbers(data || []) // Atualizar initialBarbers para realtime
  }

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, phone, email')
      .order('name')

    if (error) {
      console.error('Erro ao carregar clientes:', error)
      return
    }

    setClients(data || [])
  }

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, price, duration')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error('Erro ao carregar serviços:', error)
      return
    }

    setServices(data || [])
  }

  const loadBlockedSlots = async () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('date', dateStr)

    if (error) {
      console.error('Erro ao carregar bloqueios:', error)
      return
    }

    setBlockedSlots(data || [])
  }

  // Carregar pacotes ativos do cliente
  const loadClientPackages = async (clientId: string) => {
    if (!clientId) {
      setClientPackages([])
      setShowPackageOption(false)
      return
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('client_packages')
        .select(`
          *,
          service_packages (
            name,
            package_services (
              service_id,
              quantity,
              services (name)
            )
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .gte('expiry_date', today)

      if (error) throw error

      if (!data || data.length === 0) {
        setClientPackages([])
        setShowPackageOption(false)
        return
      }

      // OTIMIZAÇÃO: Buscar todos os usos de uma vez
      const packageIds = data.map(pkg => pkg.id)
      const { data: allUsage } = await supabase
        .from('package_usage')
        .select('client_package_id, service_id')
        .in('client_package_id', packageIds)

      // Contar usos por pacote e serviço
      const usageCounts: Record<string, Record<string, number>> = {}
      allUsage?.forEach(usage => {
        if (!usageCounts[usage.client_package_id]) {
          usageCounts[usage.client_package_id] = {}
        }
        usageCounts[usage.client_package_id][usage.service_id] =
          (usageCounts[usage.client_package_id][usage.service_id] || 0) + 1
      })

      // Mapear dados
      const packagesWithUsage = data.map(pkg => {
        const usageByService: any = {}

        pkg.service_packages?.package_services?.forEach((ps: any) => {
          const used = usageCounts[pkg.id]?.[ps.service_id] || 0
          usageByService[ps.service_id] = {
            used,
            total: ps.quantity,
            remaining: ps.quantity - used,
            serviceName: ps.services?.name
          }
        })

        return {
          ...pkg,
          usageByService
        }
      })

      setClientPackages(packagesWithUsage)
      setShowPackageOption(packagesWithUsage.length > 0)
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error)
      setClientPackages([])
      setShowPackageOption(false)
    }
  }

  // Verificar e aplicar promoções
  const checkAndApplyPromotion = async (serviceId: string, appointmentDate: string, appointmentTime: string) => {
    try {
      const date = new Date(appointmentDate)
      const dayOfWeek = date.getDay() // 0 = domingo, 1 = segunda, etc
      const time = appointmentTime.substring(0, 5)

      const { data: promotions, error } = await supabase
        .from('service_promotions')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)

      if (error) throw error

      // Verificar promoções aplicáveis
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
          return promo
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao verificar promoções:', error)
      return null
    }
  }

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!blockFormData.barberId) {
      toast.error('Selecione um barbeiro')
      return
    }

    try {
      const { error } = await supabase
        .from('blocked_slots')
        .insert({
          barber_id: blockFormData.barberId,
          date: blockFormData.date,
          start_time: blockFormData.startTime,
          end_time: blockFormData.endTime,
          reason: blockFormData.reason || 'Bloqueio manual'
        })

      if (error) throw error

      toast.success('Horário bloqueado com sucesso!')
      setBlockDialogOpen(false)
      setBlockFormData({
        barberId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        reason: ''
      })
      loadBlockedSlots()
    } catch (error) {
      console.error('Erro ao bloquear horário:', error)
      toast.error('Erro ao bloquear horário')
    }
  }

  // Validar se todos os slots necessários estão livres
  const validateAvailability = (barberId: string, startTime: string, duration: number) => {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const startTimeInMinutes = startHour * 60 + startMinute
    const slotsNeeded = Math.ceil(duration / 10)

    // Verificar cada slot necessário
    for (let i = 0; i < slotsNeeded; i++) {
      const slotTimeInMinutes = startTimeInMinutes + (i * 10)
      const slotHour = Math.floor(slotTimeInMinutes / 60)
      const slotMinute = slotTimeInMinutes % 60
      const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`

      // Verificar se há agendamento neste slot
      const occupied = isSlotOccupiedByPreviousAppointment(barberId, slotTime)
      const hasAppointment = getAppointmentForSlot(barberId, slotTime)

      if (occupied || hasAppointment) {
        return {
          available: false,
          conflictTime: slotTime
        }
      }
    }

    return { available: true }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.barberId) {
      toast.error('Selecione um barbeiro')
      return
    }

    if (!formData.serviceId) {
      toast.error('Selecione um serviço')
      return
    }

    // Verificar se barbeiro existe
    const barberExists = barbers.find(b => b.id === formData.barberId)
    if (!barberExists) {
      toast.error('Barbeiro selecionado não existe')
      return
    }

    // VALIDAR DIA FECHADO
    if (workingHours) {
      const appointmentDate = new Date(formData.date + 'T00:00:00')
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[appointmentDate.getDay()]

      if (workingHours[dayName]?.closed) {
        toast.error('❌ A barbearia está fechada neste dia!\n\nEscolha outro dia para agendar.', {
          duration: 5000
        })
        return
      }
    }

    // VALIDAR HORÁRIO BLOQUEADO
    const { data: blockedSlotsForDate, error: blockError } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('date', formData.date)
      .eq('barber_id', formData.barberId)

    if (!blockError && blockedSlotsForDate && blockedSlotsForDate.length > 0) {
      const timeToCheck = formData.time
      const isBlocked = blockedSlotsForDate.some(block => {
        const blockStart = block.start_time.substring(0, 5)
        const blockEnd = block.end_time.substring(0, 5)
        return timeToCheck >= blockStart && timeToCheck < blockEnd
      })

      if (isBlocked) {
        toast.error('❌ Este horário está bloqueado!\n\nO barbeiro não está disponível neste horário.', {
          duration: 5000
        })
        return
      }
    }

    try {
      if (editingAppointment) {
        // Atualizar agendamento
        const { error } = await supabase
          .from('appointments')
          .update({
            client_id: formData.clientId,
            barber_id: formData.barberId,
            service_id: formData.serviceId,
            appointment_date: formData.date,
            appointment_time: formData.time,
            notes: formData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAppointment.id)

        if (error) {
          console.error('Erro ao atualizar agendamento:', error)
          toast.error('Erro ao atualizar agendamento')
          return
        }

        toast.success('Agendamento atualizado com sucesso!')
      } else {
        // Criar novo agendamento
        const selectedService = services.find(s => s.id === formData.serviceId)

        if (!selectedService) {
          toast.error('Serviço não encontrado')
          return
        }

        // VALIDAR DISPONIBILIDADE
        const validation = validateAvailability(formData.barberId, formData.time, selectedService.duration)

        if (!validation.available) {
          toast.error(`❌ Horário ${validation.conflictTime} já está ocupado!\n\nEscolha outro horário disponível.`, {
            duration: 5000
          })
          return
        }

        // Calcular preço com promoções
        let finalPrice = selectedService.price
        let originalPrice = selectedService.price
        let discountAmount = 0
        let promotionApplied = null

        // Verificar promoções
        const promotion = await checkAndApplyPromotion(formData.serviceId, formData.date, formData.time)
        if (promotion) {
          promotionApplied = promotion
          if (promotion.discount_type === 'percentage') {
            discountAmount = (originalPrice * promotion.discount_value) / 100
          } else {
            discountAmount = promotion.discount_value
          }
          finalPrice = originalPrice - discountAmount
        }

        // Se usar pacote, preço = 0
        if (usePackage && selectedClientPackage) {
          finalPrice = 0
          originalPrice = selectedService.price
          discountAmount = selectedService.price
        }

        const { data: newAppointment, error } = await supabase
          .from('appointments')
          .insert({
            client_id: formData.clientId,
            barber_id: formData.barberId,
            service_id: formData.serviceId,
            appointment_date: formData.date,
            appointment_time: formData.time,
            status: 'scheduled',
            total_price: finalPrice,
            original_price: originalPrice,
            discount_amount: discountAmount,
            notes: formData.notes
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Erro ao criar agendamento:', error)
          toast.error(`Erro ao criar agendamento: ${error.message}`)
          return
        }

        // Se usou pacote, registrar uso
        if (usePackage && selectedClientPackage && newAppointment) {
          const { error: usageError } = await supabase
            .from('package_usage')
            .insert({
              client_package_id: selectedClientPackage.id,
              service_id: formData.serviceId,
              appointment_id: newAppointment.id,
              used_at: new Date().toISOString()
            })

          if (usageError) {
            console.error('Erro ao registrar uso do pacote:', usageError)
          } else {
            toast.success('✅ Agendamento criado usando pacote!')
          }
        } else if (promotionApplied) {
          toast.success(`✅ Agendamento criado com ${discountAmount.toFixed(2)} de desconto!`)
        } else {
          toast.success('Agendamento criado com sucesso!')
        }

        // Registrar log de auditoria
        const client = clients.find(c => c.id === formData.clientId)
        const barber = barbers.find(b => b.id === formData.barberId)
        const service = services.find(s => s.id === formData.serviceId)

        await auditLogService.logCreate(
          'appointment',
          newAppointment.id,
          `Agendamento de ${client?.name || 'Cliente'}`,
          {
            barber: barber?.name,
            service: service?.name,
            date: formData.date,
            time: formData.time,
            price: finalPrice
          }
        )
      }

      setDialogOpen(false)
      setEditingAppointment(null)
      resetForm()
      loadAppointments()
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
      toast.error('Erro interno do servidor')
    }
  }

  const handleDelete = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (error) {
        console.error('Erro ao excluir agendamento:', error)
        toast.error('Erro ao excluir agendamento')
        return
      }

      // Registrar log
      const appointment = appointments.find(a => a.id === appointmentId)
      if (appointment) {
        await auditLogService.logDelete(
          'appointment',
          appointmentId,
          `Agendamento de ${appointment.client_name || 'Cliente'}`
        )
      }

      toast.success('Agendamento excluído com sucesso!')
      loadAppointments()
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error)
      toast.error('Erro interno do servidor')
    }
  }

  const openAddDialog = (barberId?: string, time?: string) => {
    setEditingAppointment(null)
    resetForm()
    if (barberId) setFormData(prev => ({ ...prev, barberId }))
    if (time) setFormData(prev => ({ ...prev, time }))
    setDialogOpen(true)
  }

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setFormData({
      clientId: appointment.client_id,
      barberId: appointment.barber_id,
      serviceId: appointment.service_id,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      notes: appointment.notes || ''
    })
    setClientSearch(appointment.client_name || '')
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      clientId: '',
      barberId: '',
      serviceId: '',
      date: format(currentDate, 'yyyy-MM-dd'),
      time: '09:00',
      notes: ''
    })
    setClientSearch('')
    setShowClientSuggestions(false)
    setNewClientPhone('')
    setClientPackages([])
    setShowPackageOption(false)
    setUsePackage(false)
    setSelectedClientPackage(null)
  }

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


  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      if (newStatus === 'completed') {
        // Abrir modal para confirmar valor
        const appointment = appointments.find(apt => apt.id === appointmentId)
        if (appointment) {
          // Usar original_price se existir, senão usar total_price
          let suggestedValue = parseFloat(appointment.original_price?.toString() || appointment.total_price?.toString() || '0')

          // Verificar se há promoção ativa
          const promotion = await checkAndApplyPromotion(
            appointment.service_id,
            appointment.appointment_date,
            appointment.appointment_time
          )

          if (promotion) {
            // Calcular desconto da promoção
            let discountAmount = 0
            if (promotion.discount_type === 'percentage') {
              discountAmount = (suggestedValue * promotion.discount_value) / 100
            } else {
              discountAmount = promotion.discount_value
            }
            suggestedValue = suggestedValue - discountAmount

            toast.info(`🎉 Promoção "${promotion.name}" detectada! Desconto de R$ ${discountAmount.toFixed(2)} aplicado.`, {
              duration: 4000
            })
          }

          setSelectedAppointment(appointment)
          setFinalValue(suggestedValue.toFixed(2))
          setValueModalOpen(true)
        }
        return
      }

      // Se cancelar, confirmar e deletar
      if (newStatus === 'cancelled') {
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
        loadAppointments()
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

      // Registrar log
      const appointment = appointments.find(a => a.id === appointmentId)
      if (appointment) {
        await auditLogService.logUpdate(
          'appointment',
          appointmentId,
          `Agendamento de ${appointment.client_name || 'Cliente'}`,
          { status: `${appointment.status} → ${newStatus}` }
        )
      }

      toast.success('Status atualizado com sucesso!')
      loadAppointments()
    } catch (error) {
      toast.error('Erro interno')
    }
  }

  const handleConfirmValue = async () => {
    if (!selectedAppointment) return

    const originalPrice = parseFloat(selectedAppointment.total_price?.toString() || '0')
    const paidValue = parseFloat(finalValue || '0')
    const discount = originalPrice - paidValue

    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        total_price: paidValue,
        original_price: originalPrice > 0 ? originalPrice : paidValue,
        discount_amount: discount > 0 ? discount : 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedAppointment.id)

    if (error) {
      console.error('Erro ao finalizar:', error)
      toast.error(`Erro ao finalizar: ${error.message}`)
      return
    }

    // Registrar log de pagamento
    await auditLogService.logUpdate(
      'appointment',
      selectedAppointment.id,
      `Pagamento de ${selectedAppointment.client_name || 'Cliente'}`,
      { paid_value: paidValue, payment_status: 'paid' }
    )

    toast.success(`Agendamento finalizado! ${discount > 0 ? `Desconto: R$ ${discount.toFixed(2)}` : ''}`)
    setValueModalOpen(false)
    setSelectedAppointment(null)
    loadAppointments()
  }

  const getAppointmentForSlot = (barberId: string, time: string) => {
    return appointments.find(
      (apt) => apt.barber_id === barberId && apt.appointment_time?.substring(0, 5) === time
    )
  }

  // Calcular quantos slots um agendamento ocupa
  const calculateSlotsOccupied = (duration: number) => {
    return Math.ceil(duration / 10) // 10 minutos por slot
  }

  // Verificar se um slot está ocupado por um agendamento que começou antes
  const isSlotOccupiedByPreviousAppointment = (barberId: string, time: string) => {
    const [currentHour, currentMinute] = time.split(':').map(Number)
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    return appointments.find(apt => {
      if (apt.barber_id !== barberId) return false

      const aptTime = apt.appointment_time?.substring(0, 5)
      if (!aptTime) return false

      const [aptHour, aptMinute] = aptTime.split(':').map(Number)
      const aptTimeInMinutes = aptHour * 60 + aptMinute

      // Buscar duração do serviço
      const service = services.find(s => s.id === apt.service_id)
      const duration = service?.duration || 30
      const endTimeInMinutes = aptTimeInMinutes + duration

      // Verifica se o horário atual está dentro do período do agendamento
      return currentTimeInMinutes >= aptTimeInMinutes && currentTimeInMinutes < endTimeInMinutes
    })
  }


  const getBlockForSlot = (barberId: string, time: string) => {
    return blockedSlots.find(block => {
      if (block.barber_id !== barberId) return false

      const blockStart = block.start_time.substring(0, 5)
      const blockEnd = block.end_time.substring(0, 5)

      return time >= blockStart && time < blockEnd
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente colorido */}
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold">📅 Agenda</h2>
        <p className="mt-2 text-green-100">
          Gerencie os agendamentos da barbearia
        </p>
      </div>

      {/* Controles de Data */}
      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <Calendar className="h-5 w-5" />
              📅 {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addDays(currentDate, -1))}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addDays(currentDate, 1))}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Botões Adicionar */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={() => setBlockDialogOpen(true)}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 font-medium px-6 py-2 flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          🚫 Bloquear Horário
        </Button>
        <Button
          onClick={() => openAddDialog()}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium px-6 py-2 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          ➕ Novo Agendamento
        </Button>
      </div>

      {/* Grid da Agenda */}
      <Card className="border-l-4 border-l-green-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Clock className="h-5 w-5" />
            🕐 Horários do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isDayClosed() ? (
            <div className="text-center py-12 bg-red-50 rounded-lg border-2 border-red-200">
              <Clock className="h-16 w-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-2xl font-bold mb-2 text-red-800">🔒 Fechado</h3>
              <p className="text-lg text-red-600">A barbearia está fechada neste dia.</p>
              <p className="text-sm text-red-500 mt-2">Selecione outro dia para agendar.</p>
            </div>
          ) : barbers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nenhum barbeiro ativo</h3>
              <p className="text-sm">Ative barbeiros para começar a agendar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-2 border-gray-200 p-3 bg-gray-50 text-left font-semibold">
                      ⏰ Horário
                    </th>
                    {barbers.map((barber) => (
                      <th key={barber.id} className="border-2 border-gray-200 p-3 bg-blue-50 text-center font-semibold text-blue-700">
                        <div className="flex flex-col items-center gap-2">
                          {barber.avatar ? (
                            <img
                              src={barber.avatar}
                              alt={barber.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-blue-300"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                              {barber?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span>{barber.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time) => (
                    <tr key={time}>
                      <td className="border-2 border-gray-200 p-3 bg-gray-50 font-medium text-center">
                        {time}
                      </td>
                      {barbers.map((barber) => {
                        const appointment = getAppointmentForSlot(barber.id, time)
                        const blocked = getBlockForSlot(barber.id, time)
                        const occupiedByPrevious = isSlotOccupiedByPreviousAppointment(barber.id, time)

                        // Se está ocupado por agendamento anterior, não renderiza nada
                        if (occupiedByPrevious && !appointment) {
                          return null
                        }

                        // Calcular rowspan se for um agendamento
                        let rowspan = 1
                        if (appointment) {
                          const service = services.find(s => s.id === appointment.service_id)
                          const duration = service?.duration || 30
                          rowspan = calculateSlotsOccupied(duration)
                        }

                        return (
                          <td
                            key={`${barber.id}-${time}`}
                            className="border-2 border-gray-200 p-2"
                            rowSpan={appointment ? rowspan : 1}
                          >
                            {blocked ? (
                              <div className="p-3 rounded-lg bg-red-100 border-l-4 border-l-red-500">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-red-600" />
                                    <span className="font-semibold text-red-800">🚫 Bloqueado</span>
                                  </div>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      try {
                                        const blockStart = blocked.start_time.substring(0, 5)
                                        const blockEnd = blocked.end_time.substring(0, 5)

                                        // Calcular próximo horário (adicionar 10 minutos)
                                        const [hours, minutes] = time.split(':').map(Number)
                                        const nextMinutes = minutes + 10
                                        const nextHours = hours + Math.floor(nextMinutes / 60)
                                        const nextTime = `${nextHours.toString().padStart(2, '0')}:${(nextMinutes % 60).toString().padStart(2, '0')}`

                                        // Deletar bloqueio original
                                        await supabase
                                          .from('blocked_slots')
                                          .delete()
                                          .eq('id', blocked.id)

                                        // Se o bloqueio começava antes deste horário, criar bloqueio para a parte anterior
                                        if (blockStart < time) {
                                          await supabase
                                            .from('blocked_slots')
                                            .insert({
                                              barber_id: blocked.barber_id,
                                              date: blocked.date,
                                              start_time: blocked.start_time,
                                              end_time: time + ':00',
                                              reason: blocked.reason
                                            })
                                        }

                                        // Se o bloqueio terminava depois deste horário, criar bloqueio para a parte posterior
                                        if (blockEnd > nextTime) {
                                          await supabase
                                            .from('blocked_slots')
                                            .insert({
                                              barber_id: blocked.barber_id,
                                              date: blocked.date,
                                              start_time: nextTime + ':00',
                                              end_time: blocked.end_time,
                                              reason: blocked.reason
                                            })
                                        }

                                        toast.success(`${time} desbloqueado!`)
                                        loadBlockedSlots()
                                      } catch (error) {
                                        console.error('Erro ao desbloquear:', error)
                                        toast.error('Erro ao desbloquear horário')
                                      }
                                    }}
                                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                    title="Desbloquear apenas este horário"
                                  >
                                    ✓
                                  </button>
                                </div>
                                {blocked.reason && (
                                  <div className="text-xs text-red-600 mt-1">{blocked.reason}</div>
                                )}
                                <div className="text-xs text-red-500 mt-1">
                                  {blocked.start_time.substring(0, 5)} - {blocked.end_time.substring(0, 5)}
                                </div>
                              </div>
                            ) : appointment ? (
                              <div className="relative group h-full">
                                <div
                                  className="p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-l-blue-500 h-full flex flex-col justify-between"
                                  onClick={() => openEditDialog(appointment)}
                                >
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <User className="h-4 w-4 text-blue-600" />
                                      <span className="font-semibold text-blue-800">{appointment.client_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Scissors className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm text-purple-700">{appointment.service_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="h-3 w-3 text-gray-600" />
                                      <span className="text-xs text-gray-600">
                                        {services.find(s => s.id === appointment.service_id)?.duration || 0} min
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <select
                                      value={appointment.status}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(appointment.id, e.target.value)
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer transition-all appearance-none outline-none border-2 ${getStatusColor(appointment.status)} hover:opacity-80`}
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
                              </div>
                            ) : (
                              <button
                                onClick={() => openAddDialog(barber.id, time)}
                                className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center text-gray-400 hover:text-blue-600"
                              >
                                <Plus className="h-6 w-6" />
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Adicionar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Label htmlFor="client">Cliente *</Label>
              <Input
                id="client"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value)
                  setShowClientSuggestions(true)
                  setFormData({ ...formData, clientId: '' })
                }}
                onFocus={() => setShowClientSuggestions(true)}
                placeholder="Digite o nome do cliente..."
                className="w-full"
                autoComplete="off"
              />

              {/* Sugestões de clientes */}
              {showClientSuggestions && clientSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {clients
                    .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                    .map((client) => (
                      <div
                        key={client.id}
                        onClick={() => {
                          setFormData({ ...formData, clientId: client.id })
                          setClientSearch(client.name)
                          setShowClientSuggestions(false)
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b"
                      >
                        <div className="font-medium">{client.name}</div>
                        {client.phone && <div className="text-sm text-gray-500">{client.phone}</div>}
                      </div>
                    ))}

                  {/* Opção de cadastrar novo cliente */}
                  {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                    <div className="p-4 border-t bg-green-50">
                      <div className="text-sm text-gray-600 mb-2">Cliente não encontrado. Cadastrar novo?</div>
                      <Input
                        placeholder="Telefone do cliente"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="mb-2"
                      />
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!clientSearch.trim()) {
                            toast.error('Digite o nome do cliente')
                            return
                          }
                          if (!newClientPhone.trim()) {
                            toast.error('Digite o telefone do cliente')
                            return
                          }

                          try {
                            const { data, error } = await supabase
                              .from('clients')
                              .insert({ name: clientSearch, phone: newClientPhone })
                              .select()
                              .single()

                            if (error) throw error

                            toast.success('Cliente cadastrado com sucesso!')
                            setClients([...clients, data])
                            setFormData({ ...formData, clientId: data.id })
                            setShowClientSuggestions(false)
                            setNewClientPhone('')
                          } catch (error) {
                            console.error('Erro ao cadastrar cliente:', error)
                            toast.error('Erro ao cadastrar cliente')
                          }
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Cadastrar "{clientSearch}"
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="barber">Barbeiro *</Label>
              <select
                id="barber"
                value={formData.barberId}
                onChange={(e) => setFormData({ ...formData, barberId: e.target.value })}
                required
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
              >
                <option value="">Selecione um barbeiro</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="service">Serviço *</Label>
              <select
                id="service"
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                required
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - R$ {service.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="border-2 focus:border-blue-400"
                />
              </div>

              <div>
                <Label htmlFor="time">Horário</Label>
                <select
                  id="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Opção de Pacotes */}
            {showPackageOption && !editingAppointment && clientPackages.length > 0 && (
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Cliente tem pacote ativo!</h4>
                </div>

                {clientPackages.map((pkg) => {
                  const serviceUsage = formData.serviceId ? pkg.usageByService[formData.serviceId] : null
                  const canUsePackage = serviceUsage && serviceUsage.remaining > 0

                  return (
                    <div key={pkg.id} className="mb-3 p-3 bg-white rounded-md border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-purple-900">{pkg.service_packages?.name}</span>
                        <Badge className="bg-purple-600">Ativo</Badge>
                      </div>

                      {formData.serviceId && serviceUsage && (
                        <div className="text-sm space-y-1">
                          <p className="text-gray-700">
                            <strong>{serviceUsage.serviceName}:</strong> {serviceUsage.remaining} de {serviceUsage.total} disponíveis
                          </p>

                          {canUsePackage && (
                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={usePackage && selectedClientPackage?.id === pkg.id}
                                onChange={(e) => {
                                  setUsePackage(e.target.checked)
                                  setSelectedClientPackage(e.target.checked ? pkg : null)
                                }}
                                className="w-4 h-4"
                              />
                              <span className="font-medium text-purple-700">
                                ✅ Usar pacote (Não será cobrado)
                              </span>
                            </label>
                          )}

                          {!canUsePackage && (
                            <p className="text-red-600 text-xs mt-1">
                              ❌ Sem créditos disponíveis para este serviço
                            </p>
                          )}
                        </div>
                      )}

                      {!formData.serviceId && (
                        <p className="text-sm text-gray-500">Selecione um serviço para ver disponibilidade</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o agendamento..."
                className="border-2 focus:border-blue-400"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              {editingAppointment && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDelete(editingAppointment.id)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Excluir
                </Button>
              )}
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {editingAppointment ? 'Atualizar' : 'Agendar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Bloquear Horário */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              🚫 Bloquear Horário
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBlockSubmit} className="space-y-4">
            <div>
              <Label htmlFor="block-barber">Barbeiro *</Label>
              <select
                id="block-barber"
                value={blockFormData.barberId}
                onChange={(e) => setBlockFormData({ ...blockFormData, barberId: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Selecione um barbeiro</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="block-date">Data *</Label>
              <Input
                id="block-date"
                type="date"
                value={blockFormData.date}
                onChange={(e) => setBlockFormData({ ...blockFormData, date: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="block-start">Horário Início *</Label>
                <select
                  id="block-start"
                  value={blockFormData.startTime}
                  onChange={(e) => setBlockFormData({ ...blockFormData, startTime: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="block-end">Horário Fim *</Label>
                <select
                  id="block-end"
                  value={blockFormData.endTime}
                  onChange={(e) => setBlockFormData({ ...blockFormData, endTime: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="block-reason">Motivo</Label>
              <Input
                id="block-reason"
                value={blockFormData.reason}
                onChange={(e) => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                placeholder="Ex: Almoço, Reunião, etc."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBlockDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Bloquear
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
                Valor original: <span className="font-medium">R$ {parseFloat(selectedAppointment?.original_price?.toString() || selectedAppointment?.total_price?.toString() || '0').toFixed(2)}</span>
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
              {parseFloat(finalValue || '0') < parseFloat(selectedAppointment?.original_price?.toString() || selectedAppointment?.total_price?.toString() || '0') && (
                <p className="text-sm text-green-600 mt-1">
                  💰 Desconto: R$ {(parseFloat(selectedAppointment?.original_price?.toString() || selectedAppointment?.total_price?.toString() || '0') - parseFloat(finalValue || '0')).toFixed(2)}
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

export default Agenda
