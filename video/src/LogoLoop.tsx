import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import * as THREE from 'three'

// Logo 3D em loop perfeito para a tela de login do app.
// Fundo preto puro: no site o vídeo usa mix-blend-mode: screen, então o preto some.
export const LOOP = 240 // 8 s a 30 fps

function formas() {
  const traco = (pts: [number, number][], w: number) => {
    const s = new THREE.Shape()
    const esq: [number, number][] = [], dir: [number, number][] = []
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1
      const nx = (-dy / L) * w, ny = (dx / L) * w
      esq.push([p[0] + nx, p[1] + ny]); dir.push([p[0] - nx, p[1] - ny])
    })
    const todos = [...esq, ...dir.reverse()]
    s.moveTo(...todos[0]); todos.slice(1).forEach((p) => s.lineTo(...p)); s.closePath()
    return s
  }
  const eixo = traco([[-1, 1.1], [-1, -1], [1.25, -1]], 0.13)
  const linha = traco([[-0.55, -0.35], [-0.05, 0.15], [0.35, -0.1], [0.92, 0.55]], 0.11)
  const bola = new THREE.Shape(); bola.absarc(1.0, 0.68, 0.24, 0, Math.PI * 2, false)
  return [eixo, linha, bola]
}

const MATERIAIS = [
  { color: '#f4eef5', metalness: 0.55, roughness: 0.26 },               // eixo: prata
  { color: '#ff9cc2', metalness: 0.45, roughness: 0.28 },             // linha: rosa metálico
  { color: '#f0508c', metalness: 0.4, roughness: 0.3, emissive: '#f0508c', emissiveIntensity: 0.45 }, // ponto: rosa Luvy
]

export const LogoLoop: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const geo = useMemo(formas, [])
  const t = (frame / LOOP) * Math.PI * 2
  const giro = Math.sin(t) * 0.6
  const incl = 0.12 + Math.sin(t * 2) * 0.05
  const y = Math.sin(t * 2) * 0.07

  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 7.2], fov: 38 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[0, 1, 9]} intensity={1.6} />
        <directionalLight position={[4, 6, 7]} intensity={2.4} />
        <directionalLight position={[-6, -2, 3]} intensity={1.4} color="#f0508c" />
        <pointLight position={[Math.sin(t) * 4, 3, 5]} intensity={22} />
        <group rotation={[incl, giro, 0]} position={[0, y, 0]} scale={1.12}>
          {geo.map((f, i) => (
            <mesh key={i} position={[-0.1, -0.05, -0.2]}>
              <extrudeGeometry args={[f, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.045, bevelSegments: 6, curveSegments: 32 }]} />
              <meshStandardMaterial {...MATERIAIS[i]} />
            </mesh>
          ))}
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  )
}
