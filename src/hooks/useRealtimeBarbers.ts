import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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

/**
 * Hook para sincronização em tempo real de perfis de barbeiros
 * Atualiza automaticamente quando qualquer barbeiro atualiza seu perfil
 */
export const useRealtimeBarbers = (initialBarbers: BarberProfile[] = []) => {
  const [barbers, setBarbers] = useState<BarberProfile[]>(initialBarbers)

  // Efeito 1: sincronizar quando os dados iniciais mudarem (inclusive updates de conteúdo)
  useEffect(() => {
    setBarbers(initialBarbers)
  }, [initialBarbers])

  // Efeito 2: subscription realtime — roda apenas uma vez na montagem
  useEffect(() => {
    const channel = supabase
      .channel('barber_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'barber_profiles'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBarbers((prev) => [...prev, payload.new as BarberProfile])
          } else if (payload.eventType === 'UPDATE') {
            setBarbers((prev) =>
              prev.map((barber) =>
                barber.id === payload.new.id
                  ? { ...barber, ...(payload.new as BarberProfile) }
                  : barber
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setBarbers((prev) =>
              prev.filter((barber) => barber.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // Subscription estável — não recria a cada render

  return barbers
}

/**
 * Hook para sincronização em tempo real de um barbeiro específico
 */
export const useRealtimeBarber = (barberId: string | null) => {
  const [barber, setBarber] = useState<BarberProfile | null>(null)

  useEffect(() => {
    if (!barberId) return

    // Buscar dados iniciais
    const loadBarber = async () => {
      const { data } = await supabase
        .from('barber_profiles')
        .select('*')
        .eq('id', barberId)
        .single()

      if (data) {
        setBarber(data)
      }
    }

    loadBarber()

    // Criar canal de realtime
    const channel = supabase
      .channel(`barber_${barberId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'barber_profiles',
          filter: `id=eq.${barberId}`
        },
        (payload) => {
          console.log('🔄 Perfil do barbeiro atualizado:', payload)
          setBarber(payload.new as BarberProfile)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [barberId])

  return barber
}

/**
 * Hook para sincronização em tempo real de usuários (tabela users)
 * Útil para atualizar nome, avatar, etc em tempo real
 */
export const useRealtimeUsers = () => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    const channel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('🔄 Usuário atualizado:', payload)
          // Atualizar timestamp para forçar re-render
          setLastUpdate(new Date())
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return lastUpdate
}
