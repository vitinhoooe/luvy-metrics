'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const TX = '#111827'
const MT = '#6b7280'
const AC = '#7c3aed'
const GR = '#059669'
const RD = '#dc2626'
const BD = '#e5e7eb'
const CARD: React.CSSProperties = { background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
const INP: React.CSSProperties = { background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', color: TX, fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const }

type Prospecto = { id: string; nome_loja: string; cidade: string; email: string; status: string; enviado_em: string; email_aberto: boolean; email_aberto_em: string | null; respondeu: boolean }

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  novo: { bg: '#f3f4f6', color: '#6b7280', label: 'Aguardando' },
  contatado: { bg: '#dbeafe', color: '#2563eb', label: 'Email enviado' },
  enviado: { bg: '#dbeafe', color: '#2563eb', label: 'Email enviado' },
  respondeu: { bg: '#ecfdf5', color: '#059669', label: 'Respondeu! 🎉' },
  convertido: { bg: '#f5f3ff', color: '#7c3aed', label: 'Cliente ✓' },
  perdido: { bg: '#fef2f2', color: '#dc2626', label: 'Não converteu' },
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'prospectos' | 'clientes' | 'metricas' | 'disparar'>('prospectos')
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [enviando, setEnviando] = useState(false)

  // Disparar manual
  const [manualNome, setManualNome] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualCidade, setManualCidade] = useState('')

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email === 'paulobernardobtt@gmail.com') {
        setAuthorized(true)
        buscarProspectos()
      }
      setLoading(false)
    })
  }, [])

  async function buscarProspectos() {
    const { data } = await supabase.from('prospectos').select('*').order('enviado_em', { ascending: false }).limit(200)
    setProspectos(data || [])
  }

  async function atualizarStatus(id: string, status: string) {
    await supabase.from('prospectos').update({ status }).eq('id', id)
    toast.success(`Status atualizado: ${status}`)
    buscarProspectos()
  }

  async function buscarNovasLojas() {
    setBuscando(true)
    try {
      const res = await fetch('/api/prospectar/buscar?cidade=São Paulo SP')
      const data = await res.json()
      toast.success(`${data.total} lojas encontradas!`)
    } catch { toast.error('Erro ao buscar') }
    setBuscando(false)
  }

  async function dispararEmails() {
    setEnviando(true)
    try {
      const res = await fetch('/api/cron/prospectar')
      const data = await res.json()
      toast.success(`${data.emails_enviados} emails enviados!`)
      buscarProspectos()
    } catch { toast.error('Erro ao disparar') }
    setEnviando(false)
  }

  async function enviarManual() {
    if (!manualEmail.includes('@')) { toast.error('Email inválido'); return }
    setEnviando(true)
    try {
      const res = await fetch('/api/prospectar/enviar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manualEmail, nome_loja: manualNome, cidade: manualCidade }),
      })
      if (res.ok) { toast.success('Email enviado!'); setManualNome(''); setManualEmail(''); setManualCidade('') }
      else toast.error('Erro ao enviar')
    } catch { toast.error('Erro') }
    setEnviando(false)
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: MT }}>Carregando...</div>
  if (!authorized) return <div style={{ padding: 80, textAlign: 'center', color: RD }}>Acesso negado</div>

  const totalEnviados = prospectos.filter(p => p.status === 'enviado' || p.status === 'contatado').length
  const totalAbriram = prospectos.filter(p => p.email_aberto).length
  const totalResponderam = prospectos.filter(p => p.respondeu || p.status === 'respondeu').length
  const totalConvertidos = prospectos.filter(p => p.status === 'convertido').length

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <h1 style={{ fontSize: 28, fontWeight: 800, color: TX, marginBottom: 4 }}>Admin LuvyMetrics</h1>
      <p style={{ fontSize: 14, color: MT, marginBottom: 24 }}>Painel de prospecção e métricas</p>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: '#f3f4f6', borderRadius: 12, width: 'fit-content', marginBottom: 24 }}>
        {([['prospectos', '🎯 Prospecção'], ['clientes', '👥 Clientes'], ['metricas', '📊 Métricas'], ['disparar', '📧 Disparar']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setAba(key)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: aba === key ? AC : 'transparent', color: aba === key ? '#fff' : MT,
          }}>{label}</button>
        ))}
      </div>

      {aba === 'prospectos' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total encontradas', valor: prospectos.length, cor: AC },
              { label: 'Emails enviados', valor: totalEnviados, cor: '#2563eb' },
              { label: 'Abriram email', valor: totalAbriram, cor: '#d97706' },
              { label: 'Convertidos', valor: totalConvertidos, cor: GR },
            ].map((s, i) => (
              <div key={i} style={{ ...CARD, padding: 20 }}>
                <div style={{ fontSize: 11, color: MT, fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.cor }}>{s.valor}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button onClick={buscarNovasLojas} disabled={buscando} style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#f5f3ff', color: AC, border: `1px solid #ddd6fe`, cursor: 'pointer', opacity: buscando ? 0.5 : 1 }}>
              {buscando ? 'Buscando...' : '🔍 Buscar novas lojas'}
            </button>
            <button onClick={dispararEmails} disabled={enviando} style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: AC, color: '#fff', border: 'none', cursor: 'pointer', opacity: enviando ? 0.5 : 1 }}>
              {enviando ? 'Disparando...' : '📧 Disparar emails (100)'}
            </button>
          </div>

          {/* Table */}
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Loja', 'Cidade', 'Email', 'Status', 'Abriu', 'Enviado em', 'Ações'].map(c => (
                    <th key={c} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MT, borderBottom: `1px solid ${BD}` }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prospectos.slice(0, 50).map(p => {
                  const badge = STATUS_BADGE[p.status] || STATUS_BADGE.novo
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${BD}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: TX }}>{p.nome_loja || '—'}</td>
                      <td style={{ padding: '10px 14px', color: MT, fontSize: 12 }}>{p.cidade || '—'}</td>
                      <td style={{ padding: '10px 14px', color: TX, fontSize: 12 }}>{p.email || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{badge.label}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12 }}>
                        {p.email_aberto ? <span style={{ color: GR, fontWeight: 600 }}>✓ Sim</span> : <span style={{ color: MT }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: MT, fontSize: 12 }}>
                        {p.enviado_em ? new Date(p.enviado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => atualizarStatus(p.id, 'respondeu')} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, background: '#ecfdf5', color: GR, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Respondeu</button>
                          <button onClick={() => atualizarStatus(p.id, 'convertido')} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, background: '#f5f3ff', color: AC, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Converteu</button>
                          <button onClick={() => atualizarStatus(p.id, 'perdido')} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, background: '#fef2f2', color: RD, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Perdeu</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {prospectos.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: MT }}>Nenhum prospecto ainda. Clique em &quot;Buscar novas lojas&quot;.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === 'metricas' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Emails enviados total', valor: totalEnviados, cor: '#2563eb' },
            { label: 'Taxa de abertura', valor: totalEnviados > 0 ? Math.round((totalAbriram / totalEnviados) * 100) + '%' : '0%', cor: '#d97706' },
            { label: 'Taxa de resposta', valor: totalEnviados > 0 ? Math.round((totalResponderam / totalEnviados) * 100) + '%' : '0%', cor: GR },
            { label: 'Taxa de conversão', valor: totalEnviados > 0 ? Math.round((totalConvertidos / totalEnviados) * 100) + '%' : '0%', cor: AC },
            { label: 'MRR atual', valor: `R$ ${(totalConvertidos * 97).toLocaleString('pt-BR')}`, cor: GR },
            { label: 'Projeção 100 clientes', valor: 'R$ 9.700/mês', cor: AC },
          ].map((m, i) => (
            <div key={i} style={{ ...CARD, padding: 28 }}>
              <div style={{ fontSize: 12, color: MT, fontWeight: 500, marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.cor }}>{m.valor}</div>
            </div>
          ))}
        </div>
      )}

      {aba === 'clientes' && (
        <div style={{ ...CARD, padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>👥</p>
          <p style={{ color: MT }}>Lista de clientes disponível no Supabase Dashboard → Auth → Users</p>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: AC, fontSize: 14, marginTop: 8, display: 'inline-block' }}>Abrir Supabase →</a>
        </div>
      )}

      {aba === 'disparar' && (
        <div style={{ ...CARD, padding: 28, maxWidth: 500 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TX, marginBottom: 20 }}>📧 Disparar email manual</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: MT, fontWeight: 500, marginBottom: 6 }}>Nome da loja</label>
              <input value={manualNome} onChange={e => setManualNome(e.target.value)} placeholder="Ex: Loja Sensual" style={INP} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: MT, fontWeight: 500, marginBottom: 6 }}>Email *</label>
              <input value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="contato@loja.com" style={INP} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: MT, fontWeight: 500, marginBottom: 6 }}>Cidade</label>
              <input value={manualCidade} onChange={e => setManualCidade(e.target.value)} placeholder="São Paulo" style={INP} />
            </div>
            <button onClick={enviarManual} disabled={enviando} style={{
              padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 600, background: AC, color: '#fff', border: 'none', cursor: 'pointer', opacity: enviando ? 0.5 : 1,
            }}>{enviando ? 'Enviando...' : 'Enviar email de prospecção'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
