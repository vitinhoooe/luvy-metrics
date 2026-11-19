'use client'
import { useId } from 'react'
import { brl } from '@/lib/formato'

/**
 * A linha da marca virando dado: vendas dos últimos dias, desenhada ao abrir,
 * terminando no ponto rosa (igual ao logo).
 */
export function Tendencia({ dias }: { dias: { rotulo: string; total: number }[] }) {
  const id = useId().replace(/:/g, '')
  const L = 260, A = 84, M = 8
  const max = Math.max(...dias.map((d) => d.total), 1)
  const pts = dias.map((d, i) => [M + (i * (L - 2 * M)) / Math.max(dias.length - 1, 1), A - M - (d.total / max) * (A - 2 * M - 6)] as const)
  // curva suave (Catmull-Rom → Bézier)
  const linha = pts.reduce((acc, p, i, arr) => {
    if (i === 0) return `M${p[0]},${p[1]}`
    const p0 = arr[i - 2] ?? arr[i - 1], p1 = arr[i - 1], p2 = p, p3 = arr[i + 1] ?? p
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    return `${acc} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }, '')
  const ultimo = pts[pts.length - 1]
  const area = `${linha} L${ultimo[0]},${A} L${pts[0][0]},${A} Z`
  const semVendas = dias.every((d) => d.total === 0)

  return (
    <figure className="lv-tendencia" aria-label={`Vendas dos últimos ${dias.length} dias`}>
      <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0508c" stopOpacity=".32" />
            <stop offset="1" stopColor="#f0508c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f0508c" stopOpacity=".35" />
            <stop offset="1" stopColor="#ff8fb8" />
          </linearGradient>
        </defs>
        {!semVendas && <path className="area" d={area} fill={`url(#a${id})`} />}
        <path className="traco" pathLength={1} d={linha} fill="none" stroke={`url(#s${id})`} strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="ponto" style={{ left: `${(ultimo[0] / L) * 100}%`, top: `${(ultimo[1] / A) * 100}%` }} aria-hidden />
      <figcaption>
        {dias.map((d, i) => (
          <span key={i} title={`${d.rotulo}: ${brl(d.total)}`}>{d.rotulo}</span>
        ))}
      </figcaption>
    </figure>
  )
}
