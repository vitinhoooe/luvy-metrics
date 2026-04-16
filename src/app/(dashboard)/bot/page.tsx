'use client'

import { useState, useRef, useEffect } from 'react'

type Msg = { id: string; role: 'user' | 'assistant'; content: string }

const SUGESTOES = [
  '🔥 O que comprar essa semana?',
  '📦 Como está meu estoque?',
  '💰 Qual produto tem melhor margem?',
  '📈 Quais tendências estão explodindo?',
]

export default function BotPage() {
  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [msgs,      setMsgs]      = useState<Msg[]>([{
    id: '0', role: 'assistant',
    content: 'Olá! Sou o assistente do LuvyMetrics.\n\nTenho acesso aos seus dados de estoque e às tendências do mercado agora. O que você quer saber?',
  }])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim()
    if (!msg || loading) return

    const userMsg: Msg = { id: Date.now().toString(), role: 'user', content: msg }
    const botId = (Date.now() + 1).toString()

    setMsgs((prev) => [...prev, userMsg, { id: botId, role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    try {
      const historico = msgs
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...historico, { role: 'user', content: msg }] }),
      })

      if (!res.ok || !res.body) throw new Error()

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let acumulado = ''

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
            // AI SDK data stream format: {type:'text-delta', textDelta:'...'}
            const delta =
              parsed?.textDelta ??
              parsed?.text ??
              (parsed?.choices?.[0]?.delta?.content) ?? ''
            if (delta) {
              acumulado += delta
              setMsgs((prev) => prev.map((m) => m.id === botId ? { ...m, content: acumulado } : m))
            }
          } catch { /* chunk parcial */ }
        }
      }
    } catch {
      setMsgs((prev) => prev.map((m) =>
        m.id === botId ? { ...m, content: 'Desculpe, ocorreu um erro. Tente novamente.' } : m
      ))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-104px)] max-w-3xl mx-auto">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Assistente IA</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
          Especialista em sex shop com acesso aos seus dados em tempo real
        </p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden rounded-xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {msgs.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                style={{
                  background: msg.role === 'assistant' ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border)',
                }}>
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl"
                style={msg.role === 'user'
                  ? { background: 'var(--accent)', color: '#fff', borderBottomRightRadius: 4 }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)', borderBottomLeftRadius: 4 }}>
                {msg.content || (
                  <span className="flex gap-1 items-center py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: 'var(--muted)' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: 'var(--muted)' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--muted)' }} />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Sugestões */}
        {msgs.length === 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2 flex-shrink-0">
            {SUGESTOES.map((s) => (
              <button key={s} onClick={() => enviar(s)}
                className="px-3 py-1.5 rounded-full text-xs transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              placeholder="Pergunte sobre estoque, tendências, lucro..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            <button onClick={() => enviar()} disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-lg text-white disabled:opacity-40 transition-opacity"
              style={{ background: 'var(--accent)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center" style={{ fontSize: 11, color: 'var(--muted2)' }}>Enter para enviar</p>
        </div>
      </div>
    </div>
  )
}
