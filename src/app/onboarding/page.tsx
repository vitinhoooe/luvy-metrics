'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const STEPS = ['Sua loja', 'Contato', 'Conectar WhatsApp']
const WPP_NUMBER = process.env.NEXT_PUBLIC_WPP_SUPORTE ?? '5521999999999'
const WPP_MSG    = encodeURIComponent('Olá! Quero conectar meu WhatsApp ao LuvyMetrics.')
const WPP_LINK   = `https://wa.me/${WPP_NUMBER}?text=${WPP_MSG}`
const QR_URL     = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://wa.me/${WPP_NUMBER}?text=${WPP_MSG}`)}`

export default function OnboardingPage() {
  const [step, setStep]             = useState(0)
  const [nome, setNome]             = useState('')
  const [nomeLoja, setNomeLoja]     = useState('')
  const [whatsapp, setWhatsapp]     = useState('')
  const [faturamento, setFaturamento] = useState('')
  const [salvando, setSalvando]     = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const progresso = ((step) / (STEPS.length - 1)) * 100

  async function salvarPerfil() {
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sessão expirada'); setSalvando(false); return }

    const { error } = await supabase
      .from('perfis')
      .update({
        nome: nome.trim(),
        nome_loja: nomeLoja.trim(),
        whatsapp: whatsapp.replace(/\D/g, ''),
        faturamento,
        onboarding_completo: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) { toast.error('Erro ao salvar perfil'); setSalvando(false); return }
    router.push('/dashboard')
  }

  function avancar() {
    if (step === 0 && !nomeLoja.trim()) { toast.error('Informe o nome da loja'); return }
    if (step === 1 && !whatsapp.trim()) { toast.error('Informe seu WhatsApp'); return }
    setStep((s) => s + 1)
  }

  return (
    <div className="min-h-screen bg-[#08060d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-[#c840e0] shadow-xl mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo ao LuvyMetrics!</h1>
          <p className="text-zinc-400 text-sm mt-1">Vamos configurar sua conta em 3 passos</p>
        </div>

        {/* Barra de progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-[#c840e0] text-white' :
                  i === step ? 'bg-[#c840e0]/20 border-2 border-[#c840e0] text-[#c840e0]' :
                  'bg-white/5 border border-white/10 text-zinc-600'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 w-12 sm:w-20 transition-all ${i < step ? 'bg-[#c840e0]' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
            {STEPS.map((s, i) => <span key={i} className={i === step ? 'text-[#c840e0]' : ''}>{s}</span>)}
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0d0a13] border border-white/10 rounded-2xl p-6 shadow-2xl">
          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-3xl mb-2">🏪</p>
                <h2 className="text-lg font-semibold text-white">Sua loja</h2>
                <p className="text-xs text-zinc-500 mt-1">Conte um pouco sobre o seu negócio</p>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Seu nome *</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nome da loja *</label>
                <input
                  value={nomeLoja}
                  onChange={(e) => setNomeLoja(e.target.value)}
                  placeholder="Ex: Boutique Secreta"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                />
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-3xl mb-2">📱</p>
                <h2 className="text-lg font-semibold text-white">Contato & Faturamento</h2>
                <p className="text-xs text-zinc-500 mt-1">Para enviar seus alertas personalizados</p>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">WhatsApp *</label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="55 (11) 99999-9999"
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                />
                <p className="text-[10px] text-zinc-600 mt-1">Inclua o código do país: 55 para Brasil</p>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Faturamento mensal</label>
                <select
                  value={faturamento}
                  onChange={(e) => setFaturamento(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                >
                  <option value="" className="bg-[#0d0a13]">Selecione (opcional)</option>
                  <option value="ate5k" className="bg-[#0d0a13]">Até R$ 5.000</option>
                  <option value="5k-20k" className="bg-[#0d0a13]">R$ 5.000 — R$ 20.000</option>
                  <option value="20k-50k" className="bg-[#0d0a13]">R$ 20.000 — R$ 50.000</option>
                  <option value="acima50k" className="bg-[#0d0a13]">Acima de R$ 50.000</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-4">
                <p className="text-3xl mb-2">🤖</p>
                <h2 className="text-lg font-semibold text-white">Conectar WhatsApp</h2>
                <p className="text-xs text-zinc-500 mt-1">Escaneie o QR ou clique no botão para ativar os alertas</p>
              </div>
              <div className="flex justify-center">
                <div className="rounded-2xl overflow-hidden bg-white p-2.5 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={QR_URL} alt="QR WhatsApp" width={180} height={180} />
                </div>
              </div>
              <a
                href={WPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Abrir no WhatsApp
              </a>
              <p className="text-[10px] text-zinc-600 text-center">Você pode pular esta etapa e configurar depois em Configurações</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-3 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 hover:text-white transition-all"
              >
                Voltar
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={avancar}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-[#c840e0] text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                Próximo →
              </button>
            ) : (
              <button
                onClick={salvarPerfil}
                disabled={salvando}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-[#c840e0] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {salvando ? 'Salvando...' : 'Entrar no painel 🚀'}
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        {step === 2 && (
          <button
            onClick={salvarPerfil}
            className="w-full mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-2"
          >
            Pular por agora e configurar depois
          </button>
        )}
      </div>
    </div>
  )
}
