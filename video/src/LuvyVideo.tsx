import { Audio } from '@remotion/media'
import { TransitionSeries } from '@remotion/transitions'
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { CenaAbas, CenaAlerta, CenaCaos, CenaCompara, CenaCta, CenaPreco, CenaRanking, CenaUmaTela } from './cenas'
import { Mascote } from './Mascote'
import { Sons } from './Sons'
import { TIMING, puxar } from './puxar'
import { CENAS, TRANSICAO } from './roteiro'
import { quadrosCena, temVoz } from './ui'

const COMPONENTES: Record<string, React.FC> = {
  abas: CenaAbas, caos: CenaCaos, umaTela: CenaUmaTela, ranking: CenaRanking,
  preco: CenaPreco, compara: CenaCompara, alerta: CenaAlerta, cta: CenaCta,
}
// cada cena tem um movimento de câmera próprio, sempre andando enquanto a voz fala
const CAMERA: Record<string, { de: number; ate: number; x: number; y: number }> = {
  abas: { de: 1, ate: 1.08, x: 0, y: 0 }, caos: { de: 1.04, ate: 1, x: -20, y: 10 }, umaTela: { de: 1, ate: 1.06, x: 0, y: -10 },
  ranking: { de: 1.02, ate: 1.1, x: 30, y: 0 }, preco: { de: 1, ate: 1.07, x: -20, y: 0 }, compara: { de: 1.06, ate: 1, x: 0, y: 10 },
  alerta: { de: 1, ate: 1.08, x: 0, y: -16 }, cta: { de: 1.05, ate: 1, x: 0, y: 0 },
}

const Camera: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const c = CAMERA[id]
  const t = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ scale: c.de + (c.ate - c.de) * t, translate: `${c.x * t}px ${c.y * t}px` }}>
      {children}
    </AbsoluteFill>
  )
}

/** duração total: soma das cenas menos as sobreposições das transições */
export const duracaoTotal = () => CENAS.reduce((t, c) => t + quadrosCena(c.id), 0) - TRANSICAO * (CENAS.length - 1)

export const LuvyVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#050506' }}>
    <TransitionSeries>
      {CENAS.flatMap((c, i) => {
        const Comp = COMPONENTES[c.id]
        const itens = [
          <TransitionSeries.Sequence key={c.id} name={c.id} durationInFrames={quadrosCena(c.id)}>
            <Camera id={c.id}><Comp /></Camera>
            {temVoz(c.id) && <Audio src={staticFile(`voz/${c.id}.mp3`)} />}
          </TransitionSeries.Sequence>,
        ]
        if (i < CENAS.length - 1) {
          itens.push(<TransitionSeries.Transition key={`${c.id}-t`} presentation={puxar()} timing={TIMING} />)
        }
        return itens
      })}
    </TransitionSeries>
    <Mascote />
    <Sons />
  </AbsoluteFill>
)
