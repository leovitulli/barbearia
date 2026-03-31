import { useState, useEffect } from 'react'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'
import { Scissors, Star, Clock, Shield, Smartphone, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'landing' | 'login'>('landing')
  const [companyName, setCompanyName] = useState('San Patricio')
  const { login } = useSupabaseAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadCompanyInfo()
  }, [])

  const loadCompanyInfo = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'company_name')
        .single()
      if (data?.value) setCompanyName(data.value as string)
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const success = await login(email, password)
    if (success) {
      navigate('/')
    } else {
      setError('Email ou senha inválidos. Verifique suas credenciais.')
    }
    setLoading(false)
  }

  const features = [
    { icon: Clock, title: 'Agenda Inteligente', desc: 'Controle total dos horários em tempo real' },
    { icon: Smartphone, title: 'Agendamento via Telegram', desc: 'Automação direta com o cliente via chat' },
    { icon: Star, title: 'Relatórios Completos', desc: 'Faturamento e comissões integrados' },
    { icon: Shield, title: 'Segurança Total', desc: 'Dados protegidos e controle de acesso' },
  ]

  if (view === 'login') {
    return (
      <div className="min-h-screen flex bg-gray-50">
        {/* Left Panel — Brand */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-white border-r border-gray-200 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 flex items-center justify-center bg-primary rounded-xl shadow-sm text-primary-foreground transform transition-transform hover:scale-105">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-bold text-gray-900 tracking-widest text-sm uppercase">{companyName}</span>
          </div>

          <div className="relative z-10">
            <h1 className="text-5xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
              O SISTEMA <br />
              <span className="text-primary relative inline-block">
                DA SUA
                <div className="absolute -bottom-2 left-0 w-full h-1.5 bg-primary/20 rounded-full" />
              </span> <br />
              BARBEARIA.
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              Gestão profissional de agendamentos, barbeiros e faturamento — tudo num só lugar com uma interface premium.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 relative z-10">
            {features.map((f) => (
              <div key={f.title} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-1">{f.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <div className="w-10 h-10 flex items-center justify-center bg-primary rounded-xl shadow-sm text-primary-foreground">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="font-bold text-gray-900 tracking-widest text-xs uppercase">{companyName}</span>
            </div>

            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Acesso ao Sistema</h2>
              <p className="text-gray-500 text-sm">Digite suas credenciais para continuar sua gestão</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-gray-700 text-xs font-bold uppercase tracking-widest block mb-2">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-700 text-xs font-bold uppercase tracking-widest block mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-100 rounded-xl animate-in fade-in zoom-in duration-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  loading 
                    ? 'bg-primary/70 cursor-not-allowed text-white shadow-none' 
                    : 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5'
                }`}
              >
                {loading ? 'Verificando...' : (
                  <>
                    Entrar no Sistema
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <button
                onClick={() => setView('landing')}
                className="text-gray-400 text-sm font-medium hover:text-primary transition-colors inline-flex items-center gap-2"
              >
                ← Voltar para a apresentação
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Landing / Sales Page
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-primary/20">
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-primary rounded-xl text-primary-foreground shadow-sm">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-widest text-sm uppercase text-gray-900">{companyName}</span>
          </div>
          <button
            onClick={() => setView('login')}
            className="px-6 py-2.5 rounded-full text-sm font-bold transition-all bg-white border border-gray-200 text-gray-900 hover:border-primary hover:text-primary hover:shadow-sm"
          >
            Fazer Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background Gradients Modernos */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 mt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8 border border-primary/20">
            <Star className="w-3.5 h-3.5" />
            Sistema de Gestão Profissional
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-8 tracking-tight">
            Gestão inteligente que <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              eleva o nível
            </span> da sua barbearia.
          </h1>
          
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Abandone os papéis. Tenha uma agenda inteligente, controle financeiro absoluto e o agendamento via Telegram que os clientes modernos amam.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setView('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Acessar o Sistema
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all text-center"
            >
              Explorar Recursos
            </a>
          </div>
        </div>
      </main>

      {/* Stats Section Com Design Limpo */}
      <section className="bg-white border-y border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
          {[
            { value: '100%', label: 'Operação Online' },
            { value: '24/7', label: 'Disponibilidade' },
            { value: 'Auto', label: 'Bot no Telegram' },
            { value: 'Zero', label: 'Dor de cabeça' },
          ].map(({ value, label }, i) => (
            <div key={label} className={`text-center ${i % 2 === 0 ? '' : 'border-l border-gray-100'}`}>
              <p className="text-4xl font-black text-gray-900 mb-2">{value}</p>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid Modern */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Tudo que você precisa em um só lugar</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Ferramentas desenhadas com foco em produtividade e conversão.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Clock,
                title: 'Agenda Sincronizada',
                desc: 'Visualize todos os compromissos, bloqueie horários e evite conflitos de agenda automaticamente em uma interface fluida.',
              },
              {
                icon: Smartphone,
                title: 'Robô de Agendamento Telegram',
                desc: 'Revolucione o atendimento. Clientes escolhem serviços e barbeiros diretamente pelo Telegram 24h por dia.',
              },
              {
                icon: Star,
                title: 'Métricas Inteligentes',
                desc: 'Saiba exatamente quanto sua barbearia produziu. Acompanhe comissões de forma transparente e em tempo real.',
              },
              {
                icon: Shield,
                title: 'Gestão de Barbeiros',
                desc: 'Perfis de acesso separados. Barbeiros gerenciam apenas suas próprias agendas enquanto você tem visão do todo.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <Icon className="w-6 h-6 text-gray-600 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-white border-t border-gray-200 py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">Prepare sua barbearia para o futuro</h2>
          <p className="text-lg text-gray-500 mb-10">Simplifique sua gestão hoje mesmo e entregue a melhor experiência para seus clientes.</p>
          <button
            onClick={() => setView('login')}
            className="px-10 py-5 rounded-xl font-bold text-sm uppercase tracking-widest bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all inline-flex items-center gap-2"
          >
            Entrar no Sistema Agora
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer Minimal */}
      <footer className="bg-gray-50 border-t border-gray-200 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Scissors className="w-4 h-4 text-primary" />
            <p className="text-gray-900 text-sm font-bold uppercase tracking-widest">{companyName} <span className="text-gray-400 font-normal ml-2">© {new Date().getFullYear()}</span></p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Sistema Operacional</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
