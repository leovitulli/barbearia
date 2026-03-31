import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { Plus, Edit, Trash2, DollarSign, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { auditLogService } from '../services/auditLogService'

const Services = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
  })

  useEffect(() => {
    loadServices()
  }, [])

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialogOpen) {
        setDialogOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [dialogOpen])

  const loadServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setServices(data || [])
    } catch (error) {
      
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (service?: any) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        price: service.price.toString(),
        duration: service.duration.toString(),
      })
    } else {
      setEditingService(null)
      setFormData({ name: '', price: '', duration: '' })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const serviceData = {
      name: formData.name,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)
        
        if (error) throw error
        
        await auditLogService.logUpdate('service', editingService.id, formData.name, {
          price: serviceData.price,
          duration: serviceData.duration
        })
        
        toast.success('Serviço atualizado com sucesso!')
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert([serviceData])
          .select()
        
        if (error) throw error
        
        if (data && data[0]) {
          await auditLogService.logCreate('service', data[0].id, formData.name, {
            price: serviceData.price,
            duration: serviceData.duration
          })
        }
        
        toast.success('Serviço cadastrado com sucesso!')
      }

      setDialogOpen(false)
      setFormData({ name: '', price: '', duration: '' })
      loadServices()
    } catch (error) {
      
      toast.error('Erro ao salvar serviço')
    }
  }

  const handleDelete = async (id: string) => {
    const serviceToDelete = services.find(s => s.id === id)
    const serviceName = serviceToDelete?.name || 'Serviço'
    
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        await auditLogService.logDelete('service', id, serviceName)
        
        toast.success('Serviço excluído com sucesso!')
        loadServices()
      } catch (error) {
        
        toast.error('Erro ao excluir serviço')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente colorido */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">✂️ Serviços</h2>
            <p className="mt-2 text-orange-100">
              Gerencie os serviços oferecidos pela barbearia
            </p>
          </div>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-white text-orange-600 hover:bg-orange-50 font-medium px-4 py-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            ➕ Novo Serviço
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <CardTitle className="text-lg">{service.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-lg font-semibold text-green-600">
                <DollarSign className="h-5 w-5 mr-1" />
                R$ {(service.price || 0).toFixed(2)}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {service.duration} minutos
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(service)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(service.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Duração (minutos) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingService ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Services
