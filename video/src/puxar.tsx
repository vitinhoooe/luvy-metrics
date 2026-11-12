/*
 * Transição "puxão": a cena nova entra pela direita, puxada pela corda do personagem
 * (com um tranco no fim), e a cena antiga é empurrada para a esquerda, encolhendo e apagando.
 */
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { linearTiming } from '@remotion/transitions'
import { AbsoluteFill, Easing } from 'remotion'
import { TRANSICAO } from './roteiro'

// a mesma curva é usada aqui e na corda do personagem (Mascote.tsx), para os dois andarem juntos:
// começa devagar (a corda estica), acelera no puxão e passa um pouco do lugar no fim (o tranco)
export const TIMING = linearTiming({ durationInFrames: TRANSICAO, easing: Easing.bezier(0.6, 0, 0.22, 1.12) })

const Puxar: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({ children, presentationDirection, presentationProgress: p }) => {
  if (presentationDirection === 'entering') {
    // entra da direita; o lado esquerdo (onde a corda engancha) vem na frente, e o tranco passa um pouco do lugar
    return (
      <AbsoluteFill style={{
        translate: `${(1 - p) * 100}%`,
        rotate: `${(1 - p) * 5}deg`,
        transformOrigin: '0% 50%',
        boxShadow: '-40px 0 80px rgba(0,0,0,.6)',
      }}>{children}</AbsoluteFill>
    )
  }
  return (
    <AbsoluteFill style={{
      translate: `${-p * 38}%`,
      scale: 1 - p * 0.12,
      filter: `brightness(${1 - p * 0.55})`,
    }}>{children}</AbsoluteFill>
  )
}

export const puxar = (): TransitionPresentation<Record<string, never>> => ({ component: Puxar, props: {} })
