import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useSupabaseAuthStore } from './store/supabaseAuthStore'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Clients from './pages/Clients'
import Barbers from './pages/Barbers'
import Services from './pages/Services'
import Profile from './pages/Profile'
import Logs from './pages/Logs'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Promotions from './pages/Promotions'
import Packages from './pages/Packages'
import ClientPackages from './pages/ClientPackages'

// Componente de erro boundary
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      
      setHasError(true)
      setError(event.error)
    }
    
    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Erro no Sistema</h1>
          <p className="text-gray-700 mb-4">Ocorreu um erro ao carregar o dashboard:</p>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {error?.message || 'Erro desconhecido'}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Recarregar Página
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function App() {
  const { user, checkAuth } = useSupabaseAuthStore()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="barbeiros" element={<Barbers />} />
            <Route path="servicos" element={<Services />} />
            <Route path="promocoes" element={<Promotions />} />
            <Route path="pacotes" element={<Packages />} />
            <Route path="pacotes-clientes" element={<ClientPackages />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="logs" element={<Logs />} />
            <Route path="perfil" element={<Profile />} />
            <Route path="configuracoes" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  )
}

export default App
