import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  Building2, 
  Phone,
  Mail,
  MapPin,
  Clock,
  Save
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { CommissionSettings } from '../components/CommissionSettings'
import { SecuritySettings } from '../components/SecuritySettings'
import { NotificationSettings } from '../components/NotificationSettings'

const Settings = () => {
  const [formData, setFormData] = useState({
    // Informações da Barbearia
    companyName: 'San Patricio Barbearia',
    companyLegalName: '',
    companyDescription: 'Sistema de Gestão de Barbearia',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 99999-9999',
    email: 'contato@sanpatricio.com',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    
    // Notificações
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
  })

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  const [workingHours, setWorkingHours] = useState({
    monday: { open: '09:00', close: '20:00', closed: false },
    tuesday: { open: '09:00', close: '20:00', closed: false },
    wednesday: { open: '09:00', close: '20:00', closed: false },
    thursday: { open: '09:00', close: '20:00', closed: false },
    friday: { open: '09:00', close: '20:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: true },
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Carregar todas as configs de uma vez (mais eficiente)
      const { data: allSettings, error: settingsError } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['working_hours', 'company_name', 'company_description', 'company_legal_name'])

      if (settingsError) {
        console.error('Erro ao carregar configurações:', settingsError)
        toast.error(`Erro ao carregar configurações: ${settingsError.message}`)
        return
      }

      if (!allSettings || allSettings.length === 0) {
        console.warn('Nenhuma configuração encontrada em system_settings. Execute o script SQL de diagnóstico.')
        return
      }

      const settingsMap = Object.fromEntries(allSettings.map(s => [s.key, s.value]))

      if (settingsMap['working_hours']) {
        setWorkingHours(settingsMap['working_hours'] as any)
      }
      if (settingsMap['company_name']) {
        // value pode ser string JSON (ex: '"San Patricio"') ou string direta
        const name = typeof settingsMap['company_name'] === 'string'
          ? settingsMap['company_name']
          : settingsMap['company_name']
        setFormData(prev => ({ ...prev, companyName: name as string }))
      }
      if (settingsMap['company_description']) {
        setFormData(prev => ({ ...prev, companyDescription: settingsMap['company_description'] as string }))
      }
      if (settingsMap['company_legal_name']) {
        setFormData(prev => ({ ...prev, companyLegalName: settingsMap['company_legal_name'] as string }))
      }
    } catch (error: any) {
      console.error('Erro inesperado ao carregar configurações:', error)
      toast.error('Erro de conexão com o banco de dados. Verifique sua conexão.')
    }
  }

  const saveWorkingHours = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'working_hours',
          value: workingHours,
          description: 'Horários de funcionamento da barbearia',
          category: 'general',
          is_public: true
        }, {
          onConflict: 'key'
        })

      if (error) {
        console.error('Erro ao salvar horários:', error)
        throw error
      }

      toast.success('✅ Horários salvos com sucesso!')
    } catch (error: any) {
      console.error('Erro inesperado ao salvar horários:', error)
      toast.error(`Erro ao salvar horários: ${error.message || 'Erro desconhecido'}`)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Salvar nome da barbearia
      const { error: nameError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'company_name',
          value: formData.companyName,
          description: 'Nome da barbearia',
          category: 'general',
          is_public: true
        }, {
          onConflict: 'key'
        })
      if (nameError) {
        console.error('Erro ao salvar nome:', nameError)
        throw nameError
      }

      // Salvar descrição da barbearia
      const { error: descError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'company_description',
          value: formData.companyDescription,
          description: 'Descrição da barbearia',
          category: 'general',
          is_public: true
        }, {
          onConflict: 'key'
        })
      if (descError) {
        console.error('Erro ao salvar descrição:', descError)
        throw descError
      }

      // Salvar razão social
      const { error: legalError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'company_legal_name',
          value: formData.companyLegalName,
          description: 'Razão social da barbearia',
          category: 'general',
          is_public: false
        }, {
          onConflict: 'key'
        })
      if (legalError) {
        console.error('Erro ao salvar razão social:', legalError)
        throw legalError
      }

      toast.success('✅ Configurações atualizadas com sucesso!')
      
      // Recarregar a página para atualizar em todo o sistema
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error('Erro inesperado ao salvar configurações:', error)
      toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`)
    }
  }


  return (
    <div className="space-y-6">
      {/* Header com gradiente colorido */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold">⚙️ Configurações</h2>
        <p className="mt-2 text-blue-100">
          Gerencie as configurações da sua barbearia
        </p>
      </div>

      <div className="grid gap-6">
        {/* Informações da Barbearia */}
        <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Building2 className="h-5 w-5" />
              🏢 Informações da Barbearia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="companyName" className="text-gray-700 font-medium">Nome Fantasia</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="border-2 focus:border-blue-400"
                  placeholder="Ex: San Patricio"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Este nome aparecerá no menu lateral, cabeçalho e tela de login
                </p>
              </div>

              <div>
                <Label htmlFor="companyLegalName" className="text-gray-700 font-medium">Razão Social</Label>
                <Input
                  id="companyLegalName"
                  value={formData.companyLegalName}
                  onChange={(e) => setFormData({ ...formData, companyLegalName: e.target.value })}
                  className="border-2 focus:border-blue-400"
                  placeholder="Ex: San Patricio Barbearia LTDA"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Nome oficial da empresa (usado em documentos e relatórios)
                </p>
              </div>

              <div>
                <Label htmlFor="companyDescription" className="text-gray-700 font-medium">Descrição/Slogan</Label>
                <Input
                  id="companyDescription"
                  value={formData.companyDescription}
                  onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
                  className="border-2 focus:border-blue-400"
                  placeholder="Ex: Sistema de Gestão de Barbearia"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Aparecerá na tela de login abaixo do nome
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj" className="text-gray-700 font-medium">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="border-2 focus:border-blue-400"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" /> Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-2 focus:border-green-400"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" /> E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-2 focus:border-green-400"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address" className="text-gray-700 font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Endereço
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="border-2 focus:border-purple-400"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-gray-700 font-medium">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="border-2 focus:border-purple-400"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-gray-700 font-medium">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="border-2 focus:border-purple-400"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode" className="text-gray-700 font-medium">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="border-2 focus:border-purple-400"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-6 py-2 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                💾 Salvar Informações
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Horário de Funcionamento */}
        <Card className="border-l-4 border-l-green-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Clock className="h-5 w-5" />
              🕐 Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {daysOrder.map((day) => {
                const hours = workingHours[day as keyof typeof workingHours]
                const dayNames: Record<string, string> = {
                  monday: 'Segunda-feira',
                  tuesday: 'Terça-feira',
                  wednesday: 'Quarta-feira',
                  thursday: 'Quinta-feira',
                  friday: 'Sexta-feira',
                  saturday: 'Sábado',
                  sunday: 'Domingo'
                }

                return (
                  <div key={day} className={`p-4 rounded-lg border-2 ${hours.closed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-lg font-semibold">{dayNames[day]}</Label>
                      <button
                        type="button"
                        onClick={() => setWorkingHours({
                          ...workingHours,
                          [day]: { ...hours, closed: !hours.closed }
                        })}
                        className={`px-4 py-1 rounded-full text-sm font-medium ${
                          hours.closed 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {hours.closed ? '🔒 Fechado' : '✅ Aberto'}
                      </button>
                    </div>
                    
                    {!hours.closed && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Abertura</Label>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => setWorkingHours({
                              ...workingHours,
                              [day]: { ...hours, open: e.target.value }
                            })}
                            className="border-2 focus:border-green-400"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Fechamento</Label>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => setWorkingHours({
                              ...workingHours,
                              [day]: { ...hours, close: e.target.value }
                            })}
                            className="border-2 focus:border-green-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <Button 
              onClick={saveWorkingHours}
              className="mt-6 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-6 py-3 flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              💾 Salvar Horários de Funcionamento
            </Button>
          </CardContent>
        </Card>

        {/* Comissões dos Barbeiros */}
        <CommissionSettings />

        {/* Notificações */}
        <NotificationSettings />

        {/* Segurança */}
        <SecuritySettings />
      </div>
    </div>
  )
}

export default Settings
