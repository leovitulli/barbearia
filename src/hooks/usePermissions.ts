import { useState, useEffect } from 'react'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'
import { supabase } from '../lib/supabase'
import { BarberPermissions, DEFAULT_BARBER_PERMISSIONS, ADMIN_PERMISSIONS } from '../types/permissions'

export const usePermissions = () => {
  const { user } = useSupabaseAuthStore()
  const [permissions, setPermissions] = useState<BarberPermissions>(DEFAULT_BARBER_PERMISSIONS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPermissions()
  }, [user])

  const loadPermissions = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    // IMPORTANTE: Admin SEMPRE tem todas as permissões, independente de ter barber_profile_id
    // Isso garante que Rafael (que é Admin E Barbeiro) não seja afetado por permissões
    if (user.role === 'admin') {
      setPermissions(ADMIN_PERMISSIONS)
      setLoading(false)
      return
    }

    // Carregar permissões APENAS para barbeiros (não admin)
    if (user.role === 'barber' && user.barber_profile_id) {
      try {
        const { data, error } = await supabase
          .from('barber_profiles')
          .select('permissions')
          .eq('id', user.barber_profile_id)
          .single()

        if (error) throw error

        if (data && data.permissions) {
          setPermissions({ ...DEFAULT_BARBER_PERMISSIONS, ...data.permissions })
        } else {
          setPermissions(DEFAULT_BARBER_PERMISSIONS)
        }
      } catch (error) {
        console.error('Erro ao carregar permissões:', error)
        setPermissions(DEFAULT_BARBER_PERMISSIONS)
      }
    }

    setLoading(false)
  }

  const updatePermissions = async (newPermissions: Partial<BarberPermissions>) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Apenas administradores podem atualizar permissões')
    }

    return newPermissions
  }

  return {
    permissions,
    loading,
    isAdmin: user?.role === 'admin',
    isBarber: user?.role === 'barber',
    updatePermissions
  }
}
