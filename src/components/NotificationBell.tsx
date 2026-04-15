'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notificacao } from '@/types'

const icones: Record<string, string> = {
  tendencia: '🔥',
  estoque:   '📦',
  trial:     '💰',
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchNotificacoes()

    const channel = supabase
      .channel('notificacoes-realtime')
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

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  async function fetchNotificacoes() {
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotificacoes(data)
  }

  async function marcarLida(id: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
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
        className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
        aria-label="Notificações"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#c840e0] rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0d0a13] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Notificações</h3>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="text-xs text-[#c840e0] hover:text-purple-300 transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notificacoes.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-zinc-500">Nenhuma notificação ainda</p>
              </div>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => marcarLida(n.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${!n.lida ? 'bg-[#c840e0]/5' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg leading-none mt-0.5">{icones[n.tipo] ?? '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{n.titulo}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.mensagem}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
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
