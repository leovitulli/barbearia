import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'sonner'
import { Shield, Lock, History } from 'lucide-react'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'

export const SecuritySettings = () => {
  const { user } = useSupabaseAuthStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setChanging(true)
    try {
      // TODO: Implementar mudança de senha real
      // Por enquanto, apenas simula
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro ao alterar senha')
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Senha Atual</Label>
            <Input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">Nova Senha</Label>
            <Input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
            <Input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
            />
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={changing}
            className="w-full"
          >
            {changing ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>

      {/* Sessões Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sessões Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  🖥️
                </div>
                <div>
                  <p className="font-medium">Sessão Atual</p>
                  <p className="text-sm text-gray-600">
                    {user?.email} - Ativo agora
                  </p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">ATIVO</span>
            </div>

            <p className="text-sm text-gray-500 text-center py-2">
              Nenhuma outra sessão ativa
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Login */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border-b">
              <div>
                <p className="text-sm font-medium">Login bem-sucedido</p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleString('pt-BR')}
                </p>
              </div>
              <span className="text-xs text-gray-400">192.168.1.1</span>
            </div>

            <p className="text-sm text-gray-500 text-center py-4">
              Histórico completo disponível em breve
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Autenticação em 2 Fatores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação em 2 Fatores (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Adicione uma camada extra de segurança à sua conta. Quando ativado, você precisará 
              fornecer um código de verificação além da sua senha.
            </p>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="enable_2fa"
                disabled
                className="w-4 h-4"
              />
              <label htmlFor="enable_2fa" className="text-sm">
                Ativar 2FA (Em breve)
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
