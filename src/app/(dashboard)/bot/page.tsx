'use client'
import { useState, useRef, useEffect } from 'react'

const TX = '#faf9ff'
const MT = '#9ca3af'
const AC = '#a78bfa'
const BD = 'rgba(139,92,246,0.2)'

type Msg = { role: 'user' | 'assistant'; content: string }

const sugestoes = [
  '🔥 O que comprar essa semana?',
  '📦 Como está meu estoque?',
  '💰 Qual produto tem melhor margem?',
  '📈 Quais tendências estão explodindo?',
]

export default function BotPage() {
  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: 'Olá! Sou o assistente do LuvyMetrics.\n\nTenho acesso aos seus dados de estoque e às tendências do mercado. O que você quer saber?'
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function enviar(texto?: string) {
    const msg = texto || input
    if (!msg.trim() || loading) return

    const novas: Msg[] = [...messages, { role: 'user', content: msg }]
    setMessages(novas)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: novas })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro ao conectar. Tente novamente.'
      }])
    }
    setLoading(false)
  }

  return (
    <div style={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: TX, margin: '0 0 4px' }}>Bot IA</h1>
        <p style={{ fontSize: '14px', color: MT, margin: 0 }}>Assistente com dados reais do seu negócio</p>
      </div>

      <div style={{
        flex: 1, background: '#1e1c2e',
        border: `1px solid ${BD}`,
        borderRadius: '16px', display: 'flex',
        flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '10px', alignItems: 'flex-start'
            }}>
              {m.role === 'assistant' && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '15px', flexShrink: 0
                }}>🤖</div>
              )}
              <div style={{
                maxWidth: '72%', padding: '12px 16px', borderRadius: '12px',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                  : 'rgba(255,255,255,0.06)',
                color: TX, fontSize: '14px', lineHeight: '1.65',
                whiteSpace: 'pre-wrap'
              }}>{m.content}</div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>🤖</div>
              <div style={{
                padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                color: MT, fontSize: '14px'
              }}>Pensando...</div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div style={{ padding: '0 24px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {sugestoes.map(s => (
              <button key={s} onClick={() => enviar(s)} style={{
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: '100px', padding: '7px 16px',
                color: AC, fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit'
              }}>{s}</button>
            ))}
          </div>
        )}

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(139,92,246,0.1)',
          display: 'flex', gap: '12px'
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
            placeholder="Pergunte sobre estoque, tendências, lucro..."
            disabled={loading}
            style={{
              flex: 1, padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${BD}`,
              borderRadius: '10px', color: TX,
              fontSize: '14px', outline: 'none',
              fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => enviar()}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 24px',
              background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none', borderRadius: '10px',
              color: '#fff', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: !input.trim() ? 0.5 : 1,
            }}>
            {loading ? '...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
