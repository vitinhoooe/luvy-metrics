// Tipografia cinética: cada palavra sobe por trás de uma máscara, em cascata, e sai para cima.
import { interpolate, useCurrentFrame } from 'remotion'
import { COR, EASE, TIPO, clamp } from './sistema'

type Props = {
  texto: string
  de: number          // quadro em que começa a entrar
  ate: number         // quadro em que termina de sair
  destaque?: string[] // palavras com o degradê da marca
  estilo?: 'titulo' | 'apoio'
  passo?: number      // quadros entre uma palavra e outra
  cor?: string
  centro?: boolean
}

export const Palavras: React.FC<Props> = ({ texto, de, ate, destaque = [], estilo = 'titulo', passo = 3, cor, centro }) => {
  const frame = useCurrentFrame()
  if (frame < de - 1 || frame > ate + 1) return null
  const ps = texto.split(' ')
  const tipo = TIPO[estilo]
  return (
    <div style={{ ...tipo, color: cor ?? (estilo === 'apoio' ? COR.apagado : COR.tinta), display: 'flex', flexWrap: 'wrap', columnGap: '0.24em', justifyContent: centro ? 'center' : 'flex-start' }}>
      {ps.map((p, i) => {
        const ini = de + i * passo
        const fimSaida = ate - (ps.length - 1 - i) * 1.5
        const sobe = interpolate(frame, [ini, ini + 18], [110, 0], { ...clamp, easing: EASE.entra })
        const sai = interpolate(frame, [fimSaida - 12, fimSaida], [0, -115], { ...clamp, easing: EASE.sai })
        const gira = interpolate(frame, [ini, ini + 18], [8, 0], { ...clamp, easing: EASE.entra })
        const limpo = p.replace(/[.,?!]/g, '')
        const grad = destaque.includes(limpo)
        return (
          // máscara: a palavra só aparece dentro da própria linha
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
            <span style={{
              display: 'inline-block', translate: `0 ${sobe + sai}%`, rotate: `${gira}deg`, transformOrigin: 'left bottom',
              ...(grad ? { backgroundImage: COR.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : {}),
            }}>{p}</span>
          </span>
        )
      })}
    </div>
  )
}

/** Rótulo pequeno em caixa alta acima do título (número da cena + nome), com traço que cresce. */
export const Rotulo: React.FC<{ n: string; texto: string; de: number; ate: number }> = ({ n, texto, de, ate }) => {
  const frame = useCurrentFrame()
  if (frame < de || frame > ate) return null
  const o = interpolate(frame, [de, de + 10, ate - 10, ate], [0, 1, 1, 0], clamp)
  const w = interpolate(frame, [de, de + 24], [0, 56], { ...clamp, easing: EASE.entra })
  return (
    <div style={{ ...TIPO.rotulo, color: COR.rosa, opacity: o, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
      <span style={{ color: COR.apagado }}>{n}</span>
      <span style={{ width: w, height: 2, background: COR.grad }} />
      <span>{texto}</span>
    </div>
  )
}
