import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  specialty?: string
  avatar?: string
  role: 'admin' | 'barber'
  barber_profile_id?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  phone: string
  whatsapp?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  client_id: string
  barber_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  created_at: string
  updated_at: string
}
