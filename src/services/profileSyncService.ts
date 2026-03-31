import { supabase } from '../lib/supabase'
// import { toast } from 'sonner' // Não usado no momento

/**
 * Serviço para sincronizar perfil de usuário com perfil de barbeiro
 * Garante que quando Rafael (Admin) atualizar seu perfil, o perfil de barbeiro também seja atualizado
 */

interface ProfileUpdate {
  name?: string
  phone?: string
  specialty?: string
  avatar?: string
  bio?: string
}

class ProfileSyncService {
  /**
   * Atualiza perfil do usuário E do barbeiro (se aplicável)
   */
  async updateUserProfile(userId: string, updates: ProfileUpdate) {
    try {
      // 1. Atualizar tabela users
      const { error: userError } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (userError) throw userError

      // 2. Verificar se usuário tem perfil de barbeiro
      const { data: userData } = await supabase
        .from('users')
        .select('barber_profile_id')
        .eq('id', userId)
        .single()

      // 3. Se tiver perfil de barbeiro, sincronizar
      if (userData?.barber_profile_id) {
        await this.syncBarberProfile(userData.barber_profile_id, updates)
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      throw error
    }
  }

  /**
   * Sincroniza dados do perfil de barbeiro
   */
  async syncBarberProfile(barberProfileId: string, updates: ProfileUpdate) {
    try {
      const barberUpdates: any = {}

      // Mapear campos do usuário para campos do barbeiro
      if (updates.name) barberUpdates.name = updates.name
      if (updates.phone) barberUpdates.phone = updates.phone
      if (updates.specialty) barberUpdates.specialty = updates.specialty
      if (updates.avatar) barberUpdates.avatar = updates.avatar
      if (updates.bio) barberUpdates.bio = updates.bio

      if (Object.keys(barberUpdates).length > 0) {
        barberUpdates.updated_at = new Date().toISOString()

        const { error } = await supabase
          .from('barber_profiles')
          .update(barberUpdates)
          .eq('id', barberProfileId)

        if (error) throw error
      }
    } catch (error) {
      console.error('Erro ao sincronizar perfil de barbeiro:', error)
      throw error
    }
  }

  /**
   * Atualiza perfil de barbeiro E usuário (quando editar pela página Barbeiros)
   */
  async updateBarberProfile(barberProfileId: string, updates: ProfileUpdate) {
    try {
      // 1. Atualizar tabela barber_profiles
      const barberUpdates: any = {}
      if (updates.name) barberUpdates.name = updates.name
      if (updates.phone) barberUpdates.phone = updates.phone
      if (updates.specialty) barberUpdates.specialty = updates.specialty
      if (updates.avatar) barberUpdates.avatar = updates.avatar
      if (updates.bio) barberUpdates.bio = updates.bio
      
      barberUpdates.updated_at = new Date().toISOString()

      const { error: barberError } = await supabase
        .from('barber_profiles')
        .update(barberUpdates)
        .eq('id', barberProfileId)

      if (barberError) throw barberError

      // 2. Buscar user_id associado
      const { data: barberData } = await supabase
        .from('barber_profiles')
        .select('user_id')
        .eq('id', barberProfileId)
        .single()

      // 3. Sincronizar com tabela users
      if (barberData?.user_id) {
        const userUpdates: any = {}
        if (updates.name) userUpdates.name = updates.name
        if (updates.phone) userUpdates.phone = updates.phone
        if (updates.specialty) userUpdates.specialty = updates.specialty
        if (updates.avatar) userUpdates.avatar = updates.avatar
        
        userUpdates.updated_at = new Date().toISOString()

        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', barberData.user_id)

        if (userError) throw userError
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar perfil de barbeiro:', error)
      throw error
    }
  }

  /**
   * Busca dados completos do barbeiro (perfil + usuário)
   */
  async getBarberFullProfile(barberProfileId: string) {
    try {
      const { data, error } = await supabase
        .from('barber_profiles')
        .select(`
          *,
          user:users!barber_profiles_user_id_fkey (
            id,
            name,
            email,
            phone,
            role
          )
        `)
        .eq('id', barberProfileId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar perfil completo:', error)
      throw error
    }
  }
}

export const profileSyncService = new ProfileSyncService()
