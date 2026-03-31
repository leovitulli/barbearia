import { useState, useEffect } from 'react'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'
import { Scissors, Star, Clock, Shield, Smartphone, Eye, EyeOff } from 'lucide-react'
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
    { icon: Clock, title: 'Agenda Inteligente', desc: 'Controle total dos horários e barbeiros em tempo real' },
    { icon: Smartphone, title: 'Agendamento via Telegram', desc: 'Clientes agendam direto pelo Telegram, sem complicação' },
    { icon: Star, title: 'Relatórios Completos', desc: 'Faturamento, comissões e desempenho em um só lugar' },
    { icon: Shield, title: 'Segurança Total', desc: 'Dados protegidos com criptografia e controle de acesso' },
  ]

  if (view === 'login') {
    return (
      <div className="min-h-screen flex" style={{ background: '#0A0A0A' }}>
        {/* Left Panel — Brand */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ borderRight: '1px solid #1A1A1A' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: '#C9A84C' }}>
              <Scissors className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-white tracking-widest text-sm uppercase">{companyName}</span>
          </div>

          <div>
            <h1 className="text-5xl font-black text-white leading-none mb-6" style={{ fontFamily: 'system-ui', letterSpacing: '-2px' }}>
              O SISTEMA <br />
              <span style={{ color: '#C9A84C' }}>DA SUA</span> <br />
              BARBEARIA.
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Gestão profissional de agendamentos, barbeiros e faturamento — tudo integrado.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="p-3" style={{ border: '1px solid #1A1A1A' }}>
                <f.icon className="w-4 h-4 mb-2" style={{ color: '#C9A84C' }} />
                <p className="text-white text-xs font-semibold">{f.title}</p>
                <p className="text-gray-500 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-9 h-9 flex items-center justify-center" style={{ background: '#C9A84C' }}>
                <Scissors className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-white tracking-widest text-xs uppercase">{companyName}</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">Acesso ao Sistema</h2>
            <p className="text-gray-500 text-sm mb-8">Digite suas credenciais para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 text-white text-sm outline-none transition-all"
                  style={{
                    background: '#111111',
                    border: '1px solid #222222',
                    color: 'white',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#C9A84C'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#222222'}
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase tracking-widest block mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 text-sm outline-none transition-all pr-12"
                    style={{
                      background: '#111111',
                      border: '1px solid #222222',
                      color: 'white',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#C9A84C'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#222222'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 text-sm" style={{ background: '#1A0A0A', border: '1px solid #3A1010', color: '#FF6B6B' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-bold text-sm uppercase tracking-widest transition-all"
                style={{
                  background: loading ? '#8A7030' : '#C9A84C',
                  color: '#000000',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Verificando...' : 'Entrar no Sistema'}
              </button>
            </form>

            <div className="mt-6 pt-6" style={{ borderTop: '1px solid #1A1A1A' }}>
              <button
                onClick={() => setView('landing')}
                className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
              >
                ← Voltar para apresentação
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Landing / Sales Page
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A', color: 'white' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid #141414' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#C9A84C' }}>
            <Scissors className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold tracking-widest text-xs uppercase text-white">{companyName}</span>
        </div>
        <button
          onClick={() => setView('login')}
          className="px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all"
          style={{ background: '#C9A84C', color: '#000000' }}
        >
          Acessar Sistema
        </button>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-4 pt-24 pb-20">
        <p className="text-xs uppercase tracking-widest mb-6" style={{ color: '#C9A84C' }}>
          Sistema de Gestão Profissional
        </p>
        <h1
          className="text-6xl md:text-8xl font-black leading-none mb-6"
          style={{ letterSpacing: '-3px', fontFamily: 'system-ui' }}
        >
          GESTÃO QUE<br />
          <span style={{ color: '#C9A84C' }}>CORTA RETO.</span>
        </h1>
        <p className="text-gray-400 max-w-md mb-10 leading-relaxed">
          Agenda inteligente, controle de barbeiros, faturamento em tempo real e agendamentos pelo Telegram. Tudo em um sistema.
        </p>
        <div className="flex gap-4 flex-col sm:flex-row">
          <button
            onClick={() => setView('login')}
            className="px-8 py-4 font-bold text-sm uppercase tracking-widest"
            style={{ background: '#C9A84C', color: '#000000' }}
          >
            Acessar Agora →
          </button>
          <a
            href="#features"
            className="px-8 py-4 font-bold text-sm uppercase tracking-widest text-white"
            style={{ border: '1px solid #333333' }}
          >
            Ver Funcionalidades
          </a>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 max-w-2xl mx-auto" style={{ borderTop: '1px solid #141414', borderBottom: '1px solid #141414' }}>
        {[
          { value: '100%', label: 'Online' },
          { value: '24/7', label: 'Disponível' },
          { value: '∞', label: 'Agendamentos' },
        ].map(({ value, label }) => (
          <div key={label} className="py-8 text-center" style={{ borderRight: '1px solid #141414' }}>
            <p className="text-3xl font-black" style={{ color: '#C9A84C' }}>{value}</p>
            <p className="text-gray-600 text-xs uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <div id="features" className="max-w-4xl mx-auto px-8 py-24">
        <p className="text-xs uppercase tracking-widest mb-12 text-center" style={{ color: '#C9A84C' }}>
          Funcionalidades
        </p>
        <div className="grid md:grid-cols-2 gap-px" style={{ background: '#141414' }}>
          {[
            {
              icon: Clock,
              title: 'Agenda em Tempo Real',
              desc: 'Visualize todos os agendamentos do dia, semana ou mês. Bloqueie horários, gerencie ausências e evite conflitos automaticamente.',
            },
            {
              icon: Smartphone,
              title: 'Agendamento via Telegram',
              desc: 'Seu cliente agenda pelo Telegram sem precisar ligar. O robô coleta as informações e cria o compromisso diretamente no sistema.',
            },
            {
              icon: Star,
              title: 'Dashboard & Relatórios',
              desc: 'Faturamento, ticket médio, barbeiro mais lucrativo, serviços mais solicitados. Decisões baseadas em dados reais.',
            },
            {
              icon: Shield,
              title: 'Controle de Acesso por Perfil',
              desc: 'Admin vê tudo. Barbeiro vê apenas sua agenda e comissões. Segurança granular sem complicação.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-8" style={{ background: '#0A0A0A' }}>
              <div className="w-10 h-10 flex items-center justify-center mb-4" style={{ background: '#141414' }}>
                <Icon className="w-5 h-5" style={{ color: '#C9A84C' }} />
              </div>
              <h3 className="text-white font-bold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Final */}
      <div className="text-center py-24 px-8" style={{ borderTop: '1px solid #141414' }}>
        <h2 className="text-4xl font-black mb-4">Pronto para começar?</h2>
        <p className="text-gray-500 mb-8 text-sm">Acesse o sistema agora com suas credenciais.</p>
        <button
          onClick={() => setView('login')}
          className="px-10 py-4 font-bold text-sm uppercase tracking-widest"
          style={{ background: '#C9A84C', color: '#000000' }}
        >
          Entrar no Sistema →
        </button>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 flex items-center justify-between" style={{ borderTop: '1px solid #141414' }}>
        <p className="text-gray-700 text-xs">{companyName} © {new Date().getFullYear()}</p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <p className="text-gray-700 text-xs">Sistema Online</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
