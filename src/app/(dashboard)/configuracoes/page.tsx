'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types'

const WPP_NUMBER = process.env.NEXT_PUBLIC_WPP_SUPORTE ?? '5521999999999'
const WPP_MSG    = encodeURIComponent('Olá! Quero conectar meu WhatsApp ao LuvyMetrics.')
const WPP_LINK   = `https://wa.me/${WPP_NUMBER}?text=${WPP_MSG}`
// QR code via api.qrserver.com (sem rastreamento)
const QR_URL     = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://wa.me/${WPP_NUMBER}?text=${WPP_MSG}`)}`

function Toggle({ ativo, onChange }: { ativo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      className={`w-11 h-6 rounded-full border-2 transition-all flex items-center px-0.5 flex-shrink-0 ${
        ativo ? 'bg-[#c840e0] border-[#c840e0]' : 'bg-white/5 border-white/20'
      }`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

export default function ConfiguracoesPage() {
  const [perfil, setPerfil]           = useState<Partial<Perfil>>({})
  const [carregando, setCarregando]   = useState(true)
  const [salvando, setSalvando]       = useState(false)
  const [preview, setPreview]         = useState<string | null>(null)
  const [carregandoPreview, setCarregandoPreview] = useState(false)
  const supabase = createClient()

  useEffect(() => { buscarPerfil() }, [])

  async function buscarPerfil() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    if (data) setPerfil(data)
    setCarregando(false)
  }

  async function salvar() {
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('perfis')
      .update({ ...perfil, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (error) toast.error('Erro ao salvar configurações')
    else toast.success('Configurações salvas!')
    setSalvando(false)
  }

  function set<K extends keyof Perfil>(campo: K, valor: Perfil[K]) {
    setPerfil((prev) => ({ ...prev, [campo]: valor }))
  }

  async function testarNotificacao() {
    setCarregandoPreview(true)
    try {
      const res = await fetch('/api/whatsapp/testar', { method: 'POST' })
      const json = await res.json()
      if (res.ok) setPreview(json.preview)
      else toast.error('Erro ao gerar preview')
    } finally {
      setCarregandoPreview(false)
    }
  }

  const diasTrial = perfil.trial_expira_em
    ? Math.max(0, Math.ceil((new Date(perfil.trial_expira_em).getTime() - Date.now()) / 86_400_000))
    : 0

  if (carregando) return <div className="py-20 text-center text-zinc-500 text-sm">Carregando...</div>

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Gerencie seu perfil, alertas e preferências</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Perfil */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">👤 Perfil</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Seu nome</label>
                <input
                  value={perfil.nome ?? ''}
                  onChange={(e) => set('nome', e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nome da loja</label>
                <input
                  value={perfil.nome_loja ?? ''}
                  onChange={(e) => set('nome_loja', e.target.value)}
                  placeholder="Ex: Loja Secreta"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">WhatsApp</label>
                <input
                  value={perfil.whatsapp ?? ''}
                  onChange={(e) => set('whatsapp', e.target.value)}
                  placeholder="55119999999999"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Faturamento mensal</label>
                <select
                  value={perfil.faturamento ?? ''}
                  onChange={(e) => set('faturamento', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                >
                  <option value="" className="bg-[#0d0a13]">Selecione</option>
                  <option value="ate5k" className="bg-[#0d0a13]">Até R$ 5.000</option>
                  <option value="5k-20k" className="bg-[#0d0a13]">R$ 5.000 — R$ 20.000</option>
                  <option value="20k-50k" className="bg-[#0d0a13]">R$ 20.000 — R$ 50.000</option>
                  <option value="acima50k" className="bg-[#0d0a13]">Acima de R$ 50.000</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Alertas WhatsApp */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">📱 Alertas WhatsApp</h2>
          <div className="space-y-4">
            {[
              { campo: 'alertas_diarios'      as const, label: 'Relatório diário de tendências', desc: 'Enviado todos os dias às 7h' },
              { campo: 'alertas_oportunidade' as const, label: 'Alertas de oportunidade imediatos', desc: 'Quando produto ultrapassa 30% de crescimento' },
              { campo: 'relatorio_dominical'  as const, label: 'Relatório semanal completo', desc: 'Enviado todo domingo às 8h' },
              { campo: 'alertas_estoque'      as const, label: 'Alertas de estoque baixo', desc: 'Quando produto atingir quantidade mínima' },
            ].map((item) => (
              <div key={item.campo} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white font-medium">{item.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
                <Toggle
                  ativo={!!(perfil[item.campo])}
                  onChange={(v) => set(item.campo, v as never)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Estoque */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">📦 Preferências de Estoque</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Quantidade mínima padrão</label>
                <input
                  type="number"
                  value={perfil.qtd_minima_padrao ?? 5}
                  onChange={(e) => set('qtd_minima_padrao', Number(e.target.value))}
                  min={1}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Categoria padrão</label>
                <input
                  value={perfil.categoria_padrao ?? ''}
                  onChange={(e) => set('categoria_padrao', e.target.value)}
                  placeholder="Ex: Vibradores"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Alerta automático ao zerar estoque</p>
                <p className="text-xs text-zinc-500 mt-0.5">Envia WhatsApp quando produto chegar a 0 unidades</p>
              </div>
              <Toggle
                ativo={!!(perfil.alerta_ao_zerar)}
                onChange={(v) => set('alerta_ao_zerar', v)}
              />
            </div>
          </div>
        </section>

        {/* WhatsApp QR */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">📲 Conectar WhatsApp</h2>
          <p className="text-xs text-zinc-500 mb-5">Escaneie o QR code ou clique no link para iniciar a conversa com nosso bot e receber alertas</p>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* QR */}
            <div className="flex-shrink-0 rounded-2xl overflow-hidden bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={QR_URL} alt="QR WhatsApp" width={160} height={160} />
            </div>
            {/* Instruções */}
            <div className="flex-1 space-y-3">
              {['Abra o WhatsApp no seu celular', 'Toque em Mais opções (⋮) → Dispositivos conectados', 'Ou escaneie o QR code ao lado', 'Você receberá alertas automáticos conforme configurado'].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#c840e0]/20 text-[#c840e0] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-zinc-300">{step}</p>
                </div>
              ))}
              <a
                href={WPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Abrir no WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Testar Notificação */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">🔔 Testar Notificação</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Veja um preview da mensagem que você receberá no WhatsApp</p>
            </div>
            <button
              onClick={testarNotificacao}
              disabled={carregandoPreview}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#c840e0]/20 border border-[#c840e0]/30 text-[#c840e0] text-sm font-medium hover:bg-[#c840e0]/30 disabled:opacity-50 transition-all"
            >
              {carregandoPreview ? 'Gerando...' : 'Gerar preview'}
            </button>
          </div>
          {preview ? (
            <div className="relative rounded-xl bg-[#075e54]/20 border border-[#075e54]/30 p-4">
              <div className="absolute top-3 right-3">
                <button onClick={() => setPreview(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-green-400">LuvyMetrics Bot</span>
              </div>
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">{preview}</pre>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-2xl mb-2">📱</p>
              <p className="text-sm text-zinc-500">Clique em "Gerar preview" para ver como ficará a mensagem no WhatsApp</p>
            </div>
          )}
        </section>

        {/* Plano */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">💳 Plano</h2>
          <div className={`rounded-xl border p-4 mb-4 ${diasTrial > 0 ? 'bg-[#c840e0]/10 border-[#c840e0]/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Período de teste</p>
                <p className={`text-2xl font-bold mt-1 ${diasTrial > 0 ? 'text-[#c840e0]' : 'text-red-400'}`}>
                  {diasTrial} {diasTrial === 1 ? 'dia restante' : 'dias restantes'}
                </p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
            {diasTrial <= 3 && (
              <p className="text-xs text-zinc-400 mt-2">Assine agora para não perder acesso às suas métricas.</p>
            )}
          </div>
          <div className="flex gap-3">
            <a
              href={process.env.NEXT_PUBLIC_CAKTO_LINK ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-xl text-center bg-gradient-to-r from-purple-600 to-[#c840e0] text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              Assinar agora
            </a>
            <a
              href={process.env.NEXT_PUBLIC_CAKTO_LINK ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-xl text-center border border-white/10 text-zinc-400 text-sm hover:bg-white/5 hover:text-white transition-all"
            >
              Gerenciar assinatura
            </a>
          </div>
        </section>

        {/* Botão salvar */}
        <button
          onClick={salvar}
          disabled={salvando}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#c840e0] text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {salvando ? 'Salvando...' : 'Salvar todas as configurações'}
        </button>
      </div>
    </>
  )
}
