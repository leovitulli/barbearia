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
import { Plus, Edit, Trash2, Phone, Mail, Award, Star, Calendar, DollarSign, Settings, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { auditLogService } from '../services/auditLogService'
import { useRealtimeBarbers } from '../hooks/useRealtimeBarbers'

interface BarberProfile {
  id: string
  user_id?: string
  name: string
  phone?: string
  email?: string
  specialty?: string
  bio?: string
  avatar?: string
  experience_years: number
  rating: number
  total_reviews: number
  is_active: boolean
  working_hours?: any
  commission_rate: number
  created_at: string
  updated_at: string
}

const Barbers = () => {
  const [initialBarbers, setInitialBarbers] = useState<BarberProfile[]>([])
  const barbers = useRealtimeBarbers(initialBarbers) // Usar hook de realtime
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [editingBarber, setEditingBarber] = useState<BarberProfile | null>(null)
  const [selectedBarberForPermissions, setSelectedBarberForPermissions] = useState<BarberProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    specialty: '',
    bio: '',
    avatar: '',
    experience_years: 1,
    commission_rate: 50.0
  })

  // Permissões do barbeiro selecionado
  const [permissions, setPermissions] = useState({
    canAccessDashboard: true,
    canAccessAgenda: true,
    canAccessClients: true,
    canAccessServices: true,
    canAccessReports: false,
    canAccessPromotions: false,
    canAccessPackages: false,
    canViewDailyRevenue: false,
    canViewMonthlyRevenue: false,
    canEditOwnProfile: true,
    canCreateAppointments: true,
    canCancelAppointments: false,
  })

  useEffect(() => {
    loadBarbers()
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

  const loadBarbers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('barber_profiles')
        .select('*')
        .order('name')

      if (error) {

        toast.error('Erro ao carregar barbeiros')
        return
      }

      setInitialBarbers(data || []) // Atualizar initialBarbers para o hook de realtime
    } catch (error) {

      toast.error('Erro interno do servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingBarber) {
        // Atualizar barbeiro existente usando serviço de sincronização
        const { profileSyncService } = await import('../services/profileSyncService')

        await profileSyncService.updateBarberProfile(editingBarber.id, {
          name: formData.name,
          phone: formData.phone,
          specialty: formData.specialty,
          bio: formData.bio,
          avatar: formData.avatar
        })

        // Atualizar campos específicos do barbeiro (não sincronizados)
        const { error } = await supabase
          .from('barber_profiles')
          .update({
            experience_years: formData.experience_years,
            commission_rate: formData.commission_rate,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBarber.id)

        if (error) {
          toast.error('Erro ao atualizar barbeiro')
          return
        }

        // Se senha for preenchida ao editar, avisar que deve ser feito pelo Supabase Auth
        if (formData.password) {
          toast.info('Para alterar a senha de um barbeiro, use o painel do Supabase Auth.')
        } else {
          toast.success('Barbeiro atualizado com sucesso! (Perfil sincronizado)')
        }

        // Registrar log
        try {
          await auditLogService.logUpdate('barber', editingBarber.id, formData.name, {
            fields: ['name', 'phone', 'specialty', 'bio', 'commission_rate']
          })
        } catch (error) {
          console.error('Erro ao registrar log:', error)
        }
      } else {
        // Criar novo barbeiro via Edge Function (garante criação no Auth + banco de forma atômica)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          toast.error('Sessão expirada. Faça login novamente.')
          return
        }

        const response = await supabase.functions.invoke('create-barber-user', {
          body: {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            specialty: formData.specialty,
            bio: formData.bio,
            avatar: formData.avatar,
            experience_years: formData.experience_years,
            commission_rate: formData.commission_rate,
          }
        })

        if (response.error || !response.data?.success) {
          const msg = response.data?.error || response.error?.message || 'Erro ao criar barbeiro'
          toast.error(msg)
          return
        }

        toast.success(`${formData.name} criado! Login disponível com o email e senha definidos.`)

        // Registrar log
        try {
          const { logUser } = await import('../utils/logger')
          logUser.create(formData.name, 'new_barber')
        } catch {}
      }

      setDialogOpen(false)
      setEditingBarber(null)
      resetForm()
      loadBarbers()
    } catch (error) {

      toast.error('Erro interno do servidor')
    }
  }

  const handleEdit = (barber: BarberProfile) => {
    setEditingBarber(barber)
    setFormData({
      name: barber.name,
      phone: barber.phone || '',
      email: barber.email || '',
      password: '',
      specialty: barber.specialty || '',
      bio: barber.bio || '',
      avatar: barber.avatar || '',
      experience_years: barber.experience_years,
      commission_rate: barber.commission_rate
    })
    setDialogOpen(true)
  }

  const handleDelete = async (barber: BarberProfile) => {
    if (!confirm(`Tem certeza que deseja excluir o barbeiro ${barber.name}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('barber_profiles')
        .delete()
        .eq('id', barber.id)

      if (error) {

        toast.error('Erro ao excluir barbeiro')
        return
      }

      toast.success('Barbeiro excluído com sucesso!')

      // Registrar log
      try {
        const { logUser } = await import('../utils/logger')
        logUser.delete(barber.name, barber.id)
      } catch (error) {

      }

      loadBarbers()
    } catch (error) {

      toast.error('Erro interno do servidor')
    }
  }

  const toggleActive = async (barber: BarberProfile) => {
    try {
      const newStatus = !barber.is_active

      const { error } = await supabase
        .from('barber_profiles')
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', barber.id)

      if (error) {

        toast.error('Erro ao alterar status do barbeiro')
        return
      }

      toast.success(`Barbeiro ${newStatus ? 'ativado' : 'desativado'} com sucesso!`)

      // Registrar log
      try {
        const { logUser } = await import('../utils/logger')
        logUser.update(barber.name, barber.id, `Status alterado para ${newStatus ? 'ativo' : 'inativo'}`)
      } catch (error) {

      }

      loadBarbers()
    } catch (error) {

      toast.error('Erro interno do servidor')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      specialty: '',
      bio: '',
      avatar: '',
      experience_years: 1,
      commission_rate: 50.0
    })
  }

  const openAddDialog = () => {
    setEditingBarber(null)
    resetForm()
    setDialogOpen(true)
  }

  const openPermissionsDialog = async (barber: BarberProfile) => {
    setSelectedBarberForPermissions(barber)

    // Carregar permissões atuais do barbeiro
    try {
      const { data, error } = await supabase
        .from('barber_profiles')
        .select('permissions')
        .eq('id', barber.id)
        .single()

      if (error) throw error

      if (data && data.permissions) {
        setPermissions({ ...permissions, ...data.permissions })
      } else {
        // Usar permissões padrão
        setPermissions({
          canAccessDashboard: true,
          canAccessAgenda: true,
          canAccessClients: true,
          canAccessServices: true,
          canAccessReports: false,
          canAccessPromotions: false,
          canAccessPackages: false,
          canViewDailyRevenue: false,
          canViewMonthlyRevenue: false,
          canEditOwnProfile: true,
          canCreateAppointments: true,
          canCancelAppointments: false,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
    }

    setPermissionsDialogOpen(true)
  }

  const savePermissions = async () => {
    if (!selectedBarberForPermissions) return

    try {
      const { error } = await supabase
        .from('barber_profiles')
        .update({
          permissions: permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBarberForPermissions.id)

      if (error) throw error

      toast.success('Permissões atualizadas com sucesso!')
      setPermissionsDialogOpen(false)

      // Registrar log
      await auditLogService.logUpdate(
        'barber',
        selectedBarberForPermissions.id,
        selectedBarberForPermissions.name,
        { action: 'Permissões atualizadas' }
      )
    } catch (error) {
      console.error('Erro ao salvar permissões:', error)
      toast.error('Erro ao salvar permissões')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando barbeiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente colorido */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold">✂️ Barbeiros</h2>
        <p className="mt-2 text-purple-100">
          Gerencie a equipe de barbeiros da barbearia
        </p>
      </div>

      {/* Botão Adicionar */}
      <div className="flex justify-end">
        <Button
          onClick={openAddDialog}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium px-6 py-2 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          ➕ Adicionar Barbeiro
        </Button>
      </div>

      {/* Lista de Barbeiros */}
      {barbers.length === 0 ? (
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nenhum barbeiro cadastrado</h3>
              <p className="text-sm">Adicione barbeiros para começar a gerenciar a equipe.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <Card
              key={barber.id}
              className={`border-l-4 shadow-lg hover:shadow-xl transition-all ${barber.is_active
                  ? 'border-l-blue-500'
                  : 'border-l-gray-400 opacity-60 grayscale'
                }`}
            >
              <CardHeader className={`bg-gradient-to-r ${barber.is_active
                  ? 'from-blue-50 to-purple-50'
                  : 'from-gray-50 to-gray-100'
                }`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={`flex items-center gap-2 ${barber.is_active ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                    <Award className="h-5 w-5" />
                    {barber.name}
                  </CardTitle>
                  <Badge
                    onClick={() => toggleActive(barber)}
                    className={`cursor-pointer transition-all hover:scale-105 filter-none ${barber.is_active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    style={{ filter: 'none' }}
                  >
                    {barber.is_active ? '✅ Ativo' : '❌ Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {barber.avatar && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={barber.avatar}
                        alt={barber.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                      />
                    </div>
                  )}

                  {barber.specialty && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Especialidade:</span> {barber.specialty}
                    </div>
                  )}

                  {barber.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Telefone:</span> {barber.phone}
                    </div>
                  )}

                  {barber.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Email:</span> {barber.email}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Experiência:</span> {barber.experience_years} anos
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Avaliação:</span> {(barber.rating || 0).toFixed(1)} ⭐ ({barber.total_reviews || 0} avaliações)
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Comissão:</span> {barber.commission_rate}%
                  </div>

                  {barber.bio && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic">"{barber.bio}"</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(barber)}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(barber)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPermissionsDialog(barber)}
                    className="col-span-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Gerenciar Permissões
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para Adicionar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {editingBarber ? 'Editar Barbeiro' : 'Adicionar Barbeiro'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-2 focus:border-blue-400"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="border-2 focus:border-blue-400"
              />
            </div>

            <div>
              <Label htmlFor="email">Email de Login *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="barbeiro@email.com"
                className="border-2 focus:border-blue-400"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">
                {editingBarber ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingBarber ? 'Digite para alterar a senha' : 'Senha para login'}
                className="border-2 focus:border-blue-400"
                required={!editingBarber}
              />
              {editingBarber && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Deixe vazio se não quiser alterar a senha
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="avatar">Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                {formData.avatar && (
                  <img
                    src={formData.avatar}
                    alt="Preview"
                    className="h-16 w-16 rounded-full object-cover border-2 border-gray-300"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (!file.type.startsWith('image/')) {
                          toast.error('Por favor, selecione uma imagem válida')
                          return
                        }
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error('A imagem deve ter no máximo 2MB')
                          return
                        }
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setFormData({ ...formData, avatar: reader.result as string })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="border-2 focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="specialty">Especialidade</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="Cortes clássicos, barba, etc."
                className="border-2 focus:border-blue-400"
              />
            </div>

            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Input
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Breve descrição do barbeiro..."
                className="border-2 focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Experiência (anos)</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 1 })}
                  className="border-2 focus:border-blue-400"
                />
              </div>

              <div>
                <Label htmlFor="commission">Comissão (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 50.0 })}
                  className="border-2 focus:border-blue-400"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {editingBarber ? '✓ Atualizar' : '✓ Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Gerenciar Permissões */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Gerenciar Permissões - {selectedBarberForPermissions?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Acesso a Páginas */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Acesso a Páginas
              </h3>
              <div className="space-y-2 pl-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canAccessDashboard}
                    onChange={(e) => setPermissions({ ...permissions, canAccessDashboard: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">📊 Dashboard</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canAccessAgenda}
                    onChange={(e) => setPermissions({ ...permissions, canAccessAgenda: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">📅 Agenda</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canAccessClients}
                    onChange={(e) => setPermissions({ ...permissions, canAccessClients: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">👥 Clientes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canAccessServices}
                    onChange={(e) => setPermissions({ ...permissions, canAccessServices: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">✂️ Serviços</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canAccessReports}
                    onChange={(e) => setPermissions({ ...permissions, canAccessReports: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">📈 Relatórios</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canAccessPromotions}
                    onChange={(e) => setPermissions({ ...permissions, canAccessPromotions: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">🎁 Promoções</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canAccessPackages}
                    onChange={(e) => setPermissions({ ...permissions, canAccessPackages: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">📦 Pacotes</span>
                </label>
              </div>
            </div>

            {/* Visualização de Faturamento */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Visualização de Faturamento
              </h3>
              <div className="space-y-2 pl-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canViewDailyRevenue}
                    onChange={(e) => setPermissions({ ...permissions, canViewDailyRevenue: e.target.checked })}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm">💰 Ver faturamento total diário</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canViewMonthlyRevenue}
                    onChange={(e) => setPermissions({ ...permissions, canViewMonthlyRevenue: e.target.checked })}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm">💵 Ver faturamento total mensal</span>
                </label>
                <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                  ℹ️ Por padrão, barbeiros veem apenas seu próprio faturamento e comissão
                </div>
              </div>
            </div>

          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPermissionsDialogOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={savePermissions}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
            >
              <Shield className="h-4 w-4 mr-1" />
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Barbers
