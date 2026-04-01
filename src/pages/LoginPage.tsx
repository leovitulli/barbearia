import React, { useState, useEffect } from 'react'
import { useSupabaseAuthStore } from '../store/supabaseAuthStore'
import { Scissors, Star, Shield, MessageCircle, Eye, EyeOff, ArrowRight, Zap, Check, CalendarDays, Users, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
      <div className="w-[300px] h-[600px] bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border-[8px] border-slate-900 relative overflow-hidden flex flex-col transform transition-transform hover:scale-105 duration-500">
        <div className="absolute top-0 w-full h-6 flex justify-center z-20">
          <div className="w-1/3 h-full bg-slate-900 rounded-b-xl" />
        </div>
        
        {/* Header App - Classic Whatsapp Green */}
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
            <div className="self-end bg-[#DCF8C6] text-slate-900 px-3 py-2 rounded-lg rounded-tr-none max-w-[80%] shadow-sm animate-in slide-in-from-right-4 fade-in duration-300">
              <p>Fala meu querido, tem horário pra corte hoje às 15h?</p>
              <p className="text-[9px] text-slate-500 text-right mt-1">10:42 <Check className="inline w-3 h-3 text-blue-500" /><Check className="inline w-3 h-3 text-blue-500 -ml-2" /></p>
            </div>
          )}
          
          {step === 2 && (
            <div className="self-start bg-white text-slate-900 px-4 py-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm flex gap-1 items-center animate-in fade-in">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
            </div>
          )}

          {step >= 3 && (
            <div className="self-start bg-white text-slate-900 px-3 py-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm animate-in slide-in-from-left-4 fade-in duration-300">
              <p>Fala guerreiro! Temos sim. O Carlos está livre às 15:00. Mando brasa no agendamento?</p>
              <p className="text-[9px] text-slate-400 text-right mt-1">10:42</p>
            </div>
          )}

          {step >= 4 && (
            <div className="self-end bg-[#DCF8C6] text-slate-900 px-3 py-2 rounded-lg rounded-tr-none max-w-[80%] shadow-sm animate-in slide-in-from-right-4 fade-in duration-300 mt-2">
              <p>Manda! Tmj ⚡</p>
              <p className="text-[9px] text-slate-500 text-right mt-1">10:43 <Check className="inline w-3 h-3 text-blue-500" /><Check className="inline w-3 h-3 text-blue-500 -ml-2" /></p>
            </div>
          )}

          {step >= 5 && (
            <div className="self-start bg-white text-slate-900 px-3 py-2 rounded-lg rounded-tl-none max-w-[80%] shadow-sm animate-in slide-in-from-left-4 fade-in duration-300">
              <p>Fechado! ✅ <b>Corte</b> garantido com o <b>Carlos</b> às <b>15:00</b>. Até lá!</p>
              <p className="text-[9px] text-slate-400 text-right mt-1">10:43</p>
            </div>
          )}
        </div>
      </div>

      {/* Connection Arrows */}
      <div className="hidden lg:flex flex-col items-center gap-2 text-primary">
        <div className={`transition-all duration-500 ${step >= 5 ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`}>
          <div className="flex items-center gap-2">
            <span className="w-16 h-1 rounded-full relative overflow-hidden bg-slate-200">
               {step >= 5 && <span className="absolute left-0 top-0 h-full w-full animate-[translate-x_1s_linear_infinite] bg-primary" />}
            </span>
            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg shadow-primary/20 border-primary bg-primary/10">
               <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <span className="w-16 h-1 rounded-full relative overflow-hidden bg-slate-200">
               {step >= 5 && <span className="absolute left-0 top-0 h-full w-full animate-[translate-x_1s_linear_infinite] bg-primary" />}
            </span>
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] mt-3 text-slate-500">Sincronização Ativa</p>
        </div>
      </div>

      {/* System Dashboard Mockup - Bright clean UI matching the system */}
      <div className="w-full max-w-[450px] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden transform transition-transform hover:scale-105 duration-500 border border-slate-100 bg-white">
        <div className="border-b border-slate-100 p-4 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Agenda do Dia</h3>
            <p className="text-xs text-slate-500">Admin Painel</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-primary text-primary-foreground">
             <CalendarDays className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 space-y-3 relative overflow-hidden h-[400px]">
          
          <div className="p-4 rounded-xl flex items-center justify-between opacity-50 border border-slate-100 bg-slate-50">
             <div><p className="font-bold text-sm text-slate-900">14:00 - Rafael</p><p className="text-xs text-slate-500 mt-1">Barba (30min) • Tiago</p></div>
             <div className="px-2 py-1 text-[10px] font-bold rounded text-slate-500 bg-slate-200">Concluído</div>
          </div>

          <div className="p-4 rounded-xl flex items-center justify-between border border-primary/20 bg-primary/5">
             <div><p className="font-bold text-sm text-slate-900">14:30 - Lucas</p><p className="text-xs text-primary/70 mt-1">Corte & Barba (1h) • Marcelo</p></div>
             <div className="px-3 py-1.5 text-[10px] font-black tracking-wider rounded animate-pulse bg-primary text-primary-foreground">Em Cadeira</div>
          </div>

          {/* New Appointment drops in at step 5 */}
          <div className={`absolute w-[calc(100%-2rem)] transition-all duration-700 ease-out border-l-4 ${step >= 5 ? 'translate-y-[170px] opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95'} p-4 rounded-xl flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.08)] bg-white border-l-primary border-y border-r border-slate-100`}>
             <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                   <p className="font-bold text-base text-slate-900">15:00 - Cliente Whats</p>
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black tracking-wider bg-green-50 text-green-600 border border-green-200">
                      <MessageCircle className="w-3.5 h-3.5" /> NOVO
                   </div>
                </div>
                <p className="text-sm font-medium text-slate-600">Corte de Cabelo</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                   <div className="w-6 h-6 rounded-md overflow-hidden ring-1 ring-slate-200">
                      <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="Carlos" />
                   </div>
                   <p className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Barbeiro: <span className="text-primary">Carlos</span></p>
                </div>
             </div>
          </div>
          
          <div className="p-4 border border-dashed rounded-xl flex items-center justify-center absolute top-[185px] w-[calc(100%-2rem)] h-[90px] -z-10 border-slate-200">
             <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-300">15:00 Livre</p>
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
      <div className="min-h-screen flex selection:bg-primary/30 bg-slate-50">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 border-r border-slate-200 bg-white">
          {/* Fundo dinâmico com raio gigante claro */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
             <Zap className="w-[120%] h-[120%] text-slate-900 -rotate-12" />
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] mix-blend-multiply pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl shadow-lg bg-primary text-primary-foreground">
                <Scissors className="w-6 h-6" />
              </div>
              <span className="font-black tracking-[0.2em] text-sm uppercase text-slate-900">{companyName}</span>
            </div>
          </div>
          <div className="relative z-10 max-w-lg mb-20">
             <span className="inline-block text-xs font-bold tracking-[0.3em] uppercase mb-4 text-primary">Acesso Restrito</span>
             <h1 className="text-6xl font-black leading-[0.9] tracking-tighter mb-6 uppercase text-slate-900">
               O Controle <br/>Da Máquina.
             </h1>
             <p className="text-lg font-light leading-relaxed max-w-md text-slate-500">
               Todas as lâminas. Todas as comissões. Todo o fluxo. O comando da barbearia está em suas mãos.
             </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 relative bg-slate-50">
          <div className="w-full max-w-[420px] p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden border border-slate-100 bg-white">
            <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] mix-blend-multiply pointer-events-none bg-primary opacity-10"></div>
            
            <div className="lg:hidden flex justify-center mb-10">
              <div className="w-16 h-16 flex items-center justify-center rounded-2xl shadow-xl hover:scale-105 transition-transform bg-primary text-primary-foreground">
                <Scissors className="w-8 h-8" />
              </div>
            </div>

            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black mb-2 uppercase tracking-tight text-slate-900">Autenticação</h2>
              <p className="text-sm text-slate-500">Entre com seu e-mail de acesso.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] block mb-3 text-slate-400">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sanpatricio.com"
                  required
                  className="w-full px-4 py-4 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 text-slate-900 border-2 border-slate-100 bg-slate-50 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] block mb-3 text-slate-400">Senha Secreta</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-4 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 text-slate-900 border-2 border-slate-100 bg-slate-50 focus:border-primary focus:ring-4 focus:ring-primary/10 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-primary transition-colors p-1 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 text-xs font-bold rounded-xl animate-in fade-in bg-red-50 text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all mt-8 flex items-center justify-center gap-3 relative overflow-hidden group bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1"
              >
                 <div className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                {loading ? 'Processando...' : (
                   <>Acessar Sistema <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <button
              onClick={() => setView('landing')}
              className="mt-10 text-xs font-bold uppercase tracking-[0.1em] text-slate-400 hover:text-primary transition-colors w-full text-center"
            >
              ← Retornar à página inicial
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Landing Page Estilo Clean System Oficial ---
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/20 overflow-x-hidden bg-slate-50">
      
      {/* Navbar Seamless */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-primary text-primary-foreground">
               <Zap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
               <span className="font-extrabold tracking-tight text-xl leading-none text-slate-900">San Patricio</span>
               <span className="font-bold tracking-[0.3em] text-[8px] uppercase mt-0.5 text-primary">Barbearia • Desde 2019</span>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setView('login')}
              className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.1em] transition-all hover:scale-105 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 bg-primary text-primary-foreground"
            >
              Acessar Painel
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Extremamente Vintage/Elétrico adaptado para luz */}
      <main className="pt-40 pb-24 px-6 relative overflow-hidden border-b border-slate-200 bg-white">
        {/* Raio Gigante no Fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] flex items-center justify-center opacity-[0.03] pointer-events-none">
           <Zap style={{ width: '100%', height: '100%', color: 'currentColor', transform: 'rotate(-15deg)' }} className="text-primary" />
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none bg-primary/10 mix-blend-multiply" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000">
             <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-8 border border-primary/20 bg-primary/5 text-primary">
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Elevando sua autoestima</span>
             </div>
             
             {/* Tipografia mesclando o Clássico e o Bold */}
             <div className="relative mb-12">
               <h1 className="text-[5rem] lg:text-[8rem] font-black leading-[0.85] tracking-tighter uppercase relative z-20 text-slate-900">
                 MÁQUINA DE <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">CORTAR.</span>
               </h1>
             </div>
             
             <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light text-slate-600">
               Agenda automática pelo <strong className="text-slate-900 font-bold">WhatsApp</strong>, comissões na ponta do lápis e controle absoluto. O software criado para barbearias de verdade.
             </p>
             
             <button
               onClick={() => setView('login')}
               className="group relative px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all overflow-hidden inline-flex items-center gap-3 hover:-translate-y-1 bg-slate-900 text-white shadow-xl hover:shadow-2xl"
             >
               <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">Entrar na Pista <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
               <div className="absolute inset-0 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 bg-primary"></div>
             </button>
          </div>
        </div>
      </main>

      {/* ÁREA DE SIMULAÇÃO (Easysalon vibe) */}
      <section className="py-24 px-6 relative overflow-hidden bg-slate-50">
          <div className="max-w-7xl mx-auto text-center mb-8">
             <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-slate-900">Agendamento Sem Fricção</h2>
             <p className="text-sm font-medium uppercase tracking-[0.2em] max-w-2xl mx-auto text-primary">O cliente manda um WhatsApp. O sistema faz o resto.</p>
          </div>
          <WhatsAppSimulator />
      </section>

      {/* Grid de Imagens: Barbeiros & Barbearia */}
      <section className="py-32 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
             <div className="flex-1 space-y-8">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center transform -rotate-6 bg-primary/10 text-primary">
                   <Users className="w-10 h-10" />
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase text-slate-900">
                  A<br/>EQUIPE<br/><span className="text-primary">AFINADA.</span>
                </h2>
                <p className="text-xl leading-relaxed font-light text-slate-600">
                  Apresente seu time como os astros que eles são. Cada barbeiro tem seu perfil, controla sua agenda direto do bolso e ganha estrelas a cada corte perfeito.
                </p>
                <div className="h-px w-full bg-slate-100"></div>
                <div className="flex gap-4">
                  <div className="p-4 rounded-2xl flex-1 border border-slate-100 bg-slate-50">
                     <h4 className="text-3xl font-black mb-1 text-primary">100%</h4>
                     <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-slate-500">Comissões Exatas</p>
                  </div>
                  <div className="p-4 rounded-2xl flex-1 border border-slate-100 bg-slate-50">
                     <h4 className="text-3xl font-black mb-1 text-primary">24h</h4>
                     <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-slate-500">Marcação Online</p>
                  </div>
                </div>
             </div>

             <div className="flex-1 relative w-full lg:h-[600px] flex items-center justify-center">
                {/* Master Image */}
                <div className="relative w-full max-w-[400px] rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)] z-10 aspect-[3/4] border-8 border-white rotate-3 transform hover:rotate-0 transition-all duration-500">
                   <img className="w-full h-full object-cover scale-110 relative" src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Interior Barbearia" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                   <div className="absolute bottom-8 left-8">
                      <Zap className="w-8 h-8 mb-2 text-primary" />
                      <p className="font-black text-2xl uppercase tracking-tighter text-white">A Casa do Corte</p>
                   </div>
                </div>

                {/* Floating Barber Avatars */}
                <div className="absolute -left-6 lg:left-0 top-1/4 z-20 p-3 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center gap-4 animate-bounce border border-slate-100 bg-white">
                   <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/20">
                      <img src="https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=200&h=200&fit=crop" className="w-full h-full object-cover" alt="Marcelo" />
                   </div>
                   <div className="pr-4">
                      <p className="font-bold text-base text-slate-900">Marcelo</p>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Master Barber</p>
                      <div className="flex text-amber-400"><Star className="fill-current w-3 h-3"/><Star className="fill-current w-3 h-3"/><Star className="fill-current w-3 h-3"/><Star className="fill-current w-3 h-3"/><Star className="fill-current w-3 h-3"/></div>
                   </div>
                </div>

                <div className="absolute -right-6 lg:right-0 bottom-1/4 z-20 p-3 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center gap-4 border border-slate-100 bg-white" style={{ animation: 'bounce 3s infinite reverse' }}>
                   <div className="pr-2 pl-4 text-right">
                      <p className="font-bold text-base text-slate-900">Tiago</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-slate-400">Especialista</p>
                      <p className="text-xs font-bold text-primary">Fade Premium</p>
                   </div>
                   <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/20">
                      <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop" className="w-full h-full object-cover" alt="Tiago" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Benefícios Focados */}
      <section className="py-32 px-6 relative border-t border-slate-200 bg-slate-50">
         <div className="max-w-7xl mx-auto relative z-10 text-center">
            <h2 className="text-5xl md:text-7xl font-black mb-20 tracking-tighter uppercase text-slate-900">Vantagens da <span className="text-primary">Lâmina.</span></h2>
            <div className="grid md:grid-cols-3 gap-6">
               <div className="border border-slate-200 p-10 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300 text-left bg-white shadow-xl shadow-slate-200/50">
                  <TrendingUp className="w-12 h-12 mb-8 text-primary" />
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter text-slate-900">Lucro no Detalhe</h3>
                  <p className="font-light leading-relaxed text-sm text-slate-600">Zero cadeiras vazias. O bot cobra os clientes, agenda em horários de buraco e maximiza o faturamento sem você mover um dedo.</p>
               </div>
               <div className="border p-10 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300 transform md:-translate-y-8 text-left bg-primary border-primary shadow-2xl shadow-primary/40">
                  <MessageCircle className="w-12 h-12 mb-8 text-white" />
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter text-white">O Poder do Whats</h3>
                  <p className="font-semibold leading-relaxed text-sm text-white/90">Esqueça apps genéricos. Seus clientes marcam corte pelo mensageiro mais usado do mundo. É agilidade que converte na hora.</p>
               </div>
               <div className="border border-slate-200 p-10 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300 text-left bg-white shadow-xl shadow-slate-200/50">
                  <Shield className="w-12 h-12 mb-8 text-primary" />
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter text-slate-900">À Prova de Falhas</h3>
                  <p className="font-light leading-relaxed text-sm text-slate-600">Servidores potentes, banco de dados isolado e segurança máxima. Seus dados financeiros e de clientes trancados a sete chaves.</p>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 text-center border-t border-slate-200 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="w-24 h-24 mx-auto mb-8 bg-primary/10 rounded-3xl flex items-center justify-center transform rotate-12 shadow-lg text-primary">
             <Zap className="w-12 h-12 animate-pulse" />
          </div>
          <h2 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter mb-12 uppercase text-slate-900">
            O SEU NOVO <br /> EMPREGADO DO MÊS.
          </h2>
          <button
            onClick={() => setView('login')}
            className="px-14 py-6 rounded-full font-black text-sm uppercase tracking-[0.2em] transform transition-transform hover:scale-110 shadow-2xl shadow-primary/30 bg-primary text-primary-foreground"
          >
            Fazer Login
          </button>
        </div>
      </section>

      {/* Footer Minimalista e Clean */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-primary rounded-lg text-primary-foreground shadow-sm">
                 <Scissors className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                 <span className="font-black tracking-tight text-xl leading-none uppercase text-slate-900">{companyName}</span>
                 <span className="font-bold tracking-[0.3em] text-[8px] uppercase mt-1 text-slate-500">Elevando sua autoestima</span>
              </div>
           </div>
           <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-slate-200 bg-white shadow-sm">
              <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600">Sistemas Online</p>
           </div>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
