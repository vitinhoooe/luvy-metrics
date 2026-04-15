'use client'

import { useState, useRef, useEffect } from 'react'
import type { MensagemBot } from '@/types'

const SUGESTOES = [
  'O que devo comprar essa semana?',
  'Qual produto tem melhor margem agora?',
  'Meu estoque está baixo, o que repor?',
  'Quais tendências para o próximo mês?',
]

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  if (role === 'assistant') {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-[#c840e0] flex items-center justify-center text-base flex-shrink-0 shadow-md shadow-[#c840e0]/20">
        🤖
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-base flex-shrink-0">
      👤
    </div>
  )
}

export default function BotPage() {
  const [mensagens, setMensagens] = useState<MensagemBot[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Olá! Sou o assistente do LuvyMetrics 🤖\n\nTenho acesso aos seus dados de estoque e às tendências do mercado. Pode me perguntar sobre o que comprar, qual produto tem melhor margem ou quais tendências estão em alta. Como posso ajudar?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [digitando, setDigitando] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviar(texto?: string) {
    const conteudo = (texto ?? input).trim()
    if (!conteudo || digitando) return

    const msgUsuario: MensagemBot = {
      id: Date.now().toString(),
      role: 'user',
      content: conteudo,
      timestamp: new Date(),
    }

    setMensagens((prev) => [...prev, msgUsuario])
    setInput('')
    setDigitando(true)

    // Placeholder da resposta
    const idBot = (Date.now() + 1).toString()
    setMensagens((prev) => [...prev, { id: idBot, role: 'assistant', content: '', timestamp: new Date() }])

    try {
      const historico = mensagens
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: conteudo, historico }),
      })

      if (!res.ok || !res.body) throw new Error('Erro na resposta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let textoAcumulado = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const linhas = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const linha of linhas) {
          const dados = linha.replace('data: ', '').trim()
          if (dados === '[DONE]') break
          try {
            const { text } = JSON.parse(dados)
            textoAcumulado += text
            setMensagens((prev) =>
              prev.map((m) => (m.id === idBot ? { ...m, content: textoAcumulado } : m))
            )
          } catch {
            // chunk parcial, ignora
          }
        }
      }
    } catch {
      setMensagens((prev) =>
        prev.map((m) =>
          m.id === idBot ? { ...m, content: 'Desculpe, ocorreu um erro. Tente novamente.' } : m
        )
      )
    } finally {
      setDigitando(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Bot IA</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Assistente especializado em sex shop com dados do seu negócio</p>
      </div>

      {/* Chat */}
      <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensagens.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <Avatar role={msg.role} />
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#c840e0] text-white rounded-br-sm'
                    : 'bg-white/[0.06] border border-white/10 text-zinc-100 rounded-bl-sm'
                }`}
              >
                {msg.content || (
                  <span className="flex gap-1 items-center py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Sugestões */}
        {mensagens.length === 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                onClick={() => enviar(s)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs hover:text-white hover:bg-white/10 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-white/5 p-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              placeholder="Pergunte sobre estoque, tendências, lucro..."
              disabled={digitando}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40 disabled:opacity-50 transition-all"
            />
            <button
              onClick={() => enviar()}
              disabled={!input.trim() || digitando}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-[#c840e0] text-white disabled:opacity-40 hover:opacity-90 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-2 text-center">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      </div>
    </div>
  )
}
