import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface Promotion {
  id: string
  service_id: string
  name: string
  type: 'weekday' | 'time'
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  weekdays?: number[]
  start_time?: string
  end_time?: string
  is_active: boolean
  service_name?: string
}

const Promotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  
  const [formData, setFormData] = useState({
    service_id: '',
    name: '',
    type: 'weekday' as 'weekday' | 'time',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    weekdays: [] as number[],
    start_time: '09:00',
    end_time: '12:00'
  })

  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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
      
      // Carregar promoções
      const { data: promotionsData } = await supabase
        .from('service_promotions')
        .select(`
          *,
          services (name)
        `)
        .order('created_at', { ascending: false })
      
      const formattedPromotions = promotionsData?.map(p => ({
        ...p,
        service_name: p.services?.name
      })) || []
      
      setPromotions(formattedPromotions)
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const promotionData = {
        service_id: formData.service_id,
        name: formData.name,
        type: formData.type,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        weekdays: formData.type === 'weekday' ? formData.weekdays : null,
        start_time: formData.type === 'time' ? formData.start_time : null,
        end_time: formData.type === 'time' ? formData.end_time : null,
        is_active: true
      }

      if (editingPromotion) {
        const { error } = await supabase
          .from('service_promotions')
          .update(promotionData)
          .eq('id', editingPromotion.id)
        
        if (error) throw error
        toast.success('Promoção atualizada!')
      } else {
        const { error } = await supabase
          .from('service_promotions')
          .insert(promotionData)
        
        if (error) throw error
        toast.success('Promoção criada!')
      }
      
      setModalOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Erro ao salvar promoção:', error)
      toast.error(`Erro ao salvar promoção: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta promoção?')) return
    
    try {
      const { error } = await supabase
        .from('service_promotions')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Promoção excluída!')
      loadData()
    } catch (error) {
      toast.error('Erro ao excluir promoção')
    }
  }

  const toggleActive = async (promotion: Promotion) => {
    try {
      const { error } = await supabase
        .from('service_promotions')
        .update({ is_active: !promotion.is_active })
        .eq('id', promotion.id)
      
      if (error) throw error
      toast.success(promotion.is_active ? 'Promoção desativada' : 'Promoção ativada')
      loadData()
    } catch (error) {
      toast.error('Erro ao atualizar promoção')
    }
  }

  const openEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      service_id: promotion.service_id,
      name: promotion.name,
      type: promotion.type,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value.toString(),
      weekdays: promotion.weekdays || [],
      start_time: promotion.start_time || '09:00',
      end_time: promotion.end_time || '12:00'
    })
    setModalOpen(true)
  }

  const resetForm = () => {
    setEditingPromotion(null)
    setFormData({
      service_id: '',
      name: '',
      type: 'weekday',
      discount_type: 'percentage',
      discount_value: '',
      weekdays: [],
      start_time: '09:00',
      end_time: '12:00'
    })
  }

  const toggleWeekday = (day: number) => {
    setFormData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day].sort()
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
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">🎉 Promoções</h2>
            <p className="mt-2 text-purple-100">
              Gerencie promoções por dia da semana ou horário
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setModalOpen(true)
            }}
            className="bg-white text-purple-600 hover:bg-purple-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Promoção
          </Button>
        </div>
      </div>

      {/* Lista de Promoções */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promotion) => (
          <Card key={promotion.id} className={`${!promotion.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-purple-600" />
                  <span className="text-lg">{promotion.name}</span>
                </div>
                <Badge variant={promotion.is_active ? 'default' : 'secondary'}>
                  {promotion.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Serviço:</p>
                <p className="font-medium">{promotion.service_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Desconto:</p>
                <p className="font-bold text-green-600 text-xl">
                  {promotion.discount_type === 'percentage' 
                    ? `${promotion.discount_value}%` 
                    : `R$ ${promotion.discount_value.toFixed(2)}`
                  }
                </p>
              </div>
              
              {promotion.type === 'weekday' && promotion.weekdays && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Dias da semana:</p>
                  <div className="flex flex-wrap gap-1">
                    {promotion.weekdays.map(day => (
                      <Badge key={day} variant="outline">
                        {weekdayNames[day]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {promotion.type === 'time' && (
                <div>
                  <p className="text-sm text-gray-600">Horário:</p>
                  <p className="font-medium">
                    {promotion.start_time?.substring(0, 5)} - {promotion.end_time?.substring(0, 5)}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(promotion)}
                  className="flex-1"
                >
                  {promotion.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(promotion)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(promotion.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {promotions.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Tag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium mb-2">Nenhuma promoção cadastrada</h3>
              <p className="text-gray-600 mb-4">Crie sua primeira promoção para atrair mais clientes!</p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Promoção
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Promoção *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Segunda Feliz"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="service">Serviço *</Label>
              <select
                id="service"
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Selecione um serviço</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - R$ {service.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="type">Tipo de Promoção *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'weekday' | 'time' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="weekday">Por Dia da Semana</option>
                <option value="time">Por Horário</option>
              </select>
            </div>
            
            {formData.type === 'weekday' && (
              <div>
                <Label>Dias da Semana *</Label>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {weekdayNames.map((name, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleWeekday(index)}
                      className={`px-2 py-2 text-sm rounded-md border-2 transition-colors ${
                        formData.weekdays.includes(index)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {formData.type === 'time' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Horário Início *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">Horário Fim *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="discount_type">Tipo de Desconto *</Label>
              <select
                id="discount_type"
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="discount_value">
                Valor do Desconto * {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
              </Label>
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                {editingPromotion ? 'Atualizar' : 'Criar'} Promoção
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Promotions
