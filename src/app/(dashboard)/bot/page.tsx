'use client'
import { useState, useRef, useEffect } from 'react'

const TX = '#f0ebff'
const MT = '#8b7fa0'
const AC = '#c840e0'
const BD = 'rgba(200,64,224,0.18)'
const BTN = '#9333ea'

type Msg = { id: string; role: 'user' | 'assistant'; content: string }

const sugestoes = [
  '🔥 O que comprar essa semana?',
  '📦 Como está meu estoque?',
  '💰 Qual produto tem melhor margem?',
  '📈 Quais tendências estão explodindo?',
]

export default function BotPage() {
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [msgs, setMsgs] = useState<Msg[]>([{
    id: '0', role: 'assistant',
    content: 'Olá! Sou o assistente do LuvyMetrics 🤖\n\nTenho acesso aos seus dados de estoque e às tendências do mercado agora. O que você quer saber?',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim()
    if (!msg || loading) return

    const userMsg: Msg = { id: Date.now().toString(), role: 'user', content: msg }
    const botId = (Date.now() + 1).toString()

    setMsgs(prev => [...prev, userMsg, { id: botId, role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    try {
      const historico = msgs
        .filter(m => m.id !== '0')
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...historico, { role: 'user', content: msg }] }),
      })

      if (!res.ok || !res.body) throw new Error('Resposta inválida')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)

        for (const linha of chunk.split('\n')) {
          if (!linha.startsWith('data: ')) continue
          const data = linha.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed?.textDelta ?? ''
            if (delta) {
              setMsgs(prev => prev.map(m =>
                m.id === botId ? { ...m, content: m.content + delta } : m
              ))
            }
          } catch { /* chunk parcial */ }
        }
      }
    } catch {
      setMsgs(prev => prev.map(m =>
        m.id === botId ? { ...m, content: 'Desculpe, ocorreu um erro. Tente novamente.' } : m
      ))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: TX, margin: '0 0 4px' }}>Bot IA</h1>
        <p style={{ fontSize: '14px', color: MT, margin: 0 }}>Assistente com dados reais do seu negócio</p>
      </div>

      <div style={{
        flex: 1, background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${BD}`,
        borderRadius: '16px', display: 'flex',
        flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {msgs.map(m => (
            <div key={m.id} style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '10px', alignItems: 'flex-start'
            }}>
              {m.role === 'assistant' && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c840e0, #9333ea)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '16px', flexShrink: 0
                }}>🤖</div>
              )}
              <div style={{
                maxWidth: '70%', padding: '12px 16px', borderRadius: '12px',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #c840e0, #9333ea)'
                  : 'rgba(255,255,255,0.05)',
                color: TX, fontSize: '14px', lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                border: m.role === 'assistant' ? `1px solid ${BD}` : 'none',
              }}>
                {m.content || (
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: MT, animation: 'pulse 1s infinite' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: MT, animation: 'pulse 1s infinite 0.15s' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: MT, animation: 'pulse 1s infinite 0.3s' }} />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Sugestões */}
        {msgs.length === 1 && (
          <div style={{ padding: '0 24px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {sugestoes.map(s => (
              <button key={s} onClick={() => enviar(s)}
                style={{
                  background: 'rgba(147,51,234,0.1)',
                  border: '1px solid rgba(147,51,234,0.25)',
                  borderRadius: '100px', padding: '6px 14px',
                  color: AC, fontSize: '13px',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}>{s}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              ref={inputRef}
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
              onFocus={e => (e.target.style.borderColor = AC)}
              onBlur={e => (e.target.style.borderColor = BD)}
            />
            <button onClick={() => enviar()} disabled={!input.trim() || loading}
              style={{
                padding: '12px 20px',
                background: BTN,
                border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer',
                fontFamily: 'inherit',
                opacity: !input.trim() || loading ? 0.5 : 1,
              }}>
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
