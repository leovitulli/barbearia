import React, { useState, useEffect } from 'react'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'
import { Scissors, Star, Shield, MessageCircle, Eye, EyeOff, ArrowRight, Zap, Check, CalendarDays, Users, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Paleta Oficial San Patricio:
// Fundo principal: #0C231E (Verde escuro profundo)
// Laranja Choque (Raio): #EB4924
// Texto Creme: #F4EFE6

const brandColors = {
  bg: '#0C231E',
  orange: '#EB4924',
  cream: '#F4EFE6',
  darkerBg: '#081714',
  cardBg: '#11332C'
}

// --- Animação do WhatsApp e Sistema ---
const WhatsAppSimulator = () => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const sequence = async () => {
      while (true) {
        setStep(0)
        await new Promise(r => setTimeout(r, 2000))
        setStep(1)
        await new Promise(r => setTimeout(r, 1500))
        setStep(2)
        await new Promise(r => setTimeout(r, 1500))
        setStep(3)
        await new Promise(r => setTimeout(r, 2000))
        setStep(4)
        await new Promise(r => setTimeout(r, 1000))
        setStep(5)
        await new Promise(r => setTimeout(r, 5000))
      }
    }
    sequence()
  }, [])

  return (
    <div className="flex flex-col lg:flex-row items-center gap-12 justify-center w-full max-w-5xl mx-auto my-16">
      
      {/* Phone Mockup */}
      <div className="w-[300px] h-[600px] bg-white rounded-[3rem] shadow-2xl shadow-black/50 border-[8px] border-[#081714] relative overflow-hidden flex flex-col transform transition-transform hover:scale-105 duration-500">
        <div className="absolute top-0 w-full h-6 flex justify-center z-20">
          <div className="w-1/3 h-full bg-[#081714] rounded-b-xl" />
        </div>
        
        {/* Header App - Dark Green to match brand slightly or classic Whatsapp */}
        <div className="bg-[#075E54] text-white p-4 pt-8 flex items-center gap-3 shadow-md z-10">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">San Patricio Bot</p>
            <p className="text-[10px] text-green-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#E5DDD5] p-4 flex flex-col gap-3 overflow-hidden text-sm relative" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(229, 221, 213, 0.9)' }}>
          {step >= 1 && (
            <div className="self-end bg-[#DCF8C6] text-black px-3 py-2 rounded-lg rounded-tr-none max-w-[80%] shadow-sm animate-in slide-in-from-right-4 fade-in duration-300">
              <p>Fala meu querido, tem horário pra corte hoje às 15h?</p>
              <p className="text-[9px] text-gray-500 text-right mt-1">10:42 <Check className="inline w-3 h-3 text-blue-500" /><Check className="inline w-3 h-3 text-blue-500 -ml-2" /></p>
            </div>
          )}
          
          {step === 2 && (
            <div className="self-start bg-white text-black px-4 py-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm flex gap-1 items-center animate-in fade-in">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          )}

          {step >= 3 && (
            <div className="self-start bg-white text-black px-3 py-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm animate-in slide-in-from-left-4 fade-in duration-300">
              <p>Fala guerreiro! Temos sim. O Carlos está livre às 15:00. Mando brasa no agendamento?</p>
              <p className="text-[9px] text-gray-400 text-right mt-1">10:42</p>
            </div>
          )}

          {step >= 4 && (
            <div className="self-end bg-[#DCF8C6] text-black px-3 py-2 rounded-lg rounded-tr-none max-w-[80%] shadow-sm animate-in slide-in-from-right-4 fade-in duration-300 mt-2">
              <p>Manda! Tmj ⚡</p>
              <p className="text-[9px] text-gray-500 text-right mt-1">10:43 <Check className="inline w-3 h-3 text-blue-500" /><Check className="inline w-3 h-3 text-blue-500 -ml-2" /></p>
            </div>
          )}

          {step >= 5 && (
            <div className="self-start bg-white text-black px-3 py-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm animate-in slide-in-from-left-4 fade-in duration-300">
              <p>Fechado! ✅ <b>Corte</b> garantido com o <b>Carlos</b> às <b>15:00</b>. Até lá!</p>
              <p className="text-[9px] text-gray-400 text-right mt-1">10:43</p>
            </div>
          )}
        </div>
      </div>

      {/* Connection Arrows */}
      <div className="hidden lg:flex flex-col items-center gap-2" style={{ color: brandColors.orange }}>
        <div className={`transition-all duration-500 ${step >= 5 ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}>
          <div className="flex items-center gap-2">
            <span className="w-16 h-1 rounded-full relative overflow-hidden" style={{ backgroundColor: brandColors.darkerBg }}>
               {step >= 5 && <span className="absolute left-0 top-0 h-full w-full animate-[translate-x_1s_linear_infinite]" style={{ backgroundColor: brandColors.orange }} />}
            </span>
            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg shadow-[#EB4924]/20" style={{ borderColor: brandColors.orange, backgroundColor: 'rgba(235, 73, 36, 0.1)' }}>
               <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <span className="w-16 h-1 rounded-full relative overflow-hidden" style={{ backgroundColor: brandColors.darkerBg }}>
               {step >= 5 && <span className="absolute left-0 top-0 h-full w-full animate-[translate-x_1s_linear_infinite]" style={{ backgroundColor: brandColors.orange }} />}
            </span>
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] mt-3" style={{ color: brandColors.cream }}>Sincronização Ativa</p>
        </div>
      </div>

      {/* System Dashboard Mockup - Dark Mode match San Patricio! */}
      <div className="w-full max-w-[450px] rounded-3xl shadow-2xl overflow-hidden transform transition-transform hover:scale-105 duration-500 border" style={{ backgroundColor: brandColors.cardBg, borderColor: brandColors.darkerBg }}>
        <div className="border-b p-4 flex justify-between items-center" style={{ borderColor: 'rgba(244, 239, 230, 0.1)' }}>
          <div>
            <h3 className="font-bold text-lg" style={{ color: brandColors.cream }}>Agenda do Dia</h3>
            <p className="text-xs text-white/50">Admin Painel</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: brandColors.orange, color: '#081714' }}>
             <CalendarDays className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 space-y-3 relative overflow-hidden h-[400px]">
          
          <div className="p-4 rounded-xl flex items-center justify-between opacity-40 border" style={{ backgroundColor: brandColors.darkerBg, borderColor: 'rgba(255,255,255,0.05)' }}>
             <div><p className="font-bold text-sm" style={{ color: brandColors.cream }}>14:00 - Rafael</p><p className="text-xs text-white/40 mt-1">Barba (30min) • Tiago</p></div>
             <div className="px-2 py-1 text-[10px] font-bold rounded text-white/50 bg-white/5">Concluído</div>
          </div>

          <div className="p-4 rounded-xl flex items-center justify-between border" style={{ backgroundColor: brandColors.darkerBg, borderColor: 'rgba(255,255,255,0.1)' }}>
             <div><p className="font-bold text-sm" style={{ color: brandColors.cream }}>14:30 - Lucas</p><p className="text-xs text-white/40 mt-1">Corte & Barba (1h) • Marcelo</p></div>
             <div className="px-3 py-1.5 text-[10px] font-black tracking-wider rounded animate-pulse" style={{ backgroundColor: brandColors.orange, color: '#000' }}>Em Cadeira</div>
          </div>

          {/* New Appointment drops in at step 5 */}
          <div className={`absolute w-[calc(100%-2rem)] transition-all duration-700 ease-out border-l-4 ${step >= 5 ? 'translate-y-[170px] opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95'} p-4 rounded-xl flex items-center gap-3 shadow-2xl`} style={{ backgroundColor: brandColors.darkerBg, borderColor: brandColors.orange }}>
             <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                   <p className="font-bold text-base" style={{ color: brandColors.cream }}>15:00 - Cliente Whats</p>
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black tracking-wider" style={{ backgroundColor: 'rgba(235, 73, 36, 0.15)', color: brandColors.orange }}>
                      <MessageCircle className="w-3.5 h-3.5" /> NOVO
                   </div>
                </div>
                <p className="text-sm font-medium text-white/60">Corte de Cabelo</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                   <div className="w-6 h-6 rounded-md overflow-hidden ring-1 ring-white/20">
                      <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="Carlos" />
                   </div>
                   <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: brandColors.orange }}>Barbeiro: Carlos</p>
                </div>
             </div>
          </div>
          
          <div className="p-4 border border-dashed rounded-xl flex items-center justify-center absolute top-[185px] w-[calc(100%-2rem)] h-[90px] -z-10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
             <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/20">15:00 Livre</p>
          </div>

        </div>
      </div>
    </div>
  )
}

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
      setError('Credenciais inválidas.')
    }
    setLoading(false)
  }

  // --- Tela de Login ---
  if (view === 'login') {
    return (
      <div className="min-h-screen flex selection:bg-[#EB4924]/30" style={{ backgroundColor: brandColors.bg }}>
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 border-r" style={{ borderColor: brandColors.darkerBg }}>
          {/* Fundo dinâmico com raio gigante escuro */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
             <Zap className="w-[120%] h-[120%] text-white -rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl shadow-lg" style={{ backgroundColor: brandColors.orange, color: brandColors.darkerBg }}>
                <Scissors className="w-6 h-6" />
              </div>
              <span className="font-black tracking-[0.2em] text-sm uppercase" style={{ color: brandColors.cream }}>{companyName}</span>
            </div>
          </div>
          <div className="relative z-10 max-w-lg mb-20">
             <span className="inline-block text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: brandColors.orange }}>Acesso Restrito</span>
             <h1 className="text-6xl font-black leading-[0.9] tracking-tighter mb-6 uppercase" style={{ color: brandColors.cream }}>
               O Controle <br/>Da Máquina.
             </h1>
             <p className="text-lg font-light leading-relaxed max-w-md text-white/50">
               Todas as lâminas. Todas as comissões. Todo o fluxo. O comando da barbearia está em suas mãos.
             </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="w-full max-w-[420px] p-10 rounded-[2rem] shadow-2xl relative overflow-hidden border" style={{ backgroundColor: brandColors.cardBg, borderColor: brandColors.darkerBg }}>
            <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] mix-blend-screen pointer-events-none" style={{ backgroundColor: brandColors.orange, opacity: 0.15 }}></div>
            
            <div className="lg:hidden flex justify-center mb-10">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl shadow-xl hover:scale-105 transition-transform" style={{ backgroundColor: brandColors.orange, color: brandColors.darkerBg }}>
                <Scissors className="w-8 h-8" />
              </div>
            </div>

            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black mb-2 uppercase tracking-tight" style={{ color: brandColors.cream }}>Autenticação</h2>
              <p className="text-sm text-white/40">Entre com seu e-mail de acesso.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] block mb-3" style={{ color: brandColors.orange }}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sanpatricio.com"
                  required
                  className="w-full px-4 py-4 rounded-xl text-sm outline-none transition-all placeholder:text-white/20 text-white border-2 focus:ring-4"
                  style={{ backgroundColor: brandColors.darkerBg, borderColor: 'transparent', '--tw-ring-color': 'rgba(235, 73, 36, 0.2)' } as any}
                  onFocus={(e) => e.target.style.borderColor = brandColors.orange}
                  onBlur={(e) => e.target.style.borderColor = 'transparent'}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] block mb-3" style={{ color: brandColors.orange }}>Senha Secreta</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-4 rounded-xl text-sm outline-none transition-all placeholder:text-white/20 text-white border-2 focus:ring-4 pr-12"
                    style={{ backgroundColor: brandColors.darkerBg, borderColor: 'transparent', '--tw-ring-color': 'rgba(235, 73, 36, 0.2)' } as any}
                    onFocus={(e) => e.target.style.borderColor = brandColors.orange}
                    onBlur={(e) => e.target.style.borderColor = 'transparent'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-white transition-colors p-1 text-white/40"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 text-xs font-bold rounded-xl animate-in fade-in" style={{ backgroundColor: '#451717', color: '#ff6b6b' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all mt-8 flex items-center justify-center gap-3 relative overflow-hidden group"
                style={{ backgroundColor: brandColors.orange, color: brandColors.darkerBg }}
              >
                 <div className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                {loading ? 'Processando...' : (
                   <>Acessar Sistema <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <button
              onClick={() => setView('landing')}
              className="mt-10 text-xs font-bold uppercase tracking-[0.1em] text-white/30 hover:text-white transition-colors w-full text-center"
            >
              ← Retornar à página inicial
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Landing Page Estilo San Patricio Oficial ---
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#EB4924]/30 overflow-x-hidden" style={{ backgroundColor: brandColors.bg }}>
      
      {/* Navbar Seamless */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-[#0C231E]/80 backdrop-blur-xl border-b" style={{ borderColor: 'rgba(244, 239, 230, 0.05)' }}>
        <div className="max-w-7xl mx-auto px-6 h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: brandColors.orange, color: brandColors.darkerBg }}>
               <Zap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
               <span className="font-extrabold tracking-tight text-xl leading-none" style={{ color: brandColors.cream }}>San Patricio</span>
               <span className="font-bold tracking-[0.3em] text-[8px] uppercase mt-0.5" style={{ color: brandColors.orange }}>Barbearia • Desde 2019</span>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setView('login')}
              className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.1em] transition-all hover:scale-105 shadow-[0_0_20px_rgba(235,73,36,0.3)] hover:shadow-[0_0_30px_rgba(235,73,36,0.5)]"
              style={{ backgroundColor: brandColors.orange, color: brandColors.darkerBg }}
            >
              Acessar Painel
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Extremamente Vintage/Elétrico */}
      <main className="pt-40 pb-24 px-6 relative overflow-hidden border-b" style={{ borderColor: brandColors.darkerBg }}>
        {/* Raio Gigante no Fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] flex items-center justify-center opacity-5 pointer-events-none">
           <Zap style={{ width: '100%', height: '100%', color: brandColors.orange, transform: 'rotate(-15deg)' }} />
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none" style={{ backgroundColor: brandColors.orange, opacity: 0.15 }} />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000">
             <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-8 border" style={{ backgroundColor: 'rgba(235, 73, 36, 0.1)', borderColor: 'rgba(235, 73, 36, 0.2)', color: brandColors.cream }}>
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Elevando sua autoestima</span>
             </div>
             
             {/* Tipografia mesclando o Clássico e o Bold */}
             <div className="relative mb-12">
               <h1 className="text-[5rem] lg:text-[8rem] font-black leading-[0.85] tracking-tighter uppercase relative z-20" style={{ color: brandColors.cream }}>
                 MÁQUINA DE <br/>
                 <span style={{ color: brandColors.orange }}>CORTAR.</span>
               </h1>
             </div>
             
             <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light" style={{ color: 'rgba(244, 239, 230, 0.6)' }}>
               Agenda automática pelo <strong style={{ color: brandColors.cream }}>WhatsApp</strong>, comissões na ponta do lápis e controle absoluto. O software criado para barbearias de verdade.
             </p>
             
             <button
               onClick={() => setView('login')}
               className="group relative px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all overflow-hidden inline-flex items-center gap-3 hover:-translate-y-1"
               style={{ backgroundColor: brandColors.cream, color: brandColors.darkerBg }}
             >
               <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">Entrar na Pista <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
               <div className="absolute inset-0 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" style={{ backgroundColor: brandColors.orange }}></div>
             </button>
          </div>
        </div>
      </main>

      {/* ÁREA DE SIMULAÇÃO (Easysalon vibe) */}
      <section className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-center mb-8">
             <h2 className="text-4xl font-black uppercase tracking-tighter mb-4" style={{ color: brandColors.cream }}>Agendamento Sem Fricção</h2>
             <p className="text-sm font-medium uppercase tracking-[0.2em] max-w-2xl mx-auto" style={{ color: brandColors.orange }}>O cliente manda um WhatsApp. O sistema faz o resto.</p>
          </div>
          <WhatsAppSimulator />
      </section>

      {/* Grid de Imagens: Barbeiros & Barbearia (Estúdios de alta performance) */}
      <section className="py-32 px-6 border-t" style={{ backgroundColor: brandColors.darkerBg, borderColor: 'rgba(244, 239, 230, 0.05)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
             <div className="flex-1 space-y-8">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center transform -rotate-6" style={{ backgroundColor: brandColors.orange, color: brandColors.darkerBg }}>
                   <Users className="w-10 h-10" />
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase" style={{ color: brandColors.cream }}>
                  A<br/>EQUIPE<br/><span style={{ color: brandColors.orange }}>AFINADA.</span>
                </h2>
                <p className="text-xl leading-relaxed font-light" style={{ color: 'rgba(244, 239, 230, 0.6)' }}>
                  Apresente seu time como os astros que eles são. Cada barbeiro tem seu perfil, controla sua agenda direto do bolso e ganha estrelas a cada corte perfeito.
                </p>
                <div className="h-px w-full" style={{ backgroundColor: 'rgba(244, 239, 230, 0.1)' }}></div>
                <div className="flex gap-4">
                  <div className="p-4 rounded-2xl flex-1 border" style={{ backgroundColor: brandColors.cardBg, borderColor: 'rgba(255,255,255,0.05)' }}>
                     <h4 className="text-3xl font-black mb-1" style={{ color: brandColors.orange }}>100%</h4>
                     <p className="text-[10px] uppercase font-bold tracking-[0.1em]" style={{ color: brandColors.cream }}>Comissões Exatas</p>
                  </div>
                  <div className="p-4 rounded-2xl flex-1 border" style={{ backgroundColor: brandColors.cardBg, borderColor: 'rgba(255,255,255,0.05)' }}>
                     <h4 className="text-3xl font-black mb-1" style={{ color: brandColors.orange }}>24h</h4>
                     <p className="text-[10px] uppercase font-bold tracking-[0.1em]" style={{ color: brandColors.cream }}>Marcação Online</p>
                  </div>
                </div>
             </div>

             <div className="flex-1 relative w-full lg:h-[600px] flex items-center justify-center">
                {/* Master Image */}
                <div className="relative w-full max-w-[400px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 aspect-[3/4] border-4 rotate-3 transform hover:rotate-0 transition-all duration-500" style={{ borderColor: brandColors.cardBg }}>
                   <img className="w-full h-full object-cover scale-110" src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Interior Barbearia" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                   <div className="absolute bottom-8 left-8">
                      <Zap className="w-8 h-8 mb-2" style={{ color: brandColors.orange }} />
                      <p className="font-black text-2xl uppercase tracking-tighter" style={{ color: brandColors.cream }}>A Casa do Corte</p>
                   </div>
                </div>

                {/* Floating Barber Avatars */}
                <div className="absolute -left-6 lg:left-0 top-1/4 z-20 p-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce border" style={{ backgroundColor: brandColors.bg, borderColor: brandColors.cardBg }}>
                   <div className="w-16 h-16 rounded-xl overflow-hidden border-2" style={{ borderColor: brandColors.orange }}>
                      <img src="https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=200&h=200&fit=crop" className="w-full h-full object-cover" alt="Marcelo" />
                   </div>
                   <div className="pr-4">
                      <p className="font-bold text-base" style={{ color: brandColors.cream }}>Marcelo</p>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-white/40">Master Barber</p>
                      <div className="flex" style={{ color: brandColors.orange }}><Star className="fill-current w-3 h-3"/><Star className="fill-current w-3 h-3"/><Star className="fill-current w-3 h-3"/><Star className="fill-current w-3 h-3"/><Star className="fill-current w-3 h-3"/></div>
                   </div>
                </div>

                <div className="absolute -right-6 lg:right-0 bottom-1/4 z-20 p-3 rounded-2xl shadow-2xl flex items-center gap-4 border" style={{ backgroundColor: brandColors.bg, borderColor: brandColors.cardBg, animation: 'bounce 3s infinite reverse' }}>
                   <div className="pr-2 pl-4 text-right">
                      <p className="font-bold text-base" style={{ color: brandColors.cream }}>Tiago</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-white/40">Especialista</p>
                      <p className="text-xs font-bold" style={{ color: brandColors.orange }}>Fade Premium</p>
                   </div>
                   <div className="w-16 h-16 rounded-xl overflow-hidden border-2" style={{ borderColor: brandColors.orange }}>
                      <img src="https://images.unsplash.com/photo-1583713915124-7ee96d747209?w=200&h=200&fit=crop" className="w-full h-full object-cover" alt="Tiago" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Benefícios Focados */}
      <section className="py-32 px-6 relative border-t" style={{ borderColor: brandColors.darkerBg }}>
         <div className="max-w-7xl mx-auto relative z-10 text-center">
            <h2 className="text-5xl md:text-7xl font-black mb-20 tracking-tighter uppercase" style={{ color: brandColors.cream }}>Vantagens da <span style={{ color: brandColors.orange }}>Lâmina.</span></h2>
            <div className="grid md:grid-cols-3 gap-6">
               <div className="border p-10 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300 text-left" style={{ backgroundColor: brandColors.cardBg, borderColor: brandColors.darkerBg }}>
                  <TrendingUp className="w-12 h-12 mb-8" style={{ color: brandColors.orange }} />
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter" style={{ color: brandColors.cream }}>Lucro no Detalhe</h3>
                  <p className="font-light leading-relaxed text-sm" style={{ color: 'rgba(244, 239, 230, 0.6)' }}>Zero cadeiras vazias. O bot cobra os clientes, agenda em horários de buraco e maximiza o faturamento sem você mover um dedo.</p>
               </div>
               <div className="border p-10 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300 transform md:-translate-y-8 text-left" style={{ backgroundColor: brandColors.orange, borderColor: brandColors.orange }}>
                  <MessageCircle className="w-12 h-12 mb-8" style={{ color: brandColors.darkerBg }} />
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter" style={{ color: brandColors.darkerBg }}>O Poder do Whats</h3>
                  <p className="font-semibold leading-relaxed text-sm" style={{ color: 'rgba(8, 23, 20, 0.8)' }}>Esqueça apps genéricos. Seus clientes marcam corte pelo mensageiro mais usado do mundo. É agilidade que converte na hora.</p>
               </div>
               <div className="border p-10 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300 text-left" style={{ backgroundColor: brandColors.cardBg, borderColor: brandColors.darkerBg }}>
                  <Shield className="w-12 h-12 mb-8" style={{ color: brandColors.orange }} />
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter" style={{ color: brandColors.cream }}>À Prova de Falhas</h3>
                  <p className="font-light leading-relaxed text-sm" style={{ color: 'rgba(244, 239, 230, 0.6)' }}>Servidores potentes, banco de dados isolado e segurança máxima. Seus dados financeiros e de clientes trancados a sete chaves.</p>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 text-center border-t border-b" style={{ backgroundColor: brandColors.cardBg, borderColor: brandColors.darkerBg }}>
        <div className="max-w-[1400px] mx-auto">
          <Zap className="w-16 h-16 mx-auto mb-8 animate-pulse" style={{ color: brandColors.orange }} />
          <h2 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter mb-12 uppercase" style={{ color: brandColors.cream }}>
            O SEU NOVO <br /> EMPREGADO DO MÊS.
          </h2>
          <button
            onClick={() => setView('login')}
            className="px-14 py-6 rounded-full font-black text-sm uppercase tracking-[0.2em] transform transition-transform hover:scale-110 shadow-2xl"
            style={{ backgroundColor: brandColors.orange, color: brandColors.darkerBg }}
          >
            Fazer Login
          </button>
        </div>
      </section>

      {/* Footer Minimalista e Brutalista */}
      <footer className="py-12 px-6" style={{ backgroundColor: brandColors.darkerBg }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-4">
              <Scissors className="w-6 h-6" style={{ color: brandColors.orange }} />
              <div className="flex flex-col">
                 <span className="font-black tracking-tight text-xl leading-none uppercase" style={{ color: brandColors.cream }}>{companyName}</span>
                 <span className="font-bold tracking-[0.3em] text-[8px] uppercase mt-1 text-white/30">Elevando sua autoestima</span>
              </div>
           </div>
           <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border" style={{ backgroundColor: brandColors.bg, borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: brandColors.orange }}></span>
                 <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: brandColors.orange }}></span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em]" style={{ color: brandColors.cream }}>Sistemas Online</p>
           </div>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
