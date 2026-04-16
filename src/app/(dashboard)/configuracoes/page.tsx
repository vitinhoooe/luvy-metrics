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

        {/* WhatsApp — informativo */}
        <div style={{ background: '#f8f7ff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>📱 Alertas no WhatsApp</h3>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
            Em breve você receberá tendências diárias e alertas de oportunidade diretamente no seu WhatsApp. Nossa equipe entrará em contato para configurar.
          </p>
        </div>

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
