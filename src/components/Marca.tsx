'use client'
import { useEffect, useId, useState } from 'react'

/**
 * A marca do LuvyMetrics (eixo + linha subindo + ponto), a mesma da landing.
 * animar: desenha o traço ao aparecer. brilho: um reflexo rosa percorre a linha de tempos em tempos.
 */
export function Marca({
  size = 28,
  tom = 'claro',
  animar = false,
  brilho = true,
}: {
  size?: number
  tom?: 'claro' | 'escuro'
  animar?: boolean
  brilho?: boolean
}) {
  const id = useId().replace(/:/g, '')
  const [movimento, setMovimento] = useState(false)
  useEffect(() => {
    setMovimento(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])
  const eixo = tom === 'claro' ? '#f4eef5' : '#1e1720'

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`lv-marca${animar ? ' animar' : ''}`} aria-hidden>
      <defs>
        <linearGradient id={`l${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f0508c" />
          <stop offset=".5" stopColor="#ffd1e2" />
          <stop offset="1" stopColor="#f0508c" />
          {brilho && movimento && (
            <animateTransform attributeName="gradientTransform" type="translate" values="-1 0; -1 0; 1 0" keyTimes="0; .78; 1" dur="7s" repeatCount="indefinite" />
          )}
        </linearGradient>
        <radialGradient id={`h${id}`}>
          <stop offset="0" stopColor="#f0508c" stopOpacity=".55" />
          <stop offset="1" stopColor="#f0508c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="eixo" pathLength={1} d="M8 6v19h18" stroke={eixo} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path className="linha" pathLength={1} d="M11.5 20l4.5-4.5 3.4 2.6 5.6-7" stroke={`url(#l${id})`} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="halo" cx="25" cy="11.1" r="6" fill={`url(#h${id})`} />
      <circle className="ponto" cx="25" cy="11.1" r="2.5" fill="#f0508c" />
    </svg>
  )
}

/** Marca + nome, para o menu e o topo. */
export function Logotipo({ tom = 'claro', animar = false }: { tom?: 'claro' | 'escuro'; animar?: boolean }) {
  return (
    <span className={`lv-logotipo ${tom}`}>
      <Marca size={26} tom={tom} animar={animar} />
      <span>Luvy<b>Metrics</b></span>
    </span>
  )
}
