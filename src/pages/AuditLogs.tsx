import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Shield, Search, Download, Filter, Calendar, User, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredLogs, setFilteredLogs] = useState<any[]>([])
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
    userEmail: ''
  })

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, filters])

  const loadLogs = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('audit_logs_formatted')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      setLogs(data || [])
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      toast.error('Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    // Filtro de busca
    if (filters.search) {
      filtered = filtered.filter(log =>
        log.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Filtro de ação
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action)
    }

    // Filtro de tipo de entidade
    if (filters.entityType) {
      filtered = filtered.filter(log => log.entity_type === filters.entityType)
    }

    // Filtro de data
    if (filters.dateFrom) {
      filtered = filtered.filter(log => 
        new Date(log.created_at) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => 
        new Date(log.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      )
    }

    // Filtro de usuário
    if (filters.userEmail) {
      filtered = filtered.filter(log => 
        log.user_email?.toLowerCase().includes(filters.userEmail.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }

  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'Descrição']
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
      log.user_email || 'Sistema',
      log.action_formatted,
      log.entity_type_formatted,
      log.description
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
    link.click()

    toast.success('Logs exportados com sucesso!')
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      entityType: '',
      dateFrom: '',
      dateTo: '',
      userEmail: ''
    })
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      STATUS_CHANGE: 'bg-yellow-100 text-yellow-800',
      PAYMENT: 'bg-emerald-100 text-emerald-800',
      EXPORT: 'bg-indigo-100 text-indigo-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando logs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              🔐 Logs de Auditoria
            </h2>
            <p className="mt-2 text-red-100">
              Registro completo de todas as ações do sistema
            </p>
          </div>
          <Button
            onClick={exportToCSV}
            className="bg-white text-red-600 hover:bg-red-50 font-medium px-6 py-3"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Buscar em descrição, usuário..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="action">Ação</Label>
              <Select
                id="action"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              >
                <option value="">Todas as ações</option>
                <option value="CREATE">➕ Criou</option>
                <option value="UPDATE">✏️ Editou</option>
                <option value="DELETE">🗑️ Deletou</option>
                <option value="STATUS_CHANGE">🔄 Mudou Status</option>
                <option value="PAYMENT">💰 Pagamento</option>
                <option value="LOGIN">🔐 Login</option>
                <option value="LOGOUT">🚪 Logout</option>
                <option value="EXPORT">📊 Exportação</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="entityType">Tipo de Entidade</Label>
              <Select
                id="entityType"
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              >
                <option value="">Todas as entidades</option>
                <option value="appointments">Agendamentos</option>
                <option value="clients">Clientes</option>
                <option value="services">Serviços</option>
                <option value="barber_profiles">Barbeiros</option>
                <option value="client_packages">Pacotes</option>
                <option value="service_promotions">Promoções</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Data Inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Data Final</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="userEmail">Usuário</Label>
              <Input
                id="userEmail"
                value={filters.userEmail}
                onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
                placeholder="Email do usuário"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={applyFilters} className="bg-blue-600">
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button onClick={clearFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{filteredLogs.length}</div>
              <div className="text-sm text-gray-600">Total de Logs</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">
                {new Set(filteredLogs.map(l => l.user_email)).size}
              </div>
              <div className="text-sm text-gray-600">Usuários Ativos</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">
                {filteredLogs.filter(l => {
                  const logDate = new Date(l.created_at)
                  const today = new Date()
                  return logDate.toDateString() === today.toDateString()
                }).length}
              </div>
              <div className="text-sm text-gray-600">Ações Hoje</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold">
                {filteredLogs.filter(l => l.action === 'DELETE').length}
              </div>
              <div className="text-sm text-gray-600">Exclusões</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ações ({filteredLogs.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action_formatted}
                      </span>
                      <span className="text-sm text-gray-600">
                        {log.entity_type_formatted}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{log.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user_email || 'Sistema'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </span>
                      {log.ip_address && log.ip_address !== 'unknown' && (
                        <span className="text-xs">IP: {log.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos (opcional) */}
                {(log.old_values || log.new_values) && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      Ver detalhes
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                      {log.old_values && (
                        <div className="mb-2">
                          <strong>Valores Anteriores:</strong>
                          <pre className="mt-1 overflow-x-auto">{JSON.stringify(log.old_values, null, 2)}</pre>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <strong>Valores Novos:</strong>
                          <pre className="mt-1 overflow-x-auto">{JSON.stringify(log.new_values, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log encontrado com os filtros aplicados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditLogs
