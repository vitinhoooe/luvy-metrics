'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types'

const TX = '#111827'
const MT = '#6b7280'
const AC = '#7c3aed'
const GR = '#059669'
const BD = '#e5e7eb'
const CARD_BG = '#fff'
const BTN = '#7c3aed'

const WPP_NUMBER = process.env.NEXT_PUBLIC_WPP_SUPORTE ?? '5521999999999'

const INP: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: '#fff',
  border: '1.5px solid #d1d5db', borderRadius: 10,
  color: TX, fontSize: 14, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const CARD: React.CSSProperties = {
  background: CARD_BG, border: `1px solid ${BD}`,
  borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

function Toggle({ ativo, onChange }: { ativo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!ativo)} style={{
      width: 44, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center',
      padding: '0 2px', border: 'none', cursor: 'pointer', flexShrink: 0,
      background: ativo ? AC : '#d1d5db',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'transform 0.15s',
        transform: ativo ? 'translateX(20px)' : 'translateX(0)',
      }} />
    </button>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 12, color: MT, fontWeight: 500, marginBottom: 6 }}>{children}</label>
}

export default function ConfiguracoesPage() {
  const [perfil, setPerfil] = useState<Partial<Perfil>>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
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
    const { error } = await supabase.from('perfis').update({ ...perfil, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    if (error) toast.error('Erro ao salvar configurações')
    else toast.success('Configurações salvas!')
    setSalvando(false)
  }

  function set<K extends keyof Perfil>(campo: K, valor: Perfil[K]) {
    setPerfil(prev => ({ ...prev, [campo]: valor }))
  }

  async function testarNotificacao() {
    setCarregandoPreview(true)
    try {
      const res = await fetch('/api/whatsapp/testar', { method: 'POST' })
      const json = await res.json()
      if (res.ok) setPreview(json.preview)
      else toast.error('Erro ao gerar preview')
    } finally { setCarregandoPreview(false) }
  }

  function abrirWhatsApp() {
    const numero = perfil.whatsapp || ''
    const msg = encodeURIComponent(`Olá! Quero ativar os alertas do LuvyMetrics.\nMeu número: ${numero}`)
    window.open(`https://wa.me/${WPP_NUMBER}?text=${msg}`, '_blank')
  }

  const diasTrial = perfil.trial_expira_em
    ? Math.max(0, Math.ceil((new Date(perfil.trial_expira_em).getTime() - Date.now()) / 86_400_000))
    : 0

  if (carregando) return <div style={{ padding: 80, textAlign: 'center', color: MT, fontSize: 14 }}>Carregando...</div>

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, letterSpacing: '-0.5px', marginBottom: 4 }}>Configurações</h1>
        <p style={{ fontSize: 14, color: MT }}>Gerencie seu perfil, alertas e preferências</p>
      </div>

      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Perfil */}
        <section style={CARD}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TX, marginBottom: 20 }}>👤 Perfil</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><Label>Seu nome</Label><input value={perfil.nome ?? ''} onChange={e => set('nome', e.target.value)} placeholder="Ex: João Silva" style={INP} /></div>
            <div><Label>Nome da loja</Label><input value={perfil.nome_loja ?? ''} onChange={e => set('nome_loja', e.target.value)} placeholder="Ex: Loja Secreta" style={INP} /></div>
            <div><Label>WhatsApp</Label><input value={perfil.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" style={INP} /></div>
            <div>
              <Label>Faturamento mensal</Label>
              <select value={perfil.faturamento ?? ''} onChange={e => set('faturamento', e.target.value)} style={INP}>
                <option value="">Selecione</option>
                <option value="ate5k">Até R$ 5.000</option>
                <option value="5k-20k">R$ 5.000 — R$ 20.000</option>
                <option value="20k-50k">R$ 20.000 — R$ 50.000</option>
                <option value="acima50k">Acima de R$ 50.000</option>
              </select>
            </div>
          </div>
        </section>

        {/* WhatsApp Alertas */}
        <section style={CARD}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TX, marginBottom: 6 }}>📱 Receber alertas no WhatsApp</h2>
          <p style={{ fontSize: 13, color: MT, marginBottom: 20, lineHeight: 1.6 }}>
            Adicione seu número abaixo para receber tendências diárias às 7h
          </p>

          <div style={{ marginBottom: 16 }}>
            <Label>Seu número de WhatsApp</Label>
            <input value={perfil.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" style={INP} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button onClick={salvar} disabled={salvando} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#fff', background: BTN, border: 'none', cursor: 'pointer', opacity: salvando ? 0.5 : 1 }}>
              {salvando ? 'Salvando...' : 'Salvar número'}
            </button>
            <button onClick={abrirWhatsApp} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#fff', background: '#22c55e', border: 'none', cursor: 'pointer' }}>
              Testar agora
            </button>
          </div>

          <p style={{ fontSize: 12, color: MT, lineHeight: 1.6, background: 'rgba(139,92,246,0.08)', border: `1px solid ${BD}`, borderRadius: 10, padding: 12 }}>
            Nossa equipe ativará os alertas em até 2 horas após o contato. Você receberá tendências diárias, alertas de oportunidade e relatórios semanais.
          </p>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { campo: 'alertas_diarios' as const, label: 'Relatório diário de tendências', desc: 'Enviado todos os dias às 7h' },
              { campo: 'alertas_oportunidade' as const, label: 'Alertas de oportunidade imediatos', desc: 'Quando produto ultrapassa 30% de crescimento' },
              { campo: 'relatorio_dominical' as const, label: 'Relatório semanal completo', desc: 'Enviado todo domingo às 8h' },
              { campo: 'alertas_estoque' as const, label: 'Alertas de estoque baixo', desc: 'Quando produto atingir quantidade mínima' },
            ].map(item => (
              <div key={item.campo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 14, color: TX, fontWeight: 500 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: MT, marginTop: 2 }}>{item.desc}</p>
                </div>
                <Toggle ativo={!!(perfil[item.campo])} onChange={v => set(item.campo, v as never)} />
              </div>
            ))}
          </div>
        </section>

        {/* Estoque */}
        <section style={CARD}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TX, marginBottom: 20 }}>📦 Preferências de Estoque</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><Label>Quantidade mínima padrão</Label><input type="number" value={perfil.qtd_minima_padrao ?? 5} onChange={e => set('qtd_minima_padrao', Number(e.target.value))} min={1} style={INP} /></div>
            <div><Label>Categoria padrão</Label><input value={perfil.categoria_padrao ?? ''} onChange={e => set('categoria_padrao', e.target.value)} placeholder="Ex: Vibradores" style={INP} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, color: TX, fontWeight: 500 }}>Alerta automático ao zerar estoque</p>
              <p style={{ fontSize: 12, color: MT, marginTop: 2 }}>Envia WhatsApp quando produto chegar a 0 un</p>
            </div>
            <Toggle ativo={!!(perfil.alerta_ao_zerar)} onChange={v => set('alerta_ao_zerar', v)} />
          </div>
        </section>

        {/* Testar Notificação */}
        <section style={CARD}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: TX, marginBottom: 4 }}>🔔 Testar Notificação</h2>
              <p style={{ fontSize: 13, color: MT }}>Preview da mensagem que você receberá</p>
            </div>
            <button onClick={testarNotificacao} disabled={carregandoPreview} style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, flexShrink: 0,
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: AC,
              cursor: 'pointer', opacity: carregandoPreview ? 0.5 : 1,
            }}>{carregandoPreview ? 'Gerando...' : 'Gerar preview'}</button>
          </div>
          {preview ? (
            <div style={{ borderRadius: 12, background: 'rgba(7,94,84,0.2)', border: '1px solid rgba(7,94,84,0.3)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💬</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>LuvyMetrics Bot</span>
              </div>
              <pre style={{ fontSize: 12, color: '#d1d5db', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>{preview}</pre>
            </div>
          ) : (
            <div style={{ borderRadius: 12, border: '1px dashed rgba(139,92,246,0.2)', padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>📱</p>
              <p style={{ fontSize: 13, color: MT }}>Clique em &quot;Gerar preview&quot; para ver a mensagem</p>
            </div>
          )}
        </section>

        {/* Plano */}
        <section style={CARD}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TX, marginBottom: 20 }}>💳 Plano</h2>
          <div style={{
            borderRadius: 12, padding: 20, marginBottom: 16,
            background: diasTrial > 0 ? 'rgba(139,92,246,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${diasTrial > 0 ? 'rgba(139,92,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: TX }}>Período de teste</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: diasTrial > 0 ? AC : '#ef4444', marginTop: 4 }}>
                  {diasTrial} {diasTrial === 1 ? 'dia restante' : 'dias restantes'}
                </p>
              </div>
              <span style={{ fontSize: 32 }}>⏳</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href={process.env.NEXT_PUBLIC_CAKTO_LINK ?? '#'} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: 14, borderRadius: 10, textAlign: 'center', textDecoration: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 600 }}>
              Assinar agora
            </a>
            <a href={process.env.NEXT_PUBLIC_CAKTO_LINK ?? '#'} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: 14, borderRadius: 10, textAlign: 'center', textDecoration: 'none', border: `1px solid ${BD}`, color: MT, fontSize: 14 }}>
              Gerenciar assinatura
            </a>
          </div>
        </section>

        {/* Botão salvar */}
        <button onClick={salvar} disabled={salvando} style={{
          width: '100%', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600,
          color: '#fff', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          opacity: salvando ? 0.5 : 1,
        }}>
          {salvando ? 'Salvando...' : 'Salvar todas as configurações'}
        </button>
      </div>
    </>
  )
}
