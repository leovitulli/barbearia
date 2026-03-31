import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Bell, Mail } from 'lucide-react'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'

interface NotificationPreferences {
  new_appointment: boolean
  cancellation: boolean
  no_show: boolean
  review: boolean
  daily_report: boolean
  email_enabled: boolean
}

export const NotificationSettings = () => {
  const { user } = useSupabaseAuthStore()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    new_appointment: true,
    cancellation: true,
    no_show: true,
    review: true,
    daily_report: false,
    email_enabled: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', `notification_prefs_${user?.id}`)
        .single()

      if (data?.value) {
        setPreferences(JSON.parse(data.value as string))
      }
    } catch (error) {
      // Usar preferências padrão
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase
        .from('system_settings')
        .upsert({
          key: `notification_prefs_${user?.id}`,
          value: JSON.stringify(preferences),
          description: `Preferências de notificação do usuário ${user?.name}`,
          category: 'notifications',
          is_public: false
        })

      toast.success('Preferências de notificação salvas!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar preferências')
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipos de Notificações */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-gray-700">
            Receber notificações para:
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.new_appointment}
                onChange={() => togglePreference('new_appointment')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">Novo Agendamento</p>
                <p className="text-xs text-gray-500">
                  Quando um cliente agendar um horário com você
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.cancellation}
                onChange={() => togglePreference('cancellation')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">Cancelamento</p>
                <p className="text-xs text-gray-500">
                  Quando um agendamento for cancelado
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.no_show}
                onChange={() => togglePreference('no_show')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">Cliente Não Compareceu</p>
                <p className="text-xs text-gray-500">
                  Quando marcar um cliente como "não compareceu"
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.review}
                onChange={() => togglePreference('review')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">Nova Avaliação</p>
                <p className="text-xs text-gray-500">
                  Quando receber uma nova avaliação de cliente
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.daily_report}
                onChange={() => togglePreference('daily_report')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">Relatório Diário</p>
                <p className="text-xs text-gray-500">
                  Resumo do dia enviado no final do expediente
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Canais de Notificação */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-sm text-gray-700">
            Enviar notificações por:
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={() => togglePreference('email_enabled')}
                className="w-4 h-4"
              />
              <Mail className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Email</p>
                <p className="text-xs text-gray-600">
                  Enviar para: {user?.email}
                </p>
              </div>
            </label>

            <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg opacity-60">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-4 h-4"
              />
              <Bell className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-sm">Sistema</p>
                <p className="text-xs text-gray-500">
                  Notificações dentro do sistema (sempre ativo)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
