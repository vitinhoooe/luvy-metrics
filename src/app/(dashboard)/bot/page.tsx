'use client'

import { useState, useRef, useEffect } from 'react'

// ─── Cores ────────────────────────────────────────────────────────
const TX  = '#f5f0ff'
const MT  = '#9d8faa'
const MT2 = '#6d6079'
const AC  = '#c840e0'
const BD  = 'rgba(200,64,224,0.15)'

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

  const [msgs,    setMsgs]    = useState<Msg[]>([{
    id: '0', role: 'assistant',
    content: 'Olá! Sou o assistente do LuvyMetrics 🤖\n\nTenho acesso aos seus dados de estoque e às tendências do mercado agora. Posso te ajudar com:\n\n• O que comprar essa semana\n• Como está seu estoque\n• Calcular lucro de qualquer produto\n• Tendências em alta hoje\n\nO que você quer saber?',
  }])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)

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

      if (!res.ok || !res.body) throw new Error('Resposta inválida')

      const reader  = res.body.getReader()
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
            // Suporta formato manual {textDelta} e formato AI SDK {type, textDelta}
            const delta = parsed?.textDelta ?? parsed?.text ?? parsed?.choices?.[0]?.delta?.content ?? ''
            if (delta) {
              setMsgs((prev) => prev.map((m) =>
                m.id === botId ? { ...m, content: m.content + delta } : m
              ))
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
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <div className="flex flex-col max-w-3xl mx-auto" style={{ height: 'calc(100vh - 104px)' }}>
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold" style={{ color: TX }}>Assistente IA</h1>
        <p style={{ fontSize: 13, color: MT, marginTop: 2 }}>
          Especialista em sex shop com acesso aos seus dados em tempo real
        </p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BD}` }}>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {msgs.map((msg) => (
            <div key={msg.id}
              className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                style={{
                  background: msg.role === 'assistant' ? AC : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${BD}`,
                }}>
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl"
                style={msg.role === 'user'
                  ? { background: AC, color: '#fff', borderBottomRightRadius: 4 }
                  : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${BD}`, color: TX, borderBottomLeftRadius: 4 }}>
                {msg.content || (
                  <span className="flex gap-1 items-center py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: MT, animationDelay: '-0.3s' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: MT, animationDelay: '-0.15s' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: MT }} />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Sugestões (só na primeira mensagem) */}
        {msgs.length === 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2 flex-shrink-0">
            {SUGESTOES.map((s) => (
              <button key={s} onClick={() => enviar(s)}
                className="px-3 py-1.5 rounded-full text-xs transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BD}`, color: MT }}
                onMouseEnter={(e) => { e.currentTarget.style.color = TX; e.currentTarget.style.borderColor = 'rgba(200,64,224,0.35)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = MT; e.currentTarget.style.borderColor = BD }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 p-4" style={{ borderTop: `1px solid ${BD}` }}>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              placeholder="Pergunte sobre estoque, tendências, lucro..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BD}`, color: TX }}
              onFocus={(e) => (e.target.style.borderColor = AC)}
              onBlur={(e) => (e.target.style.borderColor = BD)}
            />
            <button onClick={() => enviar()} disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-lg text-white disabled:opacity-40 transition-opacity"
              style={{ background: AC }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center" style={{ fontSize: 11, color: MT2 }}>Enter para enviar · Shift+Enter nova linha</p>
        </div>
      </div>
    </div>
  )
}
