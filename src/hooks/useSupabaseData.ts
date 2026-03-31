import { useState, useEffect } from 'react'
import { supabase, User, Client, Service, Appointment } from '../lib/supabase'
import { toast } from 'sonner'

// Hook para usuários/barbeiros
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()

      if (error) throw error
      if (data) {
        setUsers(prev => [...prev, data[0] as User])
        toast.success('Usuário criado com sucesso!')
      }
    } catch (error) {
      
      toast.error('Erro ao criar usuário')
    }
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, ...updates } : user
      ))
      toast.success('Usuário atualizado com sucesso!')
    } catch (error) {
      
      toast.error('Erro ao atualizar usuário')
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setUsers(prev => prev.filter(user => user.id !== id))
      toast.success('Usuário excluído com sucesso!')
    } catch (error) {
      
      toast.error('Erro ao excluir usuário')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return { users, loading, addUser, updateUser, deleteUser, refetch: fetchUsers }
}

// Hook para clientes
export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()

      if (error) throw error
      if (data) {
        setClients(prev => [...prev, data[0] as Client])
        toast.success('Cliente criado com sucesso!')
        return data[0] as Client
      }
    } catch (error) {
      
      toast.error('Erro ao criar cliente')
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return { clients, loading, addClient, refetch: fetchClients }
}

// Hook para serviços
export const useServices = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  return { services, loading, refetch: fetchServices }
}

// Hook para agendamentos
export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('appointment_time')

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()

      if (error) throw error
      if (data) {
        setAppointments(prev => [...prev, data[0] as Appointment])
        toast.success('Agendamento criado com sucesso!')
        return data[0] as Appointment
      }
    } catch (error) {
      
      toast.error('Erro ao criar agendamento')
    }
  }

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      
      setAppointments(prev => prev.map(apt => 
        apt.id === id ? { ...apt, ...updates } : apt
      ))
      toast.success('Agendamento atualizado com sucesso!')
    } catch (error) {
      
      toast.error('Erro ao atualizar agendamento')
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  return { appointments, loading, addAppointment, updateAppointment, refetch: fetchAppointments }
}
