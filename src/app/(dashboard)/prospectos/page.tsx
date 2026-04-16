'use client'

import { useState } from 'react'
import { toast } from 'sonner'

const TX = '#111827'
const MT = '#6b7280'
const AC = '#7c3aed'
const GR = '#059669'
const BD = '#e5e7eb'
const CARD: React.CSSProperties = { background: '#fff', border: `1px solid ${BD}`, borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
const INP: React.CSSProperties = { background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', color: TX, fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const }

type Prospecto = {
  place_id: string
  nome: string
  endereco: string
  telefone?: string | null
  website?: string | null
  google_maps_url?: string | null
  rating: number
  total_avaliacoes: number
  aberto?: boolean | null
  email?: string | null
  cidade?: string
}

const CIDADES = [
  'São Paulo SP', 'Rio de Janeiro RJ', 'Belo Horizonte MG', 'Salvador BA',
  'Fortaleza CE', 'Curitiba PR', 'Manaus AM', 'Recife PE',
  'Porto Alegre RS', 'Goiânia GO', 'Belém PA', 'Florianópolis SC',
  'Maceió AL', 'Natal RN', 'Campo Grande MS', 'Vitória ES',
  'Campinas SP', 'Santos SP', 'Ribeirão Preto SP', 'Guarulhos SP',
  'Niterói RJ', 'Uberlândia MG', 'Joinville SC', 'Londrina PR',
  'Maringá PR', 'São Luís MA', 'Cuiabá MT', 'Brasília DF',
]

export default function ProspectosPage() {
  const [cidade, setCidade] = useState('São Paulo')
  const [cidadeCustom, setCidadeCustom] = useState('')
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [enviando, setEnviando] = useState<Record<string, boolean>>({})
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({})

  async function buscar() {
    const c = cidadeCustom.trim() || cidade
    if (!c) { toast.error('Selecione uma cidade'); return }
    setBuscando(true)
    try {
      const res = await fetch(`/api/prospectar/buscar?cidade=${encodeURIComponent(c)}`)
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setProspectos(data.prospectos || [])
      toast.success(`${data.total} sex shops encontrados em ${c}`)
    } catch { toast.error('Erro ao buscar') }
    setBuscando(false)
  }

  async function enviarEmail(p: Prospecto) {
    const email = emailInputs[p.place_id] || p.email
    if (!email || !email.includes('@')) { toast.error('Informe um email válido'); return }
    setEnviando(prev => ({ ...prev, [p.place_id]: true }))
    try {
      const res = await fetch('/api/prospectar/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome_loja: p.nome, cidade: p.endereco }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Email enviado para ${p.nome}!`)
        setEnviados(prev => new Set([...prev, p.place_id]))
      } else { toast.error(data.error || 'Erro ao enviar') }
    } catch { toast.error('Erro ao enviar') }
    setEnviando(prev => ({ ...prev, [p.place_id]: false }))
  }

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TX, marginBottom: 4 }}>Prospecção Automática</h1>
        <p style={{ fontSize: 14, color: MT }}>Encontre sex shops no Google e envie propostas por email</p>
      </div>

      {/* Busca */}
      <div style={{ ...CARD, padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: TX, marginBottom: 16 }}>🔍 Buscar sex shops por cidade</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 12, color: MT, fontWeight: 500, marginBottom: 6 }}>Cidade</label>
            <select value={cidade} onChange={e => { setCidade(e.target.value); setCidadeCustom('') }} style={INP}>
              {CIDADES.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="custom">Outra cidade...</option>
            </select>
          </div>
          {cidade === 'custom' && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 12, color: MT, fontWeight: 500, marginBottom: 6 }}>Qual cidade?</label>
              <input value={cidadeCustom} onChange={e => setCidadeCustom(e.target.value)} placeholder="Ex: Campinas, Niterói..." style={INP} />
            </div>
          )}
          <button onClick={buscar} disabled={buscando} style={{
            padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: AC, color: '#fff', border: 'none', cursor: 'pointer',
            opacity: buscando ? 0.5 : 1, height: 42,
          }}>
            {buscando ? 'Buscando...' : '🔍 Buscar'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {prospectos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Encontrados', valor: prospectos.length, cor: AC },
            { label: 'Com email', valor: prospectos.filter(p => p.email).length, cor: GR },
            { label: 'Com telefone', valor: prospectos.filter(p => p.telefone).length, cor: '#2563eb' },
            { label: 'Emails enviados', valor: enviados.size, cor: '#d97706' },
          ].map((s, i) => (
            <div key={i} style={{ ...CARD, padding: 20 }}>
              <div style={{ fontSize: 11, color: MT, fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.cor }}>{s.valor}</div>
            </div>
          ))}
        </div>
      )}

      {/* Resultados */}
      {prospectos.length > 0 && (
        <div style={{ ...CARD, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${BD}` }}>
            <p style={{ fontWeight: 600, color: TX }}>Sex shops encontrados</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Loja', 'Endereço', 'Avaliação', 'Telefone', 'Site', 'Email + Enviar'].map(col => (
                    <th key={col} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MT, borderBottom: `1px solid ${BD}` }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prospectos.map(p => (
                  <tr key={p.place_id} style={{ borderBottom: `1px solid ${BD}` }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: TX, fontSize: 14 }}>{p.nome}</div>
                      {p.google_maps_url && (
                        <a href={p.google_maps_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: AC, textDecoration: 'none' }}>Ver no Maps ↗</a>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: MT, fontSize: 12, maxWidth: 200 }}>{p.endereco}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {p.rating > 0 ? (
                        <div>
                          <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {p.rating}</span>
                          <span style={{ color: MT, fontSize: 11, marginLeft: 4 }}>({p.total_avaliacoes})</span>
                        </div>
                      ) : <span style={{ color: MT }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {p.telefone ? (
                        <a href={`tel:${p.telefone}`} style={{ color: TX, textDecoration: 'none', fontSize: 13 }}>{p.telefone}</a>
                      ) : <span style={{ color: MT }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {p.website ? (
                        <a href={p.website} target="_blank" rel="noopener noreferrer"
                          style={{ color: AC, textDecoration: 'none', fontSize: 12 }}>Visitar ↗</a>
                      ) : <span style={{ color: MT }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {enviados.has(p.place_id) ? (
                        <span style={{ background: '#ecfdf5', color: GR, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>✓ Enviado</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            value={emailInputs[p.place_id] ?? p.email ?? ''}
                            onChange={e => setEmailInputs(prev => ({ ...prev, [p.place_id]: e.target.value }))}
                            placeholder="email@loja.com"
                            style={{ ...INP, width: 160, padding: '6px 10px', fontSize: 12 }}
                          />
                          <button
                            onClick={() => enviarEmail(p)}
                            disabled={enviando[p.place_id]}
                            style={{
                              padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: AC, color: '#fff', border: 'none', cursor: 'pointer',
                              opacity: enviando[p.place_id] ? 0.5 : 1, whiteSpace: 'nowrap',
                            }}>
                            {enviando[p.place_id] ? '...' : '📧 Enviar'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {prospectos.length === 0 && !buscando && (
        <div style={{ ...CARD, padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: TX, marginBottom: 8 }}>Encontre novos clientes</h3>
          <p style={{ fontSize: 14, color: MT, maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
            Selecione uma cidade acima para buscar sex shops no Google Maps.
            Você poderá enviar uma proposta por email diretamente daqui.
          </p>
        </div>
      )}
    </>
  )
}
