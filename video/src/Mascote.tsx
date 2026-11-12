/*
 * O personagem em 3D: a bolinha do logo do LuvyMetrics, brilhante como um brinquedo,
 * com olhos, bochechas, pés e um braço. Em cada troca de cena gira o laço, joga a corda,
 * engancha a cena nova e puxa (junto com a transição "puxar"). Tudo calculado pelo frame.
 * Câmera ortográfica em pixels: o que está em px na tela vira x = px − 960, y = 540 − py.
 */
import { ThreeCanvas } from '@remotion/three'
import { useMemo } from 'react'
import * as THREE from 'three'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { TIMING } from './puxar'
import { CENAS, FPS, TRANSICAO } from './roteiro'
import { quadrosCena, quando } from './ui'

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const sai = (t: number) => 1 - Math.pow(1 - clamp(t), 3)

/** quadro em que cada cena começa na linha do tempo */
export function inicios() {
  let t = 0
  return CENAS.map(c => { const s = t; t += quadrosCena(c.id) - TRANSICAO; return s })
}

const BASE = { x: 175, y: 760 }
const R = 66
const ALVO_Y = 560
const GANCHO = 340
const BRACO = 38 // comprimento do bracinho

type P = { x: number; y: number }

/** tubo 3D por uma curva em px da tela */
const Tubo: React.FC<{ pts: P[]; raio: number; cor: string; conv: (p: P, z?: number) => THREE.Vector3; z?: number }> = ({ pts, raio, cor, conv, z = 30 }) => {
  const geo = useMemo(() => {
    const curva = pts.length === 3
      ? new THREE.QuadraticBezierCurve3(conv(pts[0], z), conv(pts[1], z), conv(pts[2], z))
      : new THREE.CatmullRomCurve3(pts.map(p => conv(p, z)))
    return new THREE.TubeGeometry(curva, 48, raio, 10, false)
  }, [pts, raio, conv, z])
  return <mesh geometry={geo}><meshStandardMaterial color={cor} roughness={0.75} metalness={0.05} /></mesh>
}

export const Mascote: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const conv = useMemo(() => (p: P, z = 0) => new THREE.Vector3(p.x - width / 2, height / 2 - p.y, z), [width, height])
  const ini = inicios()

  // fase em relação à troca de cena mais próxima
  let fase: 'parado' | 'gira' | 'joga' | 'puxa' | 'solta' = 'parado'
  let tt = 0, p = 0
  for (let k = 1; k < ini.length; k++) {
    const d = frame - ini[k]
    if (d >= -18 && d < -6) { fase = 'gira'; tt = d + 18; break }
    if (d >= -6 && d < 0) { fase = 'joga'; tt = d + 6; break }
    if (d >= 0 && d < TRANSICAO) { fase = 'puxa'; tt = d; p = TIMING.getProgress({ frame: d, fps }); break }
    if (d >= TRANSICAO && d < TRANSICAO + 12) { fase = 'solta'; tt = d - TRANSICAO; break }
  }

  // entrada: cai do alto e quica
  const queda = frame < 26 ? interpolate(frame, [0, 14, 20, 26], [-300, 0, -34, 0], { extrapolateRight: 'clamp' }) : 0
  const amassa = frame >= 12 && frame < 22 ? 1 - Math.sin(((frame - 12) / 10) * Math.PI) * 0.24 : 1

  let x = BASE.x, y = BASE.y + queda + Math.sin(frame / 9) * 5
  let incl = Math.sin(frame / 23) * 3 // graus, sentido horário positivo
  let sy = amassa * (1 + Math.sin(frame / 9) * 0.03)
  let viraY = 0.18 + Math.sin(frame / 40) * 0.1 // de três quartos, olhando para a direita
  if (fase === 'gira') { y -= 8; incl = -4; viraY = 0.15 }
  if (fase === 'joga') { incl = 12 * sai(tt / 6); x += 10 * sai(tt / 6); viraY = 0.35 }
  if (fase === 'puxa') {
    const forca = Math.sin(clamp(tt / TRANSICAO) * Math.PI)
    incl = -20 * clamp(tt / 6) + Math.sin(frame * 1.7) * 2 * forca
    x -= 28 * forca
    sy = 0.88 + 0.12 * (1 - forca)
    viraY = 0.3
  }
  if (fase === 'solta') { const h = Math.sin((tt / 12) * Math.PI); y -= 40 * h; sy = 1 + 0.1 * h; incl = lerp(-10, 0, tt / 12); viraY = 0.3 }

  const iniCta = ini[ini.length - 1]
  const acenando = (frame - iniCta - TRANSICAO) / FPS > 0.6
  if (acenando && fase === 'parado') viraY = 0.15 + Math.sin(frame / 20) * 0.1

  const chute = ini[1] + quando('caos', 'chute', 7) * FPS
  const susto = frame >= chute - 2 && frame < chute + 40

  // bracinhos curtos que giram no ombro (ângulo em graus: 0 = para a direita, positivo = para cima)
  let angDir = -40 + Math.sin(frame / 12) * 6
  let angEsq = -140 - Math.sin(frame / 12) * 6
  if (fase === 'gira') angDir = 72 + Math.sin(tt * 0.95) * 14
  if (fase === 'joga') angDir = lerp(72, 12, sai(tt / 6))
  if (fase === 'puxa') { angDir = 8; angEsq = -150 }
  if (fase === 'solta') angDir = lerp(8, -40, sai(tt / 12))
  if (acenando && fase === 'parado') angDir = 70 + Math.sin(frame / 3.5) * 28
  // ponta da mão direita na tela (considera a inclinação e o achatamento do corpo)
  const pontaDaMao = (ang: number, lado: 1 | -1): P => {
    const a = (ang * Math.PI) / 180
    const tx = (lado * R * 0.88 + Math.cos(a) * BRACO) * (2 - sy), ty = (-R * 0.15 + Math.sin(a) * BRACO) * sy
    const th = (-incl * Math.PI) / 180
    return { x: x + tx * Math.cos(th) - ty * Math.sin(th), y: y - (tx * Math.sin(th) + ty * Math.cos(th)) }
  }
  let mao = pontaDaMao(angDir, 1)
  let corda: P[] | null = null
  let laco: { c: P; r: number; inc: number; rot: number } | null = null
  let garra: P | null = null
  if (fase === 'gira') {
    const a = tt * 0.95
    laco = { c: { x: mao.x + Math.cos(a) * 12, y: mao.y - 30 }, r: 50, inc: 1.25, rot: a }
  }
  if (fase === 'joga') {
    const e = sai(tt / 6)
    const fim = { x: lerp(mao.x, width - 6, e), y: lerp(mao.y, ALVO_Y, e) }
    corda = [mao, { x: (mao.x + fim.x) / 2, y: Math.max(mao.y, fim.y) + 170 * (1 - e) + 30 }, fim]
    laco = { c: fim, r: 22, inc: 1.1, rot: 0 }
  }
  if (fase === 'puxa') {
    const fim = { x: width * (1 - p) + GANCHO * p, y: ALVO_Y }
    const vib = Math.sin(frame * 2.3) * 4 * (1 - clamp(p))
    corda = [mao, { x: (mao.x + fim.x) / 2, y: (mao.y + fim.y) / 2 + 10 + vib }, fim]
    garra = fim
  }
  if (fase === 'solta') {
    const e = sai(tt / 12)
    const fim = { x: lerp(GANCHO, mao.x + 4, e), y: lerp(ALVO_Y, mao.y + 4, e) }
    corda = [mao, { x: (mao.x + fim.x) / 2, y: Math.max(mao.y, fim.y) + 70 * (1 - e) }, fim]
  }

  const pisca = frame % 74 < 4 ? 0.1 : 1
  const olhar = fase === 'puxa' || fase === 'joga' ? 5 : fase === 'gira' ? 1 : 3
  const olhaCima = fase === 'gira' ? 5 : susto ? 3 : 0
  const corpoPos = conv({ x, y })

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <ThreeCanvas width={width} height={height} orthographic camera={{ zoom: 1, position: [0, 0, 1000], near: 1, far: 3000 }}>
        <hemisphereLight args={['#fff4f0', '#2a1a1a', 1.1]} />
        <directionalLight position={[-400, 600, 900]} intensity={2.2} />
        <directionalLight position={[700, 100, -300]} intensity={1.4} color="#ffb0a0" />

        {/* sombra no chão */}
        <mesh position={conv({ x, y: BASE.y + R + 20 }, -50)} scale={[1 - (BASE.y - y) / 400, 0.18, 1]}>
          <circleGeometry args={[R * 0.95, 40]} />
          <meshBasicMaterial color="#000" transparent opacity={0.45} />
        </mesh>

        {/* corda, laço e gancho */}
        {corda && <Tubo pts={corda} raio={5.5} cor="#c99a62" conv={conv} z={40} />}
        {laco && (
          <mesh position={conv(laco.c, 40)} rotation={[laco.inc, 0, laco.rot * 0.2]}>
            <torusGeometry args={[laco.r, 5, 10, 48]} />
            <meshStandardMaterial color="#c99a62" roughness={0.75} />
          </mesh>
        )}
        {laco && fase === 'gira' && <Tubo pts={[mao, { x: (mao.x + laco.c.x) / 2, y: mao.y - 6 }, { x: laco.c.x - laco.r * 0.6, y: laco.c.y + 8 }]} raio={5} cor="#c99a62" conv={conv} z={40} />}
        {garra && (
          <group position={conv(garra, 40)}>
            <mesh><torusGeometry args={[17, 5, 10, 32]} /><meshStandardMaterial color="#c99a62" roughness={0.6} /></mesh>
            <mesh><sphereGeometry args={[8, 20, 20]} /><meshStandardMaterial color="#2a2a30" metalness={0.6} roughness={0.3} /></mesh>
          </group>
        )}

        {/* corpo */}
        <group position={corpoPos} rotation={[0, 0, -incl * Math.PI / 180]} scale={[2 - sy, sy, 1]}>
          {/* pés */}
          {[-26, 26].map(fx => (
            <mesh key={fx} position={[fx, -R + 2, 18]} scale={[1.45, 0.62, 1.1]}>
              <sphereGeometry args={[17, 24, 24]} />
              <meshPhysicalMaterial color="#b8645f" roughness={0.45} clearcoat={0.6} />
            </mesh>
          ))}
          {/* bracinhos: cápsulas curtas presas ao ombro, com a mãozinha na ponta */}
          {([[1, angDir], [-1, angEsq]] as const).map(([lado, ang]) => (
            <group key={lado} position={[lado * R * 0.88, -R * 0.15, lado === 1 ? 26 : -10]} rotation={[0, 0, (ang * Math.PI) / 180]}>
              <mesh position={[BRACO / 2, 0, 0]} scale={[BRACO / 22, 0.85, 0.85]}>
                <sphereGeometry args={[12, 24, 24]} />
                <meshPhysicalMaterial color="#eaa49c" roughness={0.38} clearcoat={0.8} />
              </mesh>
              <mesh position={[BRACO, 0, 0]}>
                <sphereGeometry args={[12.5, 24, 24]} />
                <meshPhysicalMaterial color="#f3b2a9" roughness={0.35} clearcoat={0.9} />
              </mesh>
            </group>
          ))}
          <group rotation={[0.08, viraY, 0]}>
            <mesh>
              <sphereGeometry args={[R, 64, 64]} />
              <meshPhysicalMaterial color="#f3b2a9" roughness={0.32} clearcoat={1} clearcoatRoughness={0.12} sheen={0.6} sheenColor="#ffd8d0" />
            </mesh>
            {/* olhos */}
            {[-21, 21].map(ox => (
              <group key={ox} position={[ox, 10, R * 0.84]} rotation={[0, ox * 0.012, 0]}>
                <mesh scale={[1, 1.22 * pisca, 0.55]}><sphereGeometry args={[14, 24, 24]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
                {pisca > 0.5 && <>
                  <mesh position={[olhar, olhaCima - 1, 7]} scale={[1, 1.1, 0.6]}><sphereGeometry args={[susto ? 5 : 7.5, 20, 20]} /><meshStandardMaterial color="#141416" roughness={0.15} /></mesh>
                  <mesh position={[olhar + 3, olhaCima + 3, 11]}><sphereGeometry args={[2.4, 12, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>
                </>}
              </group>
            ))}
            {/* bochechas */}
            {[-38, 38].map(cx => (
              <mesh key={cx} position={[cx, -12, R * 0.74]} scale={[1.3, 0.75, 0.4]}>
                <sphereGeometry args={[9, 16, 16]} /><meshBasicMaterial color="#ee8f95" transparent opacity={0.55} />
              </mesh>
            ))}
            {/* boca */}
            {fase === 'puxa'
              ? <mesh position={[0, -22, R * 0.94]}><boxGeometry args={[24, 9, 4]} /><meshStandardMaterial color="#5a2626" /></mesh>
              : susto
                ? <mesh position={[0, -24, R * 0.93]} scale={[1, 1.3, 0.5]}><sphereGeometry args={[7, 16, 16]} /><meshStandardMaterial color="#5a2626" /></mesh>
                : <mesh position={[0, -16, R * 0.93]} rotation={[0, 0, Math.PI]}>
                    <torusGeometry args={[fase === 'solta' || acenando ? 12 : 10, 2.8, 10, 24, Math.PI]} />
                    <meshStandardMaterial color="#5a2626" />
                  </mesh>}
          </group>
        </group>

      </ThreeCanvas>

      {/* balão de susto */}
      {susto && (
        <div style={{ position: 'absolute', left: x + 30, top: y - R - 110, width: 84, height: 62, borderRadius: 20, background: '#fff', color: '#e5484d',
          display: 'grid', placeItems: 'center', fontSize: 42, fontWeight: 800, fontFamily: 'sans-serif', boxShadow: '0 10px 30px rgba(0,0,0,.4)',
          scale: `${clamp((frame - chute + 2) / 6)}` }}>!?</div>
      )}
    </AbsoluteFill>
  )
}
