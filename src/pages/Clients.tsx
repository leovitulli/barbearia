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
import { Plus, Search, Edit, Trash2, Phone, Calendar, Mail, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { auditLogService } from '../services/auditLogService'

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    birth_date: '',
  })
  const [sameAsPhone, setSameAsPhone] = useState(false)

  useEffect(() => {
    loadClients()
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

  const loadClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setClients(data || [])
    } catch (error) {
      
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter((client) =>
    (client.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenDialog = (client?: any) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name,
        phone: client.phone,
        whatsapp: client.whatsapp || '',
        email: client.email || '',
        birth_date: client.birth_date || '',
      })
      setSameAsPhone(client.phone === client.whatsapp)
    } else {
      setEditingClient(null)
      setFormData({ name: '', phone: '', whatsapp: '', email: '', birth_date: '' })
      setSameAsPhone(false)
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Verificar email duplicado
      if (formData.email) {
        const existingClient = clients.find(
          (client) => client.email === formData.email && client.id !== editingClient?.id
        )
        
        if (existingClient) {
          toast.error('⚠️ Este email já está sendo usado por outro cliente. Use um email diferente.', {
            duration: 5000
          })
          return
        }
      }

      // Verificar WhatsApp duplicado
      if (formData.whatsapp) {
        const existingWhatsapp = clients.find(
          (client) => client.whatsapp === formData.whatsapp && client.id !== editingClient?.id
        )
        
        if (existingWhatsapp) {
          toast.error('⚠️ Este WhatsApp já está sendo usado por outro cliente. Use um número diferente.', {
            duration: 5000
          })
          return
        }
      }

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            phone: formData.phone,
            whatsapp: formData.whatsapp || null,
            email: formData.email || null,
            birth_date: formData.birth_date || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClient.id)
        
        if (error) {
          throw error
        }
        
        // Registrar log de atualização
        await auditLogService.logUpdate('client', editingClient.id, formData.name, {
          phone: formData.phone,
          email: formData.email
        })
        
        toast.success('Cliente atualizado com sucesso!')
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert([{
            name: formData.name,
            phone: formData.phone,
            whatsapp: formData.whatsapp || null,
            email: formData.email || null,
            birth_date: formData.birth_date || null
          }])
          .select()
        
        if (error) {
          throw error
        }
        
        // Registrar log de criação
        if (data && data[0]) {
          await auditLogService.logCreate('client', data[0].id, formData.name, {
            phone: formData.phone,
            email: formData.email
          })
        }
        
        toast.success('Cliente cadastrado com sucesso!')
      }

      setDialogOpen(false)
      setFormData({ name: '', phone: '', whatsapp: '', email: '', birth_date: '' })
      loadClients()
    } catch (error: any) {
      
      toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleDelete = async (id: string) => {
    // Buscar nome do cliente antes de deletar
    const clientToDelete = clients.find(c => c.id === id)
    const clientName = clientToDelete?.name || 'Cliente'
    
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        // Registrar log de exclusão
        await auditLogService.logDelete('client', id, clientName)
        
        toast.success('Cliente excluído com sucesso!')
        loadClients()
      } catch (error) {
        console.error('Erro ao excluir cliente:', error)
        toast.error('Erro ao excluir cliente')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente colorido */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">👥 Clientes</h2>
            <p className="mt-2 text-green-100">
              Gerencie os clientes da barbearia
            </p>
          </div>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-white text-green-600 hover:bg-green-50 font-medium px-4 py-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            ➕ Novo Cliente
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar cliente por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle className="text-lg">{client.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {client.phone}
              </div>
              {client.whatsapp && (
                <div className="flex items-center text-sm text-gray-600">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {client.whatsapp}
                </div>
              )}
              {client.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {client.email}
                </div>
              )}
              {client.birth_date && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(parseISO(client.birth_date), 'dd/MM/yyyy')}
                </div>
              )}
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(client)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(client.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum cliente encontrado
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
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
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="space-y-2">
                  <Input
                    id="whatsapp"
                    value={sameAsPhone ? formData.phone : formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                    disabled={sameAsPhone}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sameAsPhone"
                      checked={sameAsPhone}
                      onChange={(e) => {
                        setSameAsPhone(e.target.checked)
                        if (e.target.checked) {
                          setFormData({ ...formData, whatsapp: formData.phone })
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="sameAsPhone" className="text-sm text-gray-600 cursor-pointer">
                      Mesmo número do telefone
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
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
                {editingClient ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Clients
