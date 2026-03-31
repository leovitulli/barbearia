import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Upload, Phone, Mail, Briefcase, User, Scissors } from 'lucide-react'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

const Profile = () => {
  const { user, updateProfile } = useSupabaseAuthStore()
  const isAdmin = user?.role === 'admin'
  const isBarber = user?.role === 'barber'

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    specialty: user?.specialty || '',
    bio: (user as any)?.bio || '',
    avatar: user?.avatar || '',
  })

  const [saving, setSaving] = useState(false)
  const [barberEnabled, setBarberEnabled] = useState(false)
  const [togglingBarber, setTogglingBarber] = useState(false)

  // Verificar se admin já tem perfil de barbeiro ativo (busca sempre pelo email)
  useEffect(() => {
    if (!isAdmin || !user?.email) return

    supabase
      .from('users')
      .select('id, barber_profile_id')
      .eq('email', user.email)
      .single()
      .then(({ data: realUser }) => {
        if (!realUser?.barber_profile_id) return

        supabase
          .from('barber_profiles')
          .select('active')
          .eq('id', realUser.barber_profile_id)
          .single()
          .then(({ data }) => {
            if (data) setBarberEnabled(data.active)
          })
      })
  }, [isAdmin, user?.email])


  const toggleBarberProfile = async () => {
    if (!user) return
    setTogglingBarber(true)

    try {
      const newEnabled = !barberEnabled

      // Buscar ID real do usuário no banco pelo email
      const { data: realUser, error: userError } = await supabase
        .from('users')
        .select('id, barber_profile_id')
        .eq('email', user.email)
        .single()

      if (userError || !realUser) {
        toast.error('Usuário não encontrado no banco de dados')
        return
      }

      const userId = realUser.id

      if (newEnabled) {
        // Verificar se já existe perfil
        const { data: existing } = await supabase
          .from('barber_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (existing) {
          // Reativar perfil existente
          const { error: updateError } = await supabase
            .from('barber_profiles')
            .update({ active: true, updated_at: new Date().toISOString() })
            .eq('id', existing.id)

          if (updateError) {
            toast.error(`Erro ao ativar: ${updateError.message}`)
            return
          }

          if (!realUser.barber_profile_id) {
            await supabase.from('users').update({ barber_profile_id: existing.id }).eq('id', userId)
          }

          await updateProfile({ barber_profile_id: existing.id })
          toast.success('Perfil de barbeiro ativado!')
        } else {
          // Criar novo perfil — apenas colunas que existem na tabela
          const { data: newProfile, error: insertError } = await supabase
            .from('barber_profiles')
            .insert({
              user_id: userId,
              specialty: user.specialty || 'Cortes em geral',
              avatar: user.avatar || null,
              active: true,
              can_view_reports: true,
              can_manage_clients: true,
              can_manage_appointments: true,
              can_view_all_barbers: true
            })
            .select()
            .single()

          if (insertError) {
            toast.error(`Erro ao criar perfil: ${insertError.message}`)
            return
          }

          await supabase.from('users').update({ barber_profile_id: newProfile.id }).eq('id', userId)
          await updateProfile({ barber_profile_id: newProfile.id })
          toast.success('Perfil de barbeiro criado e ativado!')
        }
      } else {
        // Desativar perfil
        const profileId = realUser.barber_profile_id || user.barber_profile_id
        if (profileId) {
          const { error: deactivateError } = await supabase
            .from('barber_profiles')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('id', profileId)

          if (deactivateError) {
            toast.error(`Erro ao desativar: ${deactivateError.message}`)
            return
          }
        }
        toast.info('Perfil de barbeiro desativado')
      }

      setBarberEnabled(newEnabled)
    } catch (error) {
      console.error('Erro toggle barbeiro:', error)
      toast.error('Erro ao alterar perfil de barbeiro')
    } finally {
      setTogglingBarber(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        specialty: formData.specialty,
        avatar: formData.avatar,
        ...(formData.bio && { bio: formData.bio } as any),
      })

      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const newAvatar = reader.result as string
        setFormData({ ...formData, avatar: newAvatar })
        updateProfile({ avatar: newAvatar })
        toast.success('Foto atualizada com sucesso!')
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold">👤 Meu Perfil</h2>
        <p className="mt-2 text-blue-100">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Card com Foto e Info Básica */}
      <Card className="border-l-4 border-l-blue-500 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <img
                src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt={formData.name}
                className="h-32 w-32 rounded-full border-4 border-blue-500 object-cover"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="h-8 w-8 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold">{user?.name}</h3>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <p className="text-gray-600">{user?.email}</p>
              </div>
              <div className="mt-3">
                <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                  {user?.role === 'admin' ? '👑 Administrador' : '✂️ Barbeiro'}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                💡 Clique na foto para alterar (máx. 2MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Dados Pessoais */}
      <Card className="border-l-4 border-l-purple-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <User className="h-5 w-5" />
            📝 Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-2 focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-gray-700 font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Telefone *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-2 focus:border-purple-400"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            {/* Email (desabilitado) */}
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                value={user?.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ O email não pode ser alterado
              </p>
            </div>

            {/* Especialidade (apenas para barbeiros) */}
            {isBarber && (
              <div>
                <Label htmlFor="specialty" className="text-gray-700 font-medium flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  Especialidade
                </Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="border-2 focus:border-purple-400"
                  placeholder="Ex: Cortes modernos, Barbas, etc."
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Suas habilidades e especialidades
                </p>
              </div>
            )}

            {/* Bio */}
            <div>
              <Label htmlFor="bio" className="text-gray-700 font-medium">
                📝 Biografia / Apresentação
              </Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 border-2 rounded-md focus:border-purple-400 focus:outline-none resize-y"
                placeholder="Conte um pouco sobre você, sua experiência, estilo de trabalho..."
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Esta descrição aparecerá no seu perfil público
              </p>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium px-8"
              >
                {saving ? 'Salvando...' : '💾 Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Card: Perfil de Barbeiro (apenas para Admin) */}
      {isAdmin && (
        <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Scissors className="h-5 w-5" />
                  ✂️ Perfil de Barbeiro
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {barberEnabled
                    ? 'Você está ativo como barbeiro e pode receber agendamentos'
                    : 'Ative para também aparecer como barbeiro na agenda'}
                </p>
              </div>
              <Button
                type="button"
                variant={barberEnabled ? 'default' : 'outline'}
                onClick={toggleBarberProfile}
                disabled={togglingBarber}
                className={barberEnabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'border-blue-400 text-blue-600 hover:bg-blue-50'}
              >
                {togglingBarber ? 'Aguarde...' : barberEnabled ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </CardHeader>
          {barberEnabled && (
            <CardContent className="pt-4">
              <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
                ✅ Você aparece na lista de barbeiros e pode ser selecionado em agendamentos.
                Para desativar, clique em "Ativado".
              </p>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}

export default Profile
