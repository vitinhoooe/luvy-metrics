'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Fica de olho em pedidos novos da vitrine enquanto o app estiver aberto:
 * toca um som, mostra um aviso na tela e (se ela permitir) uma notificação do navegador.
 * `simular`: na prévia, dispara um pedido de exemplo para mostrar como é.
 */
export function AlertaPedidos({ simular }: { simular?: boolean }) {
  const [novo, setNovo] = useState<{ numero: number; cliente: string; total: number } | null>(null)
  const [permissao, setPermissao] = useState<NotificationPermission | 'sem'>('sem')
  const visto = useRef<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof Notification !== 'undefined') setPermissao(Notification.permission)
  }, [])

  useEffect(() => {
    if (simular) {
      const t = setTimeout(() => avisar({ numero: 43, cliente: 'Cliente de exemplo', total: 89.9 }), 4000)
      return () => clearTimeout(t)
    }
    const supabase = createClient()
    let parado = false
    async function olhar() {
      const { data } = await supabase.from('pedidos').select('id, numero, cliente_nome, total').eq('status', 'novo').order('criado_em', { ascending: false }).limit(1)
      const ultimo = data?.[0]
      if (parado || !ultimo) return
      if (visto.current === null) { visto.current = ultimo.id; return } // primeira olhada: só memoriza
      if (ultimo.id !== visto.current) {
        visto.current = ultimo.id
        avisar({ numero: ultimo.numero, cliente: ultimo.cliente_nome, total: Number(ultimo.total) })
        router.refresh()
      }
    }
    olhar()
    const id = setInterval(olhar, 20_000)
    return () => { parado = true; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simular])

  function avisar(p: { numero: number; cliente: string; total: number }) {
    setNovo(p)
    tocar()
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(`Pedido #${p.numero} na sua vitrine`, { body: `${p.cliente} · R$ ${p.total.toFixed(2).replace('.', ',')}`, tag: 'luvy-pedido' }) } catch {}
    }
    setTimeout(() => setNovo(null), 12_000)
  }

  return (
    <>
      {permissao === 'default' && (
        <button type="button" className="lv-ativar-alerta" onClick={async () => setPermissao(await Notification.requestPermission())}>
          🔔 Ativar aviso de pedido novo
        </button>
      )}
      {novo && (
        <a href={simular ? '/previa/pedidos' : '/pedidos?f=novo'} className="lv-toast" role="status" aria-live="assertive">
          <span className="lv-toast-sino" aria-hidden>🛍️</span>
          <span><strong>Pedido #{novo.numero} chegou!</strong><small>{novo.cliente} · R$ {novo.total.toFixed(2).replace('.', ',')}</small></span>
          <span className="lv-btn pq">Ver</span>
        </a>
      )}
    </>
  )
}

/** "Plim" curto feito no próprio navegador (sem arquivo de áudio). */
function tocar() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const nota = (freq: number, ini: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime + ini)
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + ini + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ini + 0.5)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + ini); o.stop(ctx.currentTime + ini + 0.55)
    }
    nota(880, 0); nota(1320, 0.14)
    setTimeout(() => ctx.close(), 1000)
  } catch {}
}
