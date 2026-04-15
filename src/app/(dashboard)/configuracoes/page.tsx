'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types'

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
  const [perfil, setPerfil] = useState<Partial<Perfil>>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
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
