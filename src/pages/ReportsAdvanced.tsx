import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { 
  Download, 
  FileText, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Table as TableIcon
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
// import { ptBR } from 'date-fns/locale'
import { auditLog } from '../services/auditLog'

const ReportsAdvanced = () => {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  
  // Configuração do relatório
  const [reportConfig, setReportConfig] = useState({
    type: 'financial', // financial, services, barbers, clients, custom
    period: 'month', // day, week, month, year, custom
    dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dateTo: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    groupBy: 'day', // day, week, month, service, barber, client
    metrics: ['revenue', 'appointments', 'average_ticket'], // métricas a incluir
    filters: {
      barberId: '',
      serviceId: '',
      status: 'completed',
      minValue: '',
      maxValue: ''
    }
  })

  // Listas para filtros
  const [barbers, setBarbers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  useEffect(() => {
    loadFilters()
  }, [])

  const loadFilters = async () => {
    const [barbersData, servicesData] = await Promise.all([
      supabase.from('barber_profiles').select('id, name').eq('is_active', true),
      supabase.from('services').select('id, name').eq('is_active', true)
    ])

    setBarbers(barbersData.data || [])
    setServices(servicesData.data || [])
  }

  const generateReport = async () => {
    try {
      setLoading(true)

      // Query base
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clients (id, name, phone),
          barber_profiles (id, name),
          services (id, name, price)
        `)
        .gte('appointment_date', reportConfig.dateFrom)
        .lte('appointment_date', reportConfig.dateTo)

      // Aplicar filtros
      if (reportConfig.filters.barberId) {
        query = query.eq('barber_id', reportConfig.filters.barberId)
      }

      if (reportConfig.filters.serviceId) {
        query = query.eq('service_id', reportConfig.filters.serviceId)
      }

      if (reportConfig.filters.status) {
        query = query.eq('status', reportConfig.filters.status)
      }

      const { data: appointments, error } = await query

      if (error) throw error

      // Processar dados
      const processed = processReportData(appointments || [])
      setReportData(processed)

      // Registrar log
      auditLog.exportReport(reportConfig.type, reportConfig)

      toast.success('Relatório gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (appointments: any[]) => {
    const data: any = {
      summary: {
        totalAppointments: appointments.length,
        totalRevenue: appointments.reduce((sum, apt) => sum + (parseFloat(apt.total_price) || 0), 0),
        averageTicket: 0,
        totalDiscount: appointments.reduce((sum, apt) => sum + (parseFloat(apt.discount_amount) || 0), 0)
      },
      byService: {},
      byBarber: {},
      byDay: {},
      byClient: {},
      details: appointments
    }

    data.summary.averageTicket = data.summary.totalAppointments > 0 
      ? data.summary.totalRevenue / data.summary.totalAppointments 
      : 0

    // Agrupar por serviço
    appointments.forEach(apt => {
      const serviceName = apt.services?.name || 'Sem serviço'
      if (!data.byService[serviceName]) {
        data.byService[serviceName] = {
          count: 0,
          revenue: 0,
          avgPrice: 0
        }
      }
      data.byService[serviceName].count++
      data.byService[serviceName].revenue += parseFloat(apt.total_price) || 0
    })

    // Calcular média de preço por serviço
    Object.keys(data.byService).forEach(service => {
      data.byService[service].avgPrice = 
        data.byService[service].revenue / data.byService[service].count
    })

    // Agrupar por barbeiro
    appointments.forEach(apt => {
      const barberName = apt.barber_profiles?.name || 'Sem barbeiro'
      if (!data.byBarber[barberName]) {
        data.byBarber[barberName] = {
          count: 0,
          revenue: 0,
          avgTicket: 0
        }
      }
      data.byBarber[barberName].count++
      data.byBarber[barberName].revenue += parseFloat(apt.total_price) || 0
    })

    // Calcular ticket médio por barbeiro
    Object.keys(data.byBarber).forEach(barber => {
      data.byBarber[barber].avgTicket = 
        data.byBarber[barber].revenue / data.byBarber[barber].count
    })

    // Agrupar por dia
    appointments.forEach(apt => {
      const day = apt.appointment_date
      if (!data.byDay[day]) {
        data.byDay[day] = {
          count: 0,
          revenue: 0
        }
      }
      data.byDay[day].count++
      data.byDay[day].revenue += parseFloat(apt.total_price) || 0
    })

    // Agrupar por cliente
    appointments.forEach(apt => {
      const clientName = apt.clients?.name || 'Sem cliente'
      if (!data.byClient[clientName]) {
        data.byClient[clientName] = {
          count: 0,
          revenue: 0,
          phone: apt.clients?.phone
        }
      }
      data.byClient[clientName].count++
      data.byClient[clientName].revenue += parseFloat(apt.total_price) || 0
    })

    return data
  }

  const exportToCSV = () => {
    if (!reportData) {
      toast.error('Gere um relatório primeiro')
      return
    }

    const rows: string[][] = []

    // Cabeçalho
    rows.push(['RELATÓRIO DE FATURAMENTO'])
    rows.push([`Período: ${format(new Date(reportConfig.dateFrom), 'dd/MM/yyyy')} a ${format(new Date(reportConfig.dateTo), 'dd/MM/yyyy')}`])
    rows.push([])

    // Resumo
    rows.push(['RESUMO'])
    rows.push(['Total de Agendamentos', reportData.summary.totalAppointments.toString()])
    rows.push(['Faturamento Total', `R$ ${reportData.summary.totalRevenue.toFixed(2)}`])
    rows.push(['Ticket Médio', `R$ ${reportData.summary.averageTicket.toFixed(2)}`])
    rows.push(['Total de Descontos', `R$ ${reportData.summary.totalDiscount.toFixed(2)}`])
    rows.push([])

    // Por Serviço
    rows.push(['POR SERVIÇO'])
    rows.push(['Serviço', 'Quantidade', 'Faturamento', 'Preço Médio'])
    Object.entries(reportData.byService).forEach(([service, data]: [string, any]) => {
      rows.push([
        service,
        data.count.toString(),
        `R$ ${data.revenue.toFixed(2)}`,
        `R$ ${data.avgPrice.toFixed(2)}`
      ])
    })
    rows.push([])

    // Por Barbeiro
    rows.push(['POR BARBEIRO'])
    rows.push(['Barbeiro', 'Atendimentos', 'Faturamento', 'Ticket Médio'])
    Object.entries(reportData.byBarber).forEach(([barber, data]: [string, any]) => {
      rows.push([
        barber,
        data.count.toString(),
        `R$ ${data.revenue.toFixed(2)}`,
        `R$ ${data.avgTicket.toFixed(2)}`
      ])
    })

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
    link.click()

    toast.success('Relatório exportado!')
  }

  const exportToPDF = () => {
    if (!reportData) {
      toast.error('Gere um relatório primeiro')
      return
    }

    toast.info('Funcionalidade de PDF em desenvolvimento')
  }

  const setPeriod = (period: string) => {
    const today = new Date()
    let dateFrom = ''
    let dateTo = ''

    switch (period) {
      case 'today':
        dateFrom = format(today, 'yyyy-MM-dd')
        dateTo = format(today, 'yyyy-MM-dd')
        break
      case 'week':
        dateFrom = format(new Date(today.setDate(today.getDate() - 7)), 'yyyy-MM-dd')
        dateTo = format(new Date(), 'yyyy-MM-dd')
        break
      case 'month':
        dateFrom = format(startOfMonth(new Date()), 'yyyy-MM-dd')
        dateTo = format(endOfMonth(new Date()), 'yyyy-MM-dd')
        break
      case 'year':
        dateFrom = format(startOfYear(new Date()), 'yyyy-MM-dd')
        dateTo = format(endOfYear(new Date()), 'yyyy-MM-dd')
        break
    }

    setReportConfig({ ...reportConfig, period, dateFrom, dateTo })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          📊 Relatórios Dinâmicos
        </h2>
        <p className="mt-2 text-blue-100">
          Crie relatórios personalizados com filtros avançados
        </p>
      </div>

      {/* Configuração do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Configurar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de Relatório */}
          <div>
            <Label>Tipo de Relatório</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
              <Button
                variant={reportConfig.type === 'financial' ? 'default' : 'outline'}
                onClick={() => setReportConfig({ ...reportConfig, type: 'financial' })}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <DollarSign className="h-6 w-6" />
                <span className="text-xs">Financeiro</span>
              </Button>
              <Button
                variant={reportConfig.type === 'services' ? 'default' : 'outline'}
                onClick={() => setReportConfig({ ...reportConfig, type: 'services' })}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <PieChart className="h-6 w-6" />
                <span className="text-xs">Serviços</span>
              </Button>
              <Button
                variant={reportConfig.type === 'barbers' ? 'default' : 'outline'}
                onClick={() => setReportConfig({ ...reportConfig, type: 'barbers' })}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Users className="h-6 w-6" />
                <span className="text-xs">Barbeiros</span>
              </Button>
              <Button
                variant={reportConfig.type === 'clients' ? 'default' : 'outline'}
                onClick={() => setReportConfig({ ...reportConfig, type: 'clients' })}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Users className="h-6 w-6" />
                <span className="text-xs">Clientes</span>
              </Button>
              <Button
                variant={reportConfig.type === 'custom' ? 'default' : 'outline'}
                onClick={() => setReportConfig({ ...reportConfig, type: 'custom' })}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <TableIcon className="h-6 w-6" />
                <span className="text-xs">Personalizado</span>
              </Button>
            </div>
          </div>

          {/* Período */}
          <div>
            <Label>Período</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setPeriod('today')}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                onClick={() => setPeriod('week')}
              >
                Última Semana
              </Button>
              <Button
                variant="outline"
                onClick={() => setPeriod('month')}
              >
                Este Mês
              </Button>
              <Button
                variant="outline"
                onClick={() => setPeriod('year')}
              >
                Este Ano
              </Button>
            </div>
          </div>

          {/* Datas Personalizadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom">Data Inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={reportConfig.dateFrom}
                onChange={(e) => setReportConfig({ ...reportConfig, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Data Final</Label>
              <Input
                id="dateTo"
                type="date"
                value={reportConfig.dateTo}
                onChange={(e) => setReportConfig({ ...reportConfig, dateTo: e.target.value })}
              />
            </div>
          </div>

          {/* Filtros Avançados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="barberId">Barbeiro</Label>
              <Select
                id="barberId"
                value={reportConfig.filters.barberId}
                onChange={(e) => setReportConfig({
                  ...reportConfig,
                  filters: { ...reportConfig.filters, barberId: e.target.value }
                })}
              >
                <option value="">Todos os barbeiros</option>
                {barbers.map(barber => (
                  <option key={barber.id} value={barber.id}>{barber.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="serviceId">Serviço</Label>
              <Select
                id="serviceId"
                value={reportConfig.filters.serviceId}
                onChange={(e) => setReportConfig({
                  ...reportConfig,
                  filters: { ...reportConfig.filters, serviceId: e.target.value }
                })}
              >
                <option value="">Todos os serviços</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={reportConfig.filters.status}
                onChange={(e) => setReportConfig({
                  ...reportConfig,
                  filters: { ...reportConfig.filters, status: e.target.value }
                })}
              >
                <option value="">Todos os status</option>
                <option value="completed">Completados</option>
                <option value="scheduled">Agendados</option>
                <option value="cancelled">Cancelados</option>
              </Select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button
              onClick={generateReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
            {reportData && (
              <>
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={exportToPDF} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {reportData && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{reportData.summary.totalAppointments}</div>
                  <div className="text-sm text-gray-600">Agendamentos</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">R$ {reportData.summary.totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Faturamento Total</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">R$ {reportData.summary.averageTicket.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Ticket Médio</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold">R$ {reportData.summary.totalDiscount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Descontos</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabelas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Por Serviço */}
            <Card>
              <CardHeader>
                <CardTitle>Por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reportData.byService).map(([service, data]: [string, any]) => (
                    <div key={service} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{service}</div>
                        <div className="text-sm text-gray-600">{data.count} agendamentos</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">R$ {data.revenue.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Média: R$ {data.avgPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Por Barbeiro */}
            <Card>
              <CardHeader>
                <CardTitle>Por Barbeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reportData.byBarber).map(([barber, data]: [string, any]) => (
                    <div key={barber} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{barber}</div>
                        <div className="text-sm text-gray-600">{data.count} atendimentos</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">R$ {data.revenue.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Ticket: R$ {data.avgTicket.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default ReportsAdvanced
