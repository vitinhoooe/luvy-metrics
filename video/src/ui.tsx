/* Peças compartilhadas: tema, tempo da narração, legenda, fundo 3D, marca 3D. */
import { ThreeCanvas } from '@remotion/three'
import { loadFont } from '@remotion/google-fonts/Sora'
import { useMemo } from 'react'
import * as THREE from 'three'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import vozJson from './voz.json'
import { CENAS, FPS, RESPIRO, TRANSICAO } from './roteiro'

export const { fontFamily } = loadFont('normal', { weights: ['400', '600', '700', '800'], subsets: ['latin', 'latin-ext'] })

export const COR = {
  fundo: '#0b0b0d', tinta: '#f4f4f4', dim: '#8a8a8e', fio: 'rgba(255,255,255,.1)',
  ui: '#f3f3f4', uiTinta: '#141416', laranja: '#e0782f', verde: '#2f9e6b', vermelho: '#e5484d', rosa: '#e9a7a0',
}

/* ---------- tempo da narração ---------- */
type Palavra = { p: string; ini: number; fim: number }
type Voz = Record<string, { duracao: number; palavras: Palavra[] }>
const VOZ = vozJson as Voz
export const temVoz = (id: string) => Boolean(VOZ[id])

export function duracaoFala(id: string) {
  return VOZ[id]?.duracao ?? CENAS.find(c => c.id === id)!.segundos
}
/** quadros da cena dentro da TransitionSeries (fala + respiro + sobreposição da transição) */
export function quadrosCena(id: string) {
  return Math.round((duracaoFala(id) + RESPIRO) * FPS) + TRANSICAO
}
/** palavras com tempo; sem áudio, espalha as palavras pela duração */
export function palavras(id: string): Palavra[] {
  if (VOZ[id]) return VOZ[id].palavras
  const ws = CENAS.find(c => c.id === id)!.fala.split(/\s+/)
  const d = duracaoFala(id) / ws.length
  return ws.map((p, i) => ({ p, ini: i * d, fim: (i + 1) * d }))
}
/** segundo em que a palavra (começo dela) é dita */
export function quando(id: string, inicio: string, fallback = 0) {
  const alvo = inicio.toLowerCase()
  const w = palavras(id).find(x => x.p.toLowerCase().replace(/[^\p{L}]/gu, '').startsWith(alvo))
  return w ? w.ini : fallback
}

/* ---------- curvas ---------- */
export const saida = Easing.bezier(0.16, 1, 0.3, 1)
export const mola = Easing.bezier(0.34, 1.56, 0.64, 1)
export function anima(frame: number, [a, b]: [number, number], [x, y]: [number, number], easing = saida) {
  return interpolate(frame, [a, b], [x, y], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })
}

/* ---------- legenda com a palavra da vez acesa ---------- */
export const Legenda: React.FC<{ id: string; atraso?: number }> = ({ id, atraso = 0 }) => {
  const frame = useCurrentFrame()
  const t = (frame - atraso) / FPS
  const ws = palavras(id)
  if (t < -0.2) return null
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70, pointerEvents: 'none' }}>
      <div style={{ maxWidth: 1500, textAlign: 'center', fontFamily, fontSize: 44, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em',
        padding: '14px 30px', borderRadius: 18, background: 'rgba(8,8,10,.55)', backdropFilter: 'blur(10px)',
        opacity: anima(frame, [atraso - 4, atraso + 4], [0, 1]) }}>
        {ws.map((w, i) => {
          const dita = t >= w.ini
          const agora = t >= w.ini && t < w.fim + 0.08
          return (
            <span key={i} style={{ color: agora ? '#fff' : dita ? '#d7d7da' : 'rgba(255,255,255,.35)', marginRight: '0.28em',
              display: 'inline-block', translate: agora ? '0 -2px' : '0 0', textShadow: agora ? '0 0 24px rgba(255,255,255,.35)' : 'none' }}>
              {w.p}
            </span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/* ---------- fundo 3D: cubos e partículas que flutuam (tudo pelo frame) ---------- */
function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646 }

export const Fundo3D: React.FC<{ seed?: number; velocidade?: number; tom?: string; opacidade?: number }> = ({ seed = 3, velocidade = 1, tom = '#4a4a55', opacidade = 1 }) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const cubos = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: 34 }, () => ({
      x: (r() - 0.5) * 22, y: (r() - 0.5) * 12, z: -r() * 18 - 2, s: 0.25 + r() * 0.7,
      rx: r() * 6, ry: r() * 6, v: 0.004 + r() * 0.012,
    }))
  }, [seed])
  return (
    <AbsoluteFill style={{ opacity: opacidade }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 6, 8]} intensity={1.4} />
        <pointLight position={[-6, -3, 4]} intensity={18} color="#e9a7a0" />
        {cubos.map((c, i) => (
          <mesh key={i} position={[c.x + Math.sin((frame + i * 13) * 0.01) * 0.4, c.y + Math.cos((frame + i * 7) * 0.012) * 0.4, c.z + ((frame * c.v * velocidade * 3) % 6)]}
            rotation={[c.rx + frame * c.v * velocidade, c.ry + frame * c.v * 0.7 * velocidade, 0]}>
            <boxGeometry args={[c.s, c.s, c.s]} />
            <meshStandardMaterial color={tom} metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
      </ThreeCanvas>
    </AbsoluteFill>
  )
}

/* ---------- a marca do LuvyMetrics em 3D (extrudada, metal) ---------- */
function formaMarca() {
  // L de gráfico: traços engrossados como contornos
  const traco = (pts: [number, number][], w: number) => {
    const s = new THREE.Shape()
    const esq: [number, number][] = [], dir: [number, number][] = []
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1
      const nx = -dy / L * w, ny = dx / L * w
      esq.push([p[0] + nx, p[1] + ny]); dir.push([p[0] - nx, p[1] - ny])
    })
    const todos = [...esq, ...dir.reverse()]
    s.moveTo(...todos[0]); todos.slice(1).forEach(p => s.lineTo(...p)); s.closePath()
    return s
  }
  const eixo = traco([[-1, 1.1], [-1, -1], [1.25, -1]], 0.13)
  const linha = traco([[-0.55, -0.35], [-0.05, 0.15], [0.35, -0.1], [0.92, 0.55]], 0.11)
  const bola = new THREE.Shape(); bola.absarc(1.0, 0.68, 0.24, 0, Math.PI * 2, false)
  return [eixo, linha, bola]
}

export const Marca3D: React.FC<{ giro: number; escala?: number; y?: number }> = ({ giro, escala = 1, y = 0 }) => {
  const formas = useMemo(formaMarca, [])
  return (
    <group rotation={[0.15, giro, 0]} scale={escala} position={[0, y, 0]}>
      {formas.map((f, i) => (
        <mesh key={i} position={[-0.1, -0.05, -0.2]}>
          <extrudeGeometry args={[f, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 4 }]} />
          <meshStandardMaterial color={i === 2 ? '#f2c4bc' : '#e8e8ec'} metalness={0.85} roughness={0.22} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- moldura de janela (navegador/app) ---------- */
export const Janela: React.FC<{ titulo: string; cor?: string; children?: React.ReactNode; w?: number; h?: number; style?: React.CSSProperties }> = ({ titulo, cor = '#fff', children, w = 520, h = 330, style }) => (
  <div style={{ position: 'absolute', width: w, height: h, borderRadius: 18, overflow: 'hidden', background: COR.ui, color: COR.uiTinta, fontFamily,
    boxShadow: '0 40px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08)', ...style }}>
    <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: cor, borderBottom: '1px solid #e2e2e5' }}>
      {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
      <span style={{ marginLeft: 12, fontSize: 19, fontWeight: 600 }}>{titulo}</span>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
)

export const brl = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
