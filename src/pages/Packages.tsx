import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Package, Plus, Edit, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface PackageService {
  service_id: string
  quantity: number
  service_name?: string
  service_price?: number
}

interface ServicePackage {
  id: string
  name: string
  description: string
  total_price: number
  validity_days: number
  is_active: boolean
  package_services?: PackageService[]
}

const Packages = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_price: '',
    validity_days: '30',
    package_services: [] as PackageService[]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar serviços
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      setServices(servicesData || [])
      
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
        .order('created_at', { ascending: false })
      
      const formattedPackages = packagesData?.map(pkg => ({
        ...pkg,
        package_services: pkg.package_services?.map((ps: any) => ({
          service_id: ps.service_id,
          quantity: ps.quantity,
          service_name: ps.services?.name,
          service_price: ps.services?.price
        }))
      })) || []
      
      setPackages(formattedPackages)
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.package_services.length === 0) {
      toast.error('Adicione pelo menos um serviço ao pacote')
      return
    }
    
    try {
      const packageData = {
        name: formData.name,
        description: formData.description,
        total_price: parseFloat(formData.total_price),
        validity_days: parseInt(formData.validity_days),
        is_active: true
      }

      if (editingPackage) {
        // Atualizar pacote
        const { error: updateError } = await supabase
          .from('service_packages')
          .update(packageData)
          .eq('id', editingPackage.id)
        
        if (updateError) throw updateError
        
        // Deletar serviços antigos
        await supabase
          .from('package_services')
          .delete()
          .eq('package_id', editingPackage.id)
        
        // Inserir novos serviços
        const { error: servicesError } = await supabase
          .from('package_services')
          .insert(
            formData.package_services.map(ps => ({
              package_id: editingPackage.id,
              service_id: ps.service_id,
              quantity: ps.quantity
            }))
          )
        
        if (servicesError) throw servicesError
        toast.success('Pacote atualizado!')
      } else {
        // Criar novo pacote
        const { data: newPackage, error: createError } = await supabase
          .from('service_packages')
          .insert(packageData)
          .select()
          .single()
        
        if (createError) throw createError
        
        // Inserir serviços do pacote
        const { error: servicesError } = await supabase
          .from('package_services')
          .insert(
            formData.package_services.map(ps => ({
              package_id: newPackage.id,
              service_id: ps.service_id,
              quantity: ps.quantity
            }))
          )
        
        if (servicesError) throw servicesError
        toast.success('Pacote criado!')
      }
      
      setModalOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Erro ao salvar pacote:', error)
      toast.error(`Erro ao salvar pacote: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este pacote?')) return
    
    try {
      const { error } = await supabase
        .from('service_packages')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Pacote excluído!')
      loadData()
    } catch (error) {
      toast.error('Erro ao excluir pacote')
    }
  }

  const toggleActive = async (pkg: ServicePackage) => {
    try {
      const { error } = await supabase
        .from('service_packages')
        .update({ is_active: !pkg.is_active })
        .eq('id', pkg.id)
      
      if (error) throw error
      toast.success(pkg.is_active ? 'Pacote desativado' : 'Pacote ativado')
      loadData()
    } catch (error) {
      toast.error('Erro ao atualizar pacote')
    }
  }

  const openEditDialog = (pkg: ServicePackage) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description,
      total_price: pkg.total_price.toString(),
      validity_days: pkg.validity_days.toString(),
      package_services: pkg.package_services || []
    })
    setModalOpen(true)
  }

  const resetForm = () => {
    setEditingPackage(null)
    setFormData({
      name: '',
      description: '',
      total_price: '',
      validity_days: '30',
      package_services: []
    })
  }

  const addServiceToPackage = () => {
    if (services.length === 0) return
    
    setFormData(prev => ({
      ...prev,
      package_services: [
        ...prev.package_services,
        {
          service_id: services[0].id,
          quantity: 1,
          service_name: services[0].name,
          service_price: services[0].price
        }
      ]
    }))
  }

  const updatePackageService = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      package_services: prev.package_services.map((ps, i) => {
        if (i === index) {
          if (field === 'service_id') {
            const service = services.find(s => s.id === value)
            return {
              ...ps,
              service_id: value,
              service_name: service?.name,
              service_price: service?.price
            }
          }
          return { ...ps, [field]: value }
        }
        return ps
      })
    }))
  }

  const removePackageService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      package_services: prev.package_services.filter((_, i) => i !== index)
    }))
  }

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
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">📦 Pacotes Mensais</h2>
            <p className="mt-2 text-blue-100">
              Crie pacotes de serviços para fidelizar clientes
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setModalOpen(true)
            }}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Pacote
          </Button>
        </div>
      </div>

      {/* Lista de Pacotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={`${!pkg.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="text-lg">{pkg.name}</span>
                </div>
                <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                  {pkg.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">{pkg.description}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Valor:</p>
                <p className="font-bold text-green-600 text-2xl">
                  R$ {pkg.total_price.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Válido por {pkg.validity_days} dias
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Serviços inclusos:</p>
                <div className="space-y-1">
                  {pkg.package_services?.map((ps, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>{ps.service_name}</span>
                      <Badge variant="outline">{ps.quantity}x</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(pkg)}
                  className="flex-1"
                >
                  {pkg.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(pkg)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(pkg.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {packages.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium mb-2">Nenhum pacote cadastrado</h3>
              <p className="text-gray-600 mb-4">Crie pacotes mensais para fidelizar seus clientes!</p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Pacote
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Pacote *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pacote Bronze"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do pacote"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_price">Valor Total (R$) *</Label>
                <Input
                  id="total_price"
                  type="number"
                  step="0.01"
                  value={formData.total_price}
                  onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
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
                  placeholder="30"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Serviços do Pacote *</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={addServiceToPackage}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Serviço
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.package_services.map((ps, index) => (
                  <div key={index} className="flex gap-2 items-end p-3 border rounded-md bg-gray-50">
                    <div className="flex-1">
                      <Label className="text-xs">Serviço</Label>
                      <select
                        value={ps.service_id}
                        onChange={(e) => updatePackageService(index, 'service_id', e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded-md"
                        required
                      >
                        {services.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name} - R$ {service.price.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={ps.quantity}
                        onChange={(e) => updatePackageService(index, 'quantity', parseInt(e.target.value))}
                        className="text-sm"
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removePackageService(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {formData.package_services.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum serviço adicionado. Clique em "Adicionar Serviço" acima.
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingPackage ? 'Atualizar' : 'Criar'} Pacote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Packages
