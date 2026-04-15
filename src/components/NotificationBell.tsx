'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Notificacao } from '@/types'

// Converte data em tempo relativo legível
function tempoRelativo(data: string) {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1)  return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

const ICONES: Record<string, string> = {
  tendencia: '🔥',
  estoque:   '📦',
  trial:     '💰',
}

const DESTINOS: Record<string, string> = {
  tendencia: '/tendencias',
  estoque:   '/estoque',
  trial:     '/configuracoes',
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Busca inicial + Realtime
  useEffect(() => {
    buscar()

    const channel = supabase
      .channel(`notificacoes-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotificacoes((prev) => [payload.new as Notificacao, ...prev])
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [userId])

  async function buscar() {
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15)
    if (data) setNotificacoes(data)
  }

  async function marcarLida(id: string, tipo: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    // Navega para a página relacionada
    const destino = DESTINOS[tipo]
    if (destino) { setAberto(false); router.push(destino) }
  }

  async function marcarTodasLidas() {
    await supabase.from('notificacoes').update({ lida: true }).eq('user_id', userId).eq('lida', false)
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        aria-label="Notificações"
        className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1 animate-pulse">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0d0a13] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Notificações {naoLidas > 0 && <span className="text-[#c840e0]">({naoLidas})</span>}
            </h3>
            {naoLidas > 0 && (
              <button onClick={marcarTodasLidas} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
            {notificacoes.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-zinc-500">Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => marcarLida(n.id, n.tipo)}
                  className={`px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${!n.lida ? 'bg-[#c840e0]/5' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl leading-none mt-0.5 flex-shrink-0">
                      {ICONES[n.tipo] ?? '🔔'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white leading-snug">{n.titulo}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.mensagem}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">{tempoRelativo(n.created_at)}</p>
                    </div>
                    {!n.lida && (
                      <div className="w-2 h-2 rounded-full bg-[#c840e0] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
