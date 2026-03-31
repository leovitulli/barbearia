import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, User } from '../lib/supabase'
import { toast } from 'sonner'
import { auditLogService } from '../services/auditLogService'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  loginWithProvider: (provider: 'google' | 'facebook' | 'github') => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User) => void
}

export const useSupabaseAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,

      login: async (email: string, password: string) => {
        set({ loading: true })

        try {
          // 1. Autenticar com Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (authError || !authData.user) {
            toast.error('Email ou senha incorretos')
            set({ loading: false })
            return false
          }

          // 2. Buscar perfil completo na tabela users
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

          if (userError || !userData) {
            toast.error('Perfil de usuário não encontrado')
            set({ loading: false })
            return false
          }

          const user = userData as User
          set({ user, loading: false })
          toast.success(`Bem-vindo, ${user.name}!`)

          // Registrar log de login
          try {
            await auditLogService.logLogin(user.id, user.name, user.email)
          } catch (error) {
            console.error('Erro ao registrar log de login:', error)
          }

          return true

        } catch (error) {
          console.error('Erro no login:', error)
          toast.error('Erro ao conectar ao servidor')
          set({ loading: false })
          return false
        }
      },

      loginWithProvider: async (provider: 'google' | 'facebook' | 'github') => {
        try {
          set({ loading: true })
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/auth/callback`
            }
          })
          if (error) {
            toast.error(`Erro no login com ${provider}`)
            set({ loading: false })
          }
        } catch (error) {
          toast.error('Erro interno do servidor')
          set({ loading: false })
        }
      },

      logout: async () => {
        const currentUser = get().user
        if (currentUser) {
          try {
            await auditLogService.logLogout(currentUser.name)
          } catch (error) {
            console.error('Erro ao registrar log de logout:', error)
          }
        }
        await supabase.auth.signOut()
        set({ user: null })
        toast.info('Logout realizado com sucesso')
      },

      updateProfile: async (updates: Partial<User>) => {
        const currentUser = get().user
        if (!currentUser) return

        try {
          // Usar serviço de sincronização para atualizar perfil
          const { profileSyncService } = await import('../services/profileSyncService')
          await profileSyncService.updateUserProfile(currentUser.id, updates)

          const updatedUser = { ...currentUser, ...updates }
          set({ user: updatedUser })
          toast.success('Perfil atualizado com sucesso!')

        } catch (error) {
          console.error('Erro ao atualizar perfil:', error)
          toast.error('Erro ao atualizar perfil')
        }
      },

      checkAuth: async () => {
        // Verificar se há usuário logado no localStorage
        const storedUser = get().user


        if (storedUser) {
          // Para sistema mock, vamos validar por email em vez de ID
          try {

            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('email', storedUser.email)
              .limit(1)

            if (error) {

              // Manter usuário logado mesmo com erro de validação

            } else if (!data || data.length === 0) {

              set({ user: null })
            } else {

              // Atualizar com dados do banco, mas manter ID original para compatibilidade
              const updatedUser = { ...storedUser, ...data[0] }
              set({ user: updatedUser })
            }
          } catch (error) {

            // Manter usuário logado mesmo com erro

          }
        } else {

        }
      },

      setUser: (user: User) => {
        set({ user })
      }
    }),
    {
      name: 'supabase-auth-storage',
    }
  )
)
