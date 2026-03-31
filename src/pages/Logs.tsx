import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  User,
  RefreshCw,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileDown
} from 'lucide-react'
import { auditLogService, AuditLog, AuditAction, EntityType } from '../services/auditLogService'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Logs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const [dateRange, setDateRange] = useState('today')

  useEffect(() => {
    loadLogs()
  }, [filterAction, filterEntity, dateRange])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      
      if (filterAction !== 'all') {
        filters.action = filterAction as AuditAction
      }
      
      if (filterEntity !== 'all') {
        filters.entity_type = filterEntity as EntityType
      }
      
      if (dateRange !== 'all') {
        const now = new Date()
        switch (dateRange) {
          case 'today':
            filters.start_date = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            filters.start_date = weekAgo.toISOString()
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            filters.start_date = monthAgo.toISOString()
            break
        }
      }

      const data = await auditLogService.getLogs(filters)
      setLogs(data)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      toast.error('Erro ao carregar logs')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        log.action.toLowerCase().includes(searchLower) ||
        (log.details || '').toLowerCase().includes(searchLower) ||
        log.user_name.toLowerCase().includes(searchLower) ||
        (log.user_role || '').toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('login')) return <LogIn className="h-4 w-4 text-green-600" />
    if (actionLower.includes('logout')) return <LogOut className="h-4 w-4 text-gray-600" />
    if (actionLower.includes('cri')) return <Plus className="h-4 w-4 text-blue-600" />
    if (actionLower.includes('atualiz')) return <Edit className="h-4 w-4 text-yellow-600" />
    if (actionLower.includes('exclu') || actionLower.includes('delet')) return <Trash2 className="h-4 w-4 text-red-600" />
    if (actionLower.includes('visual') || actionLower.includes('view')) return <Eye className="h-4 w-4 text-purple-600" />
    if (actionLower.includes('export')) return <FileDown className="h-4 w-4 text-indigo-600" />
    return <FileText className="h-4 w-4 text-gray-600" />
  }

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('login')) return 'bg-green-100 text-green-800 border-green-200'
    if (actionLower.includes('logout')) return 'bg-gray-100 text-gray-800 border-gray-200'
    if (actionLower.includes('cri')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (actionLower.includes('atualiz')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (actionLower.includes('exclu') || actionLower.includes('delet')) return 'bg-red-100 text-red-800 border-red-200'
    if (actionLower.includes('visual') || actionLower.includes('view')) return 'bg-purple-100 text-purple-800 border-purple-200'
    if (actionLower.includes('export')) return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getEntityColor = (entityType?: EntityType) => {
    if (!entityType) return 'bg-gray-100 text-gray-600'
    
    switch (entityType) {
      case 'client':
        return 'bg-green-100 text-green-700'
      case 'appointment':
        return 'bg-blue-100 text-blue-700'
      case 'service':
        return 'bg-orange-100 text-orange-700'
      case 'barber':
        return 'bg-purple-100 text-purple-700'
      case 'user':
        return 'bg-indigo-100 text-indigo-700'
      case 'package':
        return 'bg-pink-100 text-pink-700'
      case 'promotion':
        return 'bg-yellow-100 text-yellow-700'
      case 'settings':
        return 'bg-gray-100 text-gray-700'
      case 'report':
        return 'bg-cyan-100 text-cyan-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getActionLabel = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('login')) return 'Login'
    if (actionLower.includes('logout')) return 'Logout'
    if (actionLower.includes('cri')) return 'Criação'
    if (actionLower.includes('atualiz')) return 'Atualização'
    if (actionLower.includes('exclu') || actionLower.includes('delet')) return 'Exclusão'
    if (actionLower.includes('visual') || actionLower.includes('view')) return 'Visualização'
    if (actionLower.includes('export')) return 'Exportação'
    return action
  }

  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Email', 'Ação', 'Tipo', 'Descrição', 'ID Entidade'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        log.user_name,
        log.user_role,
        getActionLabel(log.action),
        log.entity_type || 'N/A',
        `"${(log.details || log.action).replace(/"/g, '""')}"`,
        log.entity_id || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Logs exportados com sucesso!')
    
    // Registrar a exportação
    auditLogService.logExport('Logs de Auditoria', { count: filteredLogs.length })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold">📋 Logs de Auditoria</h2>
        <p className="mt-2 text-indigo-100">
          Histórico completo de todas as ações realizadas no sistema
        </p>
      </div>

      {/* Filtros */}
      <Card className="border-l-4 border-l-indigo-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <Filter className="h-5 w-5" />
            🔍 Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Busca */}
            <div>
              <Label htmlFor="search" className="text-gray-700 font-medium">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Filtro de Ação */}
            <div>
              <Label htmlFor="action" className="text-gray-700 font-medium">Ação</Label>
              <select
                id="action"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Todas</option>
                <option value="login">🔐 Login</option>
                <option value="logout">🚪 Logout</option>
                <option value="create">➕ Criação</option>
                <option value="update">✏️ Atualização</option>
                <option value="delete">🗑️ Exclusão</option>
                <option value="view">👁️ Visualização</option>
                <option value="export">📥 Exportação</option>
              </select>
            </div>

            {/* Filtro de Entidade */}
            <div>
              <Label htmlFor="entity" className="text-gray-700 font-medium">Tipo</Label>
              <select
                id="entity"
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Todos</option>
                <option value="client">👤 Cliente</option>
                <option value="appointment">📅 Agendamento</option>
                <option value="service">✂️ Serviço</option>
                <option value="barber">💈 Barbeiro</option>
                <option value="user">👥 Usuário</option>
                <option value="package">📦 Pacote</option>
                <option value="promotion">🎁 Promoção</option>
                <option value="settings">⚙️ Configuração</option>
                <option value="report">📊 Relatório</option>
              </select>
            </div>

            {/* Período */}
            <div>
              <Label htmlFor="date" className="text-gray-700 font-medium">Período</Label>
              <select
                id="date"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-indigo-400"
              >
                <option value="today">📅 Hoje</option>
                <option value="week">📊 Esta semana</option>
                <option value="month">📈 Este mês</option>
                <option value="all">🗂️ Todos</option>
              </select>
            </div>

            {/* Botões */}
            <div className="flex items-end gap-2">
              <Button 
                onClick={loadLogs}
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                onClick={exportLogs}
                variant="outline"
                disabled={filteredLogs.length === 0}
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <FileText className="h-5 w-5" />
            📝 Registros ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
              <span className="ml-3 text-gray-600 text-lg">Carregando logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">📭 Nenhum log encontrado</p>
              <p className="text-gray-400 text-sm mt-2">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:shadow-md hover:border-indigo-300 transition-all duration-200"
                >
                  {/* Ícone */}
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(log.action)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    {/* Badges e Data */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={`${getActionColor(log.action)} border`}>
                        {getActionLabel(log.action).toUpperCase()}
                      </Badge>
                      {log.entity_type && (
                        <Badge className={getEntityColor(log.entity_type as EntityType)}>
                          {String(log.entity_type).toUpperCase()}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 font-mono">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </span>
                    </div>

                    {/* Descrição */}
                    <p className="text-sm text-gray-800 mb-2 font-medium">
                      {log.details || log.action}
                    </p>

                    {/* Info do Usuário */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="font-medium">{log.user_name}</span>
                        <span className="text-gray-400">({log.user_role})</span>
                      </div>
                      {log.entity_id && (
                        <div className="text-gray-400 font-mono">
                          ID: {log.entity_id.substring(0, 8)}...
                        </div>
                      )}
                      {log.user_agent && (
                        <div className="text-gray-400 truncate max-w-xs">
                          {log.user_agent.includes('Chrome') ? '🌐 Chrome' : 
                           log.user_agent.includes('Firefox') ? '🦊 Firefox' :
                           log.user_agent.includes('Safari') ? '🧭 Safari' : '💻 Navegador'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Logs
