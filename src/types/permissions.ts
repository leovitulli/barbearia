// Sistema de Permissões para Barbeiros

export interface BarberPermissions {
  // Acesso a páginas
  canAccessDashboard: boolean
  canAccessAgenda: boolean
  canAccessClients: boolean
  canAccessServices: boolean
  canAccessReports: boolean
  canAccessPromotions: boolean
  canAccessPackages: boolean
  
  // Visualização de faturamento
  canViewDailyRevenue: boolean
  canViewMonthlyRevenue: boolean
  canViewOwnRevenue: boolean // Sempre true para barbeiros
  
  // Outras permissões
  canEditOwnProfile: boolean
  canCreateAppointments: boolean
  canCancelAppointments: boolean
}

export const DEFAULT_BARBER_PERMISSIONS: BarberPermissions = {
  // Por padrão, barbeiros têm acesso básico
  canAccessDashboard: true,
  canAccessAgenda: true,
  canAccessClients: true,
  canAccessServices: true,
  canAccessReports: false,
  canAccessPromotions: false,
  canAccessPackages: false,
  
  // Faturamento - padrão: apenas o próprio
  canViewDailyRevenue: false,
  canViewMonthlyRevenue: false,
  canViewOwnRevenue: true,
  
  // Permissões básicas
  canEditOwnProfile: true,
  canCreateAppointments: true,
  canCancelAppointments: false,
}

export const ADMIN_PERMISSIONS: BarberPermissions = {
  // Admin tem acesso total
  canAccessDashboard: true,
  canAccessAgenda: true,
  canAccessClients: true,
  canAccessServices: true,
  canAccessReports: true,
  canAccessPromotions: true,
  canAccessPackages: true,
  
  canViewDailyRevenue: true,
  canViewMonthlyRevenue: true,
  canViewOwnRevenue: true,
  
  canEditOwnProfile: true,
  canCreateAppointments: true,
  canCancelAppointments: true,
}
