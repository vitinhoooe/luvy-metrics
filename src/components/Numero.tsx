'use client'
import { useEffect, useRef, useState } from 'react'
import { brl, num } from '@/lib/formato'

/** Número que conta de 0 até o valor ao aparecer (uma vez). Sem animação para quem prefere movimento reduzido. */
export function Numero({ valor, tipo = 'brl', duracao = 1100 }: { valor: number; tipo?: 'brl' | 'num'; duracao?: number }) {
  const [v, setV] = useState(valor)
  const feito = useRef(false)
  useEffect(() => {
    if (feito.current) { setV(valor); return }
    feito.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || valor === 0) { setV(valor); return }
    let raf = 0
    const t0 = performance.now()
    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / duracao)
      const e = 1 - Math.pow(1 - p, 3)
      setV(valor * e)
      if (p < 1) raf = requestAnimationFrame(passo)
    }
    setV(0)
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [valor, duracao])
  return <>{tipo === 'brl' ? brl(v) : num(Math.round(v))}</>
}
