export type UserRole = 'admin' | 'barber'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  avatar?: string
  specialty?: string
  permissions?: UserPermissions
  barberProfileId?: string // For admin who also acts as barber
}

export interface UserPermissions {
  canViewReports: boolean
  canManageClients: boolean
  canManageAppointments: boolean
  canViewAllBarbers: boolean
}

export interface Barber {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  status: 'active' | 'inactive'
  specialty?: string
  permissions: UserPermissions
}

export interface Client {
  id: string
  name: string
  phone: string
  whatsapp?: string
  email?: string
  birthDate?: string
  createdAt: string
}

export interface Service {
  id: string
  name: string
  price: number
  duration: number // in minutes
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: string
  clientId: string
  barberId: string
  serviceId: string
  date: string
  time: string
  status: AppointmentStatus
  notes?: string
  createdAt: string
}

export interface BlockedSlot {
  id: string
  barberId: string
  date: string
  time: string
  reason?: string
}

export interface SystemLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  details: string
}

export interface BarberShopSettings {
  name: string
  address: string
  phone: string
  companyName: string
  cnpj: string
  openingDate: string
}

export interface BarberStats {
  servicesCompleted: number
  totalRevenue: number
  averageRating: number
  mostPopularService: string
}
