// O "mundo": as telas reais do app soltas num espaço 3D, e uma câmera que voa entre elas.
// Uma câmera só, contínua, do começo ao fim (nada de corte seco entre telas).
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from 'remotion'
import { CENAS, COR, EASE, clamp, fontFamily } from './sistema'

// tela real = 1440x900 (capturada em 2x). No mundo, cada placa tem 1200x750.
export const PLACA = { w: 1200, h: 750 }
const DX = 1420, DY = 930

// mural 4x3: quando a câmera recua no final, vira um painel com o produto inteiro
const LAYOUT: string[][] = [
  ['vitrine', 'pedidos', 'conciliar', 'atendente'],
  ['fornecedores', 'hoje', 'vender', 'clientes'],
  ['importar', 'conta-nova', 'repor', 'parado'],
]
export type Placa = { id: string; x: number; y: number; z: number; ry: number; rx: number }
export const PLACAS: Placa[] = LAYOUT.flatMap((linha, r) =>
  linha.map((id, c) => ({
    id,
    x: (c - 1.5) * DX,
    y: (r - 1) * DY,
    z: Math.round((random(`z-${id}`) - 0.5) * 360),
    ry: (random(`ry-${id}`) - 0.5) * 6,
    rx: (random(`rx-${id}`) - 0.5) * 4,
  })),
)
const placa = (id: string) => PLACAS.find((p) => p.id === id)!

// ---------- CÂMERA ----------
// cada ponto: onde a câmera está (x, y, z) e para onde gira (ry, rx).
// "foco": a placa fica à direita (o texto ocupa a esquerda da grade).
type Cam = { f: number; x: number; y: number; z: number; ry: number; rx: number }
const foco = (id: string, f: number, o: Partial<Omit<Cam, 'f'>> = {}): Cam => {
  const p = placa(id)
  return { f, x: p.x - 420 + (o.x ?? 0), y: p.y + 20 + (o.y ?? 0), z: p.z + 380 + (o.z ?? 0), ry: (o.ry ?? -9), rx: o.rx ?? 2 }
}
const LONGE: Omit<Cam, 'f'> = { x: 0, y: 0, z: 9000, ry: 0, rx: 0 }
const MURAL: Omit<Cam, 'f'> = { x: 0, y: 30, z: 5600, ry: 0, rx: 0 }
const C = CENAS
// sempre há movimento: entre "chega" e "sai" da mesma cena a câmera segue derivando
export const CAMINHO: Cam[] = [
  { f: 0, ...LONGE, ry: 6 },
  { f: C.abertura.ate - 40, ...LONGE, z: 7600, ry: -4 },
  foco('pedidos', C.pedido.de + 24, { z: 520, ry: -14 }),
  foco('pedidos', C.pedido.ate - 30, { z: 160, ry: -6 }),
  foco('vender', C.balcao.de + 24, { z: 420, ry: -12, rx: -2 }),
  foco('vender', C.balcao.ate - 30, { z: 120, x: 60, ry: -5 }),
  foco('conciliar', C.pix.de + 24, { z: 460, ry: -14, rx: 3 }),
  foco('conciliar', C.pix.ate - 30, { z: 140, ry: -6 }),
  foco('repor', C.repor.de + 24, { z: 420, ry: -12 }),
  foco('repor', C.repor.de + 80, { z: 220, ry: -7 }),
  foco('parado', C.repor.de + 120, { z: 300, ry: -10 }),
  foco('parado', C.repor.ate - 30, { z: 160, ry: -6 }),
  foco('importar', C.comeco.de + 24, { z: 420, ry: -12 }),
  foco('importar', C.comeco.de + 80, { z: 240, ry: -8 }),
  foco('conta-nova', C.comeco.de + 120, { z: 300, ry: -10 }),
  foco('conta-nova', C.comeco.ate - 24, { z: 120, ry: -5 }),
  { f: C.mural.de + 90, ...MURAL, ry: 8, rx: 4 },
  { f: C.mural.de + 240, ...MURAL, z: 5100, ry: -6, rx: 2 },
  { f: C.mural.ate - 10, ...LONGE, ry: 6 },
  { f: C.mural.ate, ...LONGE, ry: 6 },
]

export function camera(frame: number): Omit<Cam, 'f'> {
  const i = Math.max(0, CAMINHO.findIndex((c, k) => frame >= c.f && frame < (CAMINHO[k + 1]?.f ?? Infinity)))
  const a = CAMINHO[i], z = CAMINHO[i + 1] ?? a
  const t = z === a ? 0 : EASE.camera(Math.min(1, Math.max(0, (frame - a.f) / (z.f - a.f))))
  const mix = (k: keyof Omit<Cam, 'f'>) => a[k] + (z[k] - a[k]) * t
  return { x: mix('x'), y: mix('y'), z: mix('z'), ry: mix('ry'), rx: mix('rx') }
}

const PERSP = 2000

// ---------- PARTÍCULAS (poeira de luz em profundidade) ----------
const PONTOS = Array.from({ length: 90 }, (_, i) => ({
  x: (random(`px${i}`) - 0.5) * 9000, y: (random(`py${i}`) - 0.5) * 5200, z: -random(`pz${i}`) * 9000 + 1200,
  r: 2 + random(`pr${i}`) * 5, cor: random(`pc${i}`) > 0.5 ? COR.rosa : COR.violeta, v: 0.3 + random(`pv${i}`) * 0.8,
}))

export const Mundo: React.FC<{ visivel: number }> = ({ visivel }) => {
  const frame = useCurrentFrame()
  const cam = camera(frame)
  // placa em foco = a mais perto do centro da câmera (as outras apagam: profundidade de campo "barata")
  const alvo = { x: cam.x + 420, y: cam.y - 20 }
  return (
    <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: '50% 50%', opacity: visivel }}>
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d',
        transform: `rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) translate3d(${-cam.x}px, ${-cam.y}px, ${-cam.z}px)`,
      }}>
        {PONTOS.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', width: p.r * 2, height: p.r * 2, borderRadius: '50%', background: p.cor,
            opacity: 0.18 + 0.25 * Math.sin(frame / 40 + i),
            boxShadow: `0 0 ${p.r * 6}px ${p.cor}`,
            transform: `translate3d(${p.x + Math.sin(frame / 90 + i) * 40}px, ${p.y - frame * p.v}px, ${p.z}px)`,
          }} />
        ))}
        {PLACAS.map((p) => {
          const dist = Math.hypot(p.x - alvo.x, p.y - alvo.y)
          const foco = cam.z > 3000 ? 1 : interpolate(dist, [0, 900, 1600], [1, 0.42, 0.18], clamp)
          return <PlacaTela key={p.id} p={p} foco={foco} frame={frame} />
        })}
      </div>
    </AbsoluteFill>
  )
}

const PlacaTela: React.FC<{ p: Placa; foco: number; frame: number }> = ({ p, foco, frame }) => (
  <div style={{
    position: 'absolute', width: PLACA.w, height: PLACA.h, marginLeft: -PLACA.w / 2, marginTop: -PLACA.h / 2,
    transform: `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${p.ry}deg) rotateX(${p.rx}deg)`,
    borderRadius: 22, overflow: 'hidden', opacity: foco, background: '#fff',
    boxShadow: `0 80px 160px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08), 0 0 ${120 * foco}px rgba(214,60,160,${0.22 * foco})`,
  }}>
    {/* a imagem é um pouco mais larga para esconder a barra de rolagem da captura */}
    <Img src={staticFile(`telas/${p.id}.png`)} style={{ width: PLACA.w * 1.012, height: PLACA.h, objectFit: 'cover', objectPosition: 'left top', display: 'block' }} />
    {/* reflexo que corre pela placa conforme a câmera anda */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `linear-gradient(115deg, transparent ${30 + ((frame * 0.35 + p.x / 40) % 80)}%, rgba(255,255,255,.16) ${36 + ((frame * 0.35 + p.x / 40) % 80)}%, transparent ${44 + ((frame * 0.35 + p.x / 40) % 80)}%)`,
    }} />
    <div style={{ position: 'absolute', inset: 0, background: COR.fundo, opacity: (1 - foco) * 0.5 }} />
  </div>
)

export const SeloExemplo: React.FC = () => (
  <div style={{ position: 'absolute', right: 40, bottom: 34, fontFamily, fontSize: 18, fontWeight: 500, color: 'rgba(247,239,245,.5)', letterSpacing: '0.02em' }}>
    Telas reais do LuvyMetrics · dados de exemplo
  </div>
)
