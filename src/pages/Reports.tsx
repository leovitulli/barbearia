import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Download, FileText, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { parseISO, isWithinInterval } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'

const Reports = () => {
  // Estados para dados do banco
  const [appointments, setAppointments] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [barbers, setBarbers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [, setLoading] = useState(true)
  
  // Filtros temporários (antes de aplicar)
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')
  const [tempSelectedBarber, setTempSelectedBarber] = useState('')
  const [tempSelectedService, setTempSelectedService] = useState('')
  
  // Filtros aplicados
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedBarber, setSelectedBarber] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [activeTab, setActiveTab] = useState('financial')

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Carregar appointments com relacionamentos
      const { data: aptsData } = await supabase
        .from('appointments')
        .select(`
          *,
          clients(id, name),
          barber_profiles(id, name),
          services(id, name, price)
        `)
        .order('appointment_date', { ascending: false })
      
      // Carregar serviços
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
      
      // Carregar barbeiros
      const { data: barbersData } = await supabase
        .from('barber_profiles')
        .select('*')
      
      // Carregar clientes
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
      
      setAppointments(aptsData || [])
      setServices(servicesData || [])
      setBarbers(barbersData || [])
      setClients(clientsData || [])
    } catch (error) {
      
      toast.error('Erro ao carregar dados dos relatórios')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    setStartDate(tempStartDate)
    setEndDate(tempEndDate)
    setSelectedBarber(tempSelectedBarber)
    setSelectedService(tempSelectedService)
    toast.success('Filtros aplicados!')
  }

  const clearFilters = () => {
    setTempStartDate('')
    setTempEndDate('')
    setTempSelectedBarber('')
    setTempSelectedService('')
    setStartDate('')
    setEndDate('')
    setSelectedBarber('')
    setSelectedService('')
    toast.info('Filtros limpos!')
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Date filter
      if (startDate && endDate) {
        const aptDate = parseISO(apt.appointment_date)
        const start = parseISO(startDate)
        const end = parseISO(endDate)
        if (!isWithinInterval(aptDate, { start, end })) return false
      }

      // Barber filter
      if (selectedBarber && apt.barber_id !== selectedBarber) return false

      // Service filter
      if (selectedService && apt.service_id !== selectedService) return false

      return true
    })
  }, [appointments, startDate, endDate, selectedBarber, selectedService])

  const completedAppointments = filteredAppointments.filter(
    (apt) => apt.status === 'completed'
  )

  const cancelledAppointments = filteredAppointments.filter(
    (apt) => apt.status === 'cancelled' || apt.status === 'no_show'
  )

  // Financial stats
  const totalRevenue = completedAppointments.reduce((sum, apt) => {
    return sum + (parseFloat(apt.total_price) || 0)
  }, 0)

  const revenueByBarber = barbers.map((barber) => {
    const barberAppointments = completedAppointments.filter(
      (apt) => apt.barber_id === barber.id
    )
    const revenue = barberAppointments.reduce((sum, apt) => {
      return sum + (parseFloat(apt.total_price) || 0)
    }, 0)
    return {
      barber: barber.name,
      appointments: barberAppointments.length,
      revenue,
    }
  })

  // Service stats
  const serviceStats = services.map((service) => {
    const serviceAppointments = completedAppointments.filter(
      (apt) => apt.service_id === service.id
    )
    const revenue = serviceAppointments.reduce((sum, apt) => sum + (parseFloat(apt.total_price) || 0), 0)
    return {
      service: service.name,
      count: serviceAppointments.length,
      revenue,
    }
  }).sort((a, b) => b.count - a.count) // Ordenar por mais pedidos

  // Comissão por barbeiro (baseado na commission_rate do barbeiro)
  const commissionByBarber = barbers.map((barber) => {
    const barberAppointments = completedAppointments.filter(
      (apt) => apt.barber_id === barber.id
    )
    const revenue = barberAppointments.reduce((sum, apt) => {
      return sum + (parseFloat(apt.total_price) || 0)
    }, 0)
    const commissionRate = parseFloat(barber.commission_rate) / 100 || 0.5
    const commission = revenue * commissionRate
    return {
      barber: barber.name,
      revenue,
      commission,
      appointments: barberAppointments.length,
    }
  })

  // Horários mais cheios/vazios
  const timeSlotStats = (() => {
    const slots: Record<string, number> = {}
    filteredAppointments.forEach((apt) => {
      const time = apt.appointment_time?.substring(0, 5) || '00:00'
      slots[time] = (slots[time] || 0) + 1
    })
    const sortedSlots = Object.entries(slots).sort((a, b) => b[1] - a[1])
    return {
      busiest: sortedSlots.slice(0, 5),
      slowest: sortedSlots.slice(-5).reverse(),
    }
  })()

  // Cancellation stats
  const cancellationReasons = {
    cancelled: cancelledAppointments.filter((apt) => apt.status === 'cancelled').length,
    no_show: cancelledAppointments.filter((apt) => apt.status === 'no_show').length,
  }

  const cancellationsByBarber = barbers.map((barber) => {
    const barberCancellations = cancelledAppointments.filter(
      (apt) => apt.barber_id === barber.id
    )
    return {
      barber: barber.name,
      cancelled: barberCancellations.filter((apt) => apt.status === 'cancelled').length,
      no_show: barberCancellations.filter((apt) => apt.status === 'no_show').length,
      total: barberCancellations.length,
    }
  })

  const exportToCSV = () => {
    let data: any[] = []
    let filename = ''

    if (activeTab === 'financial') {
      data = revenueByBarber.map((item) => ({
        Barbeiro: item.barber,
        Atendimentos: item.appointments,
        Faturamento: `R$ ${item.revenue.toFixed(2)}`,
      }))
      filename = 'relatorio-financeiro.csv'
    } else if (activeTab === 'services') {
      data = serviceStats.map((item) => ({
        Serviço: item.service,
        Quantidade: item.count,
        Faturamento: `R$ ${item.revenue.toFixed(2)}`,
      }))
      filename = 'relatorio-servicos.csv'
    } else if (activeTab === 'cancellations') {
      data = cancelledAppointments.map((apt) => {
        const client = clients.find((c) => c.id === apt.clientId)
        const barber = barbers.find((b) => b.id === apt.barberId)
        const service = services.find((s) => s.id === apt.serviceId)
        return {
          Data: apt.date,
          Horário: apt.time,
          Cliente: client?.name,
          Barbeiro: barber?.name,
          Serviço: service?.name,
          Status: apt.status === 'cancelled' ? 'Cancelado' : 'Não compareceu',
        }
      })
      filename = 'relatorio-cancelamentos.csv'
    }

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    toast.success('Relatório exportado em CSV!')
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('San Patricio - Relatório', 14, 20)

    if (activeTab === 'financial') {
      doc.setFontSize(14)
      doc.text('Relatório Financeiro', 14, 30)
      doc.setFontSize(10)
      doc.text(`Faturamento Total: R$ ${totalRevenue.toFixed(2)}`, 14, 40)

      autoTable(doc, {
        startY: 50,
        head: [['Barbeiro', 'Atendimentos', 'Faturamento']],
        body: revenueByBarber.map((item) => [
          item.barber,
          item.appointments,
          `R$ ${item.revenue.toFixed(2)}`,
        ]),
      })
    } else if (activeTab === 'services') {
      doc.setFontSize(14)
      doc.text('Relatório de Serviços', 14, 30)

      autoTable(doc, {
        startY: 40,
        head: [['Serviço', 'Quantidade', 'Faturamento']],
        body: serviceStats.map((item) => [
          item.service,
          item.count,
          `R$ ${item.revenue.toFixed(2)}`,
        ]),
      })
    } else if (activeTab === 'cancellations') {
      doc.setFontSize(14)
      doc.text('Relatório de Cancelamentos', 14, 30)

      autoTable(doc, {
        startY: 40,
        head: [['Data', 'Horário', 'Cliente', 'Barbeiro', 'Status']],
        body: cancelledAppointments.map((apt) => {
          const client = clients.find((c) => c.id === apt.clientId)
          const barber = barbers.find((b) => b.id === apt.barberId)
          return [
            apt.date,
            apt.time,
            client?.name || '',
            barber?.name || '',
            apt.status === 'cancelled' ? 'Cancelado' : 'Não compareceu',
          ]
        }),
      })
    }

    doc.save(`relatorio-${activeTab}.pdf`)
    toast.success('Relatório exportado em PDF!')
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente colorido */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold">📊 Relatórios</h2>
        <p className="mt-2 text-indigo-100">
          Análises e estatísticas detalhadas da barbearia
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="barber">Barbeiro</Label>
                <Select
                  id="barber"
                  value={tempSelectedBarber}
                  onChange={(e) => setTempSelectedBarber(e.target.value)}
                >
                  <option value="">Todos</option>
                  {barbers.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="service">Serviço</Label>
                <Select
                  id="service"
                  value={tempSelectedService}
                  onChange={(e) => setTempSelectedService(e.target.value)}
                >
                  <option value="">Todos</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="flex space-x-2">
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
        <Button variant="outline" onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="commission">Comissões</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="schedule">Horários</TabsTrigger>
          <TabsTrigger value="created">Agendamentos Criados</TabsTrigger>
          <TabsTrigger value="cancellations">Cancelamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Faturamento Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Atendimentos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {completedAppointments.length}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Ticket Médio</p>
                    <p className="text-2xl font-bold text-purple-600">
                      R${' '}
                      {completedAppointments.length > 0
                        ? (totalRevenue / completedAppointments.length).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards Individuais por Barbeiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {revenueByBarber.map((item, index) => {
                const barber = barbers.find(b => b.name === item.barber)
                const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
                const avgPerService = item.appointments > 0 ? item.revenue / item.appointments : 0
                
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        {barber?.avatar && (
                          <img
                            src={barber.avatar}
                            alt={item.barber}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.barber}</CardTitle>
                          <p className="text-xs text-gray-500">
                            {percentage.toFixed(1)}% do total
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Faturamento</span>
                        <span className="text-lg font-bold text-green-600">
                          R$ {item.revenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Atendimentos</span>
                        <span className="text-lg font-semibold text-blue-600">
                          {item.appointments}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Ticket Médio</span>
                        <span className="text-sm font-medium text-purple-600">
                          R$ {avgPerService.toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tabela Comparativa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Barbeiro</th>
                        <th className="text-right py-3 px-4">Atendimentos</th>
                        <th className="text-right py-3 px-4">Faturamento</th>
                        <th className="text-right py-3 px-4">Ticket Médio</th>
                        <th className="text-right py-3 px-4">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByBarber.map((item, index) => {
                        const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
                        const avgPerService = item.appointments > 0 ? item.revenue / item.appointments : 0
                        
                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{item.barber}</td>
                            <td className="text-right py-3 px-4">{item.appointments}</td>
                            <td className="text-right py-3 px-4 font-semibold text-green-600">
                              R$ {item.revenue.toFixed(2)}
                            </td>
                            <td className="text-right py-3 px-4 text-purple-600">
                              R$ {avgPerService.toFixed(2)}
                            </td>
                            <td className="text-right py-3 px-4 text-blue-600">
                              {percentage.toFixed(1)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold bg-gray-50">
                        <td className="py-3 px-4">TOTAL</td>
                        <td className="text-right py-3 px-4">{completedAppointments.length}</td>
                        <td className="text-right py-3 px-4 text-green-600">
                          R$ {totalRevenue.toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-purple-600">
                          R$ {(totalRevenue / completedAppointments.length || 0).toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-blue-600">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Serviço</th>
                      <th className="text-right py-3 px-4">Quantidade</th>
                      <th className="text-right py-3 px-4">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceStats.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{item.service}</td>
                        <td className="text-right py-3 px-4">{item.count}</td>
                        <td className="text-right py-3 px-4 font-semibold text-green-600">
                          R$ {item.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Comissões por Barbeiro (30%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Barbeiro</th>
                      <th className="text-right py-3 px-4">Atendimentos</th>
                      <th className="text-right py-3 px-4">Faturamento Total</th>
                      <th className="text-right py-3 px-4">Comissão (30%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionByBarber.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.barber}</td>
                        <td className="text-right py-3 px-4">{item.appointments}</td>
                        <td className="text-right py-3 px-4 text-gray-600">
                          R$ {item.revenue.toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 font-bold text-green-600">
                          R$ {item.commission.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold bg-gray-50">
                      <td className="py-3 px-4">TOTAL</td>
                      <td className="text-right py-3 px-4">
                        {commissionByBarber.reduce((sum, item) => sum + item.appointments, 0)}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        R$ {commissionByBarber.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4 text-green-600">
                        R$ {commissionByBarber.reduce((sum, item) => sum + item.commission, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">🔥 Horários Mais Cheios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {timeSlotStats.busiest.map(([time, count], index) => (
                      <div key={time} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-green-600">#{index + 1}</span>
                          <span className="font-medium">{time}</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">{count} agendamentos</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">💤 Horários Mais Vazios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {timeSlotStats.slowest.map(([time, count], index) => (
                      <div key={time} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
                          <span className="font-medium">{time}</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">{count} agendamentos</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="created">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📅 Agendamentos Criados por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Mostra quantos agendamentos foram <strong>criados</strong> em cada dia (métrica de vendas)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Data de Criação</th>
                        <th className="text-right py-3 px-4">Agendamentos Criados</th>
                        <th className="text-right py-3 px-4">Faturamento Previsto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Agrupar por data de criação
                        const groupedByCreated: Record<string, { count: number; revenue: number }> = {}
                        
                        filteredAppointments.forEach((apt) => {
                          const createdDate = apt.created_at?.split('T')[0] || 'Sem data'
                          if (!groupedByCreated[createdDate]) {
                            groupedByCreated[createdDate] = { count: 0, revenue: 0 }
                          }
                          groupedByCreated[createdDate].count++
                          groupedByCreated[createdDate].revenue += parseFloat(apt.total_price) || 0
                        })
                        
                        const sortedDates = Object.entries(groupedByCreated).sort((a, b) => b[0].localeCompare(a[0]))
                        
                        return sortedDates.map(([date, data]) => (
                          <tr key={date} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">
                              {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="text-right py-3 px-4 text-blue-600 font-semibold">
                              {data.count} agendamentos
                            </td>
                            <td className="text-right py-3 px-4 text-green-600 font-bold">
                              R$ {data.revenue.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold bg-gray-50">
                        <td className="py-3 px-4">TOTAL</td>
                        <td className="text-right py-3 px-4 text-blue-600">
                          {filteredAppointments.length} agendamentos
                        </td>
                        <td className="text-right py-3 px-4 text-green-600">
                          R$ {filteredAppointments.reduce((sum, apt) => sum + (parseFloat(apt.total_price) || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📊 Comparação: Criados vs Para Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Agendamentos CRIADOS Hoje</p>
                    <p className="text-4xl font-bold text-blue-600">
                      {(() => {
                        const today = new Date().toISOString().split('T')[0]
                        return filteredAppointments.filter(apt => 
                          apt.created_at?.split('T')[0] === today
                        ).length
                      })()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Vendas realizadas hoje</p>
                  </div>
                  
                  <div className="p-6 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Agendamentos PARA Hoje</p>
                    <p className="text-4xl font-bold text-green-600">
                      {(() => {
                        const today = new Date().toISOString().split('T')[0]
                        return filteredAppointments.filter(apt => 
                          apt.appointment_date === today && (apt.status === 'scheduled' || apt.status === 'confirmed')
                        ).length
                      })()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Clientes que vêm hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cancellations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Cancelamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total de Cancelamentos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {cancelledAppointments.length}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Cancelados</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {cancellationReasons.cancelled}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Não Compareceram</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {cancellationReasons.no_show}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cancelamentos por Barbeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Barbeiro</th>
                        <th className="text-right py-3 px-4">Cancelados</th>
                        <th className="text-right py-3 px-4">Não Compareceu</th>
                        <th className="text-right py-3 px-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancellationsByBarber.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{item.barber}</td>
                          <td className="text-right py-3 px-4 text-red-600">{item.cancelled}</td>
                          <td className="text-right py-3 px-4 text-yellow-600">{item.no_show}</td>
                          <td className="text-right py-3 px-4 font-bold">{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes dos Cancelamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Data</th>
                        <th className="text-left py-3 px-4">Horário</th>
                        <th className="text-left py-3 px-4">Cliente</th>
                        <th className="text-left py-3 px-4">Barbeiro</th>
                        <th className="text-left py-3 px-4">Serviço</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledAppointments.map((apt) => {
                        const client = clients.find((c) => c.id === apt.clientId)
                        const barber = barbers.find((b) => b.id === apt.barberId)
                        const service = services.find((s) => s.id === apt.serviceId)

                        return (
                          <tr key={apt.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{apt.date}</td>
                            <td className="py-3 px-4">{apt.time}</td>
                            <td className="py-3 px-4">{client?.name}</td>
                            <td className="py-3 px-4">{barber?.name}</td>
                            <td className="py-3 px-4">{service?.name}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  apt.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {apt.status === 'cancelled'
                                  ? 'Cancelado'
                                  : 'Não compareceu'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Reports
