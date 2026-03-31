import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Package,
  FileText,
  ScrollText,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Tag,
  Gift,
  ShoppingBag,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { supabase } from '../lib/supabase'

const Layout = () => {
  const { user, logout, setUser } = useSupabaseAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companyName, setCompanyName] = useState('San Patricio')

  useEffect(() => {
    loadCompanyName()
  }, [])

  // Recarregar dados do usuário a cada 3 segundos para manter sidebar atualizada
  useEffect(() => {
    if (!user?.id) return

    const reloadUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, avatar, phone, specialty')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          // Só atualizar se houver mudanças
          if (
            data.name !== user.name ||
            data.avatar !== user.avatar ||
            data.phone !== user.phone ||
            data.specialty !== user.specialty
          ) {
            setUser({
              ...user,
              name: data.name,
              avatar: data.avatar,
              phone: data.phone,
              specialty: data.specialty
            })
          }
        } else if (error) {
          console.error('Erro ao buscar dados do usuário:', error)
        }
      } catch (error) {
        console.error('Erro ao recarregar dados do usuário:', error)
      }
    }

    // Recarregar a cada 5 segundos (reduz carga no servidor)
    const interval = setInterval(reloadUserData, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [user?.id, user?.name, user?.avatar])

  const loadCompanyName = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'company_name')
        .single()

      if (data?.value) {
        setCompanyName(data.value as string)
      }
    } catch (error) {
      console.error('Erro ao carregar o nome da empresa', error)
      // Usar nome padrão
    }
  }

  const isAdmin = user?.role === 'admin'

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, show: true },
    { name: 'Agenda', href: '/agenda', icon: Calendar, show: true },
    {
      name: 'Clientes',
      href: '/clientes',
      icon: Users,
      show: true,
    },
    {
      name: 'Barbeiros',
      href: '/barbeiros',
      icon: Scissors,
      show: isAdmin,
    },
    {
      name: 'Serviços',
      href: '/servicos',
      icon: Package,
      show: isAdmin,
    },
    {
      name: 'Promoções',
      href: '/promocoes',
      icon: Tag,
      show: isAdmin,
    },
    {
      name: 'Pacotes',
      href: '/pacotes',
      icon: Gift,
      show: isAdmin,
    },
    {
      name: 'Pacotes Clientes',
      href: '/pacotes-clientes',
      icon: ShoppingBag,
      show: isAdmin,
    },
    {
      name: 'Relatórios',
      href: '/relatorios',
      icon: FileText,
      show: isAdmin,
    },
    {
      name: 'Logs',
      href: '/logs',
      icon: ScrollText,
      show: isAdmin,
    },
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-gray-900">{companyName}</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map(
              (item) =>
                item.show && (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
            )}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={user?.avatar || 'https://via.placeholder.com/40'}
                alt={user?.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === 'admin' ? 'Administrador' : 'Barbeiro'}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                to="/perfil"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/configuracoes"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {navigation.find((item) => item.href === location.pathname)?.name ||
              companyName}
          </h1>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
