import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Gift, Plus, User, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'

interface ClientPackage {
  id: string
  client_id: string
  package_id: string
  purchase_date: string
  expiry_date: string
  total_paid: number
  status: string
  client_name?: string
  package_name?: string
  package_services?: any[]
  usage_count?: number
}

const ClientPackages = () => {
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<ClientPackage | null>(null)
  const [packageUsage, setPackageUsage] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    client_id: '',
    package_id: '',
    total_paid: '',
    validity_days: '30'
  })

  const [clientSearch, setClientSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar clientes
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('name')
      
      setClients(clientsData || [])
      
      // Carregar pacotes
      const { data: packagesData } = await supabase
        .from('service_packages')
        .select(`
          *,
          package_services (
            service_id,
            quantity,
            services (name, price)
          )
        `)
        .eq('is_active', true)
        .order('name')
      
      setPackages(packagesData || [])
      
      // Carregar pacotes de clientes
      const { data: clientPackagesData } = await supabase
        .from('client_packages')
        .select(`
          *,
          clients (name),
          service_packages (
            name,
            package_services (
              service_id,
              quantity,
              services (name)
            )
          )
        `)
        .order('created_at', { ascending: false })
      
      // Contar uso de cada pacote
      const packagesWithUsage = await Promise.all(
        (clientPackagesData || []).map(async (pkg) => {
          const { count } = await supabase
            .from('package_usage')
            .select('*', { count: 'exact', head: true })
            .eq('client_package_id', pkg.id)
          
          return {
            ...pkg,
            client_name: pkg.clients?.name,
            package_name: pkg.service_packages?.name,
            package_services: pkg.service_packages?.package_services,
            usage_count: count || 0
          }
        })
      )
      
      setClientPackages(packagesWithUsage)
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const selectedPackage = packages.find(p => p.id === formData.package_id)
      if (!selectedPackage) {
        toast.error('Selecione um pacote')
        return
      }

      const purchaseDate = new Date()
      const expiryDate = addDays(purchaseDate, parseInt(formData.validity_days))

      const { error } = await supabase
        .from('client_packages')
        .insert({
          client_id: formData.client_id,
          package_id: formData.package_id,
          purchase_date: format(purchaseDate, 'yyyy-MM-dd'),
          expiry_date: format(expiryDate, 'yyyy-MM-dd'),
          total_paid: parseFloat(formData.total_paid),
          status: 'active'
        })
      
      if (error) throw error
      
      toast.success('Pacote vendido com sucesso!')
      setModalOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Erro ao vender pacote:', error)
      toast.error(`Erro ao vender pacote: ${error.message}`)
    }
  }

  const viewDetails = async (clientPackage: ClientPackage) => {
    setSelectedPackage(clientPackage)
    
    // Carregar uso do pacote
    const { data: usageData } = await supabase
      .from('package_usage')
      .select(`
        *,
        services (name),
        appointments (
          appointment_date,
          appointment_time
        )
      `)
      .eq('client_package_id', clientPackage.id)
      .order('used_at', { ascending: false })
    
    setPackageUsage(usageData || [])
    setDetailModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      client_id: '',
      package_id: '',
      total_paid: '',
      validity_days: '30'
    })
    setClientSearch('')
  }

  const getStatusBadge = (pkg: ClientPackage) => {
    const today = new Date()
    const expiry = new Date(pkg.expiry_date)
    
    if (pkg.status === 'completed') {
      return <Badge className="bg-green-600">✅ Completo</Badge>
    }
    if (pkg.status === 'expired' || expiry < today) {
      return <Badge variant="secondary">⏰ Expirado</Badge>
    }
    return <Badge className="bg-blue-600">🔵 Ativo</Badge>
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">🎁 Pacotes de Clientes</h2>
            <p className="mt-2 text-indigo-100">
              Venda e gerencie pacotes mensais dos clientes
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setModalOpen(true)
            }}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Vender Pacote
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Pacotes Ativos</p>
              <p className="text-3xl font-bold text-blue-600">
                {clientPackages.filter(p => p.status === 'active').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Pacotes Expirados</p>
              <p className="text-3xl font-bold text-orange-600">
                {clientPackages.filter(p => p.status === 'expired').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Pacotes Completos</p>
              <p className="text-3xl font-bold text-green-600">
                {clientPackages.filter(p => p.status === 'completed').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Vendido</p>
              <p className="text-3xl font-bold text-purple-600">
                R$ {clientPackages.reduce((sum, p) => sum + p.total_paid, 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pacotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientPackages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-600" />
                  <span className="text-lg">{pkg.client_name}</span>
                </div>
                {getStatusBadge(pkg)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Pacote:</p>
                <p className="font-medium">{pkg.package_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Valor Pago:</p>
                <p className="font-bold text-green-600 text-xl">
                  R$ {pkg.total_paid.toFixed(2)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Compra:</p>
                  <p className="font-medium">{format(new Date(pkg.purchase_date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Validade:</p>
                  <p className="font-medium">{format(new Date(pkg.expiry_date), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Serviços Usados:</p>
                <p className="font-bold text-blue-600">{pkg.usage_count || 0} utilizações</p>
              </div>
              
              <Button
                onClick={() => viewDetails(pkg)}
                variant="outline"
                className="w-full"
              >
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {clientPackages.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Gift className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium mb-2">Nenhum pacote vendido</h3>
              <p className="text-gray-600 mb-4">Comece vendendo pacotes para seus clientes!</p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Vender Primeiro Pacote
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Venda */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vender Pacote</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
                        setFormData({ ...formData, client_id: client.id })
                        setClientSearch(client.name)
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {client.name} - {client.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="package">Pacote *</Label>
              <select
                id="package"
                value={formData.package_id}
                onChange={(e) => {
                  const pkg = packages.find(p => p.id === e.target.value)
                  setFormData({ 
                    ...formData, 
                    package_id: e.target.value,
                    total_paid: pkg?.total_price.toString() || '',
                    validity_days: pkg?.validity_days.toString() || '30'
                  })
                }}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Selecione um pacote</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - R$ {pkg.total_price.toFixed(2)} ({pkg.validity_days} dias)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="total_paid">Valor Pago (R$) *</Label>
              <Input
                id="total_paid"
                type="number"
                step="0.01"
                value={formData.total_paid}
                onChange={(e) => setFormData({ ...formData, total_paid: e.target.value })}
                placeholder="150.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="validity_days">Validade (dias) *</Label>
              <Input
                id="validity_days"
                type="number"
                value={formData.validity_days}
                onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Vender Pacote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pacote</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente:</p>
                <p className="font-medium">{selectedPackage?.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pacote:</p>
                <p className="font-medium">{selectedPackage?.package_name}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Histórico de Uso:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {packageUsage.length > 0 ? (
                  packageUsage.map((usage, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md flex items-center justify-between">
                      <div>
                        <p className="font-medium">{usage.services?.name}</p>
                        <p className="text-xs text-gray-500">
                          {usage.appointments ? 
                            `${format(new Date(usage.appointments.appointment_date), 'dd/MM/yyyy')} às ${usage.appointments.appointment_time.substring(0, 5)}` 
                            : format(new Date(usage.used_at), 'dd/MM/yyyy HH:mm')
                          }
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Nenhum serviço utilizado ainda</p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setDetailModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClientPackages
