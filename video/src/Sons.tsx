/*
 * Trilha e efeitos sonoros, presos aos mesmos tempos das cenas, da corda e da fala.
 * Trilha: public/trilha.wav (gerada por gerar-trilha.mjs, original). Efeitos: public/sfx/*.wav.
 */
import { Audio } from '@remotion/media'
import { Sequence, staticFile } from 'remotion'
import { inicios } from './Mascote'
import { CENAS, FPS } from './roteiro'
import { quando, temVoz } from './ui'

const Sfx: React.FC<{ em: number; som: string; vol?: number }> = ({ em, som, vol = 0.6 }) => (
  <Sequence from={Math.max(0, Math.round(em))} durationInFrames={FPS * 3} layout="none">
    <Audio src={staticFile(`sfx/${som}.wav`)} volume={vol} />
  </Sequence>
)

export const Sons: React.FC = () => {
  const ini = inicios()
  const em = (id: string) => ini[CENAS.findIndex(c => c.id === id)]
  const s = (seg: number) => seg * FPS
  const comVoz = CENAS.some(c => temVoz(c.id))
  const eventos: { em: number; som: string; vol?: number }[] = []

  // a corda: chicote no arremesso, whoosh no puxão
  for (let k = 1; k < ini.length; k++) {
    eventos.push({ em: ini[k] - 7, som: 'whip', vol: 0.35 })
    eventos.push({ em: ini[k] + 2, som: 'whoosh', vol: 0.55 })
  }
  // caos: um clique para cada janela que salta, e o carimbo
  ;['planilha', 'mercado', 'shopee', 'calculadora', 'caderno'].forEach((w, i) =>
    eventos.push({ em: em('caos') + s(quando('caos', w, 0.8 + i * 1.1)) - 2, som: 'mouse-click', vol: 0.45 }))
  eventos.push({ em: em('caos') + s(quando('caos', 'chute', 7)) - 2, som: 'switch', vol: 0.7 })
  // tudo numa tela só: as janelas se juntam
  eventos.push({ em: em('umaTela') + s(1.0), som: 'page-turn', vol: 0.6 })
  // ranking: o produto sobe
  eventos.push({ em: em('ranking') + s(1.3), som: 'switch', vol: 0.35 })
  // preço: checks e o ding no total
  ;['custo', 'frete', 'taxa', 'canal'].forEach((w, i) =>
    eventos.push({ em: em('preco') + s(quando('preco', w, 1 + i)), som: 'mouse-click', vol: 0.35 }))
  eventos.push({ em: em('preco') + s(quando('preco', 'canal', 4)) + 26, som: 'ding', vol: 0.45 })
  // alertas chegando
  ;['parar', 'sabendo', 'comprar'].forEach((w, i) =>
    eventos.push({ em: em('alerta') + s(quando('alerta', w, 1 + i * 2)) - 4, som: 'whoosh', vol: 0.4 }))
  // fecho
  eventos.push({ em: em('cta') + s(quando('cta', 'teste', 3.2)), som: 'ding', vol: 0.5 })

  return (
    <>
      {/* trilha mais baixa quando tem narração */}
      <Audio src={staticFile('trilha.wav')} volume={comVoz ? 0.16 : 0.32} loop />
      {eventos.map((e, i) => <Sfx key={i} em={e.em} som={e.som} vol={e.vol} />)}
    </>
  )
}

