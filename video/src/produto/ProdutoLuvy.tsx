// LuvyMetrics — vídeo de produto (44 s, loop). Telas reais, uma câmera contínua, texto na batida.
import { Audio, Video } from '@remotion/media'
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { Mundo, SeloExemplo } from './Mundo'
import { Palavras, Rotulo } from './Texto'
import { CENAS as C, COR, EASE, TIPO, b, clamp, colunaX, fontFamily } from './sistema'

const Coluna: React.FC<{ children: React.ReactNode; topo?: number }> = ({ children, topo = 290 }) => (
  <div style={{ position: 'absolute', left: colunaX(1), top: topo, width: colunaX(6) - colunaX(1) - 40 }}>{children}</div>
)

// ---------- elementos que entram por cima das telas ----------

/** Cartão de pedido novo caindo em 3D, com o "plim". */
const PedidoChegou: React.FC<{ de: number }> = ({ de }) => {
  const f = useCurrentFrame() - de
  if (f < 0 || f > b(9.5)) return null
  const y = interpolate(f, [0, 16], [-260, 0], { ...clamp, easing: EASE.mola })
  const rx = interpolate(f, [0, 16], [-55, 0], { ...clamp, easing: EASE.entra })
  const o = interpolate(f, [0, 6, b(8.5), b(9.5)], [0, 1, 1, 0], clamp)
  const pulso = interpolate(f % 30, [0, 30], [0, 1])
  return (
    <div style={{ position: 'absolute', right: 150, top: 150, perspective: 1200, opacity: o }}>
      <div style={{
        width: 620, padding: '26px 30px', borderRadius: 26, background: '#fff', color: '#1e1720', fontFamily,
        display: 'flex', gap: 20, alignItems: 'center', translate: `0 ${y}px`, rotate: `x ${rx}deg`,
        boxShadow: '0 50px 120px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.4)',
      }}>
        <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 18, background: COR.grad, flex: '0 0 64px', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 30, fontWeight: 800 }}>
          <span style={{ position: 'absolute', inset: -8, borderRadius: 24, border: `3px solid ${COR.rosa}`, opacity: 1 - pulso, scale: `${1 + pulso * 0.35}` }} />
          ✦
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>Pedido #43 chegou!</div>
          <div style={{ fontSize: 22, color: '#7a6c7e', marginTop: 4 }}>3 itens · R$ 154,70 · Pix · pela vitrine</div>
        </div>
      </div>
    </div>
  )
}

/** Fichas de canal acendendo uma por batida: Balcão → WhatsApp → Instagram → Vitrine. */
const Canais: React.FC<{ de: number }> = ({ de }) => {
  const frame = useCurrentFrame()
  const f = frame - de
  if (f < 0 || f > b(9)) return null
  const nomes = ['Balcão', 'WhatsApp', 'Instagram', 'Vitrine']
  const ativo = Math.min(nomes.length - 1, Math.floor(f / BATIDA_2))
  return (
    <div style={{ display: 'flex', gap: 14, marginTop: 44, opacity: interpolate(f, [0, 8, b(8), b(9)], [0, 1, 1, 0], clamp) }}>
      {nomes.map((n, i) => {
        const e = interpolate(f, [i * 4, i * 4 + 14], [30, 0], { ...clamp, easing: EASE.entra })
        const on = i === ativo
        return (
          <span key={n} style={{
            fontFamily, fontSize: 30, fontWeight: 700, padding: '14px 26px', borderRadius: 999, translate: `0 ${e}px`,
            background: on ? COR.grad : 'rgba(255,255,255,.07)', color: on ? '#fff' : COR.apagado,
            boxShadow: on ? '0 14px 40px rgba(214,60,160,.45)' : 'none', border: '1px solid rgba(255,255,255,.1)',
          }}>{n}</span>
        )
      })}
    </div>
  )
}
const BATIDA_2 = b(2)

/** Contador de Pix conferidos (ilustrativo, dados de exemplo). */
const Conferidos: React.FC<{ de: number }> = ({ de }) => {
  const f = useCurrentFrame() - de
  if (f < 0 || f > b(9)) return null
  const n = Math.round(interpolate(f, [0, b(5)], [0, 200], { ...clamp, easing: EASE.entra }))
  return (
    <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 18, fontFamily, opacity: interpolate(f, [0, 6, b(8), b(9)], [0, 1, 1, 0], clamp) }}>
      <span style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.05em', color: COR.ok, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
      <span style={{ ...TIPO.apoio, color: COR.apagado }}>conferidos de uma vez,<br />pelo valor exato do Pix</span>
    </div>
  )
}

// ---------- abertura e final (iguais: o vídeo faz loop) ----------
const Marca: React.FC = () => {
  const frame = useCurrentFrame()
  const fimMural = C.mural.ate
  // aparece no fim do mural e some no último compasso (volta ao preto da abertura)
  const o = interpolate(frame, [C.mural.de + b(10), C.mural.de + b(12), fimMural - b(4), fimMural - b(1)], [0, 1, 1, 0], clamp)
  const s = interpolate(frame, [C.mural.de + b(10), C.mural.de + b(13)], [0.86, 1], { ...clamp, easing: EASE.entra })
  if (o <= 0) return null
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: o }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(60% 60% at 50% 45%, rgba(11,7,16,.82), ${COR.fundo} 80%)` }} />
      <div style={{ scale: `${s}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Video src={staticFile('logo-3d.webm')} loop muted style={{ width: 380, height: 380 }} />
        <div style={{ ...TIPO.titulo, fontSize: 92, color: COR.tinta, marginTop: -20 }}>LuvyMetrics</div>
        <div style={{ ...TIPO.apoio, marginTop: 14, color: COR.apagado }}>Sua loja inteira. Numa tela só.</div>
        <div style={{ marginTop: 40, fontFamily, fontWeight: 700, fontSize: 32, color: '#fff', padding: '20px 40px', borderRadius: 999, background: COR.grad, boxShadow: '0 20px 60px rgba(214,60,160,.5)' }}>
          Teste 7 dias grátis
        </div>
        <div style={{ ...TIPO.apoio, fontSize: 30, marginTop: 22, color: COR.apagado, textAlign: 'center' }}>
          <b style={{ color: COR.tinta }}>R$ 6,57 por dia</b> para largar planilha, caderno<br />e conferência de Pix um por um.
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const ProdutoLuvy: React.FC = () => {
  const frame = useCurrentFrame()
  // o mundo acende depois do título da abertura e apaga no último compasso
  const mundo = interpolate(frame, [b(5), b(8), C.mural.ate - b(6), C.mural.ate - b(2)], [0, 1, 1, 0], clamp)
  // véu escuro do lado do texto, para leitura (some no mural)
  const veu = interpolate(frame, [C.pedido.de, C.pedido.de + 20, C.comeco.ate - 10, C.mural.de + 20], [0, 1, 1, 0], clamp)
  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo, overflow: 'hidden' }}>
      {/* luz de fundo que respira na batida */}
      <AbsoluteFill style={{
        background: `radial-gradient(55% 60% at ${30 + Math.sin(frame / 120) * 10}% 40%, rgba(214,60,160,${0.16 + 0.04 * Math.sin((frame / 15) * Math.PI)}), transparent 70%), radial-gradient(50% 55% at 80% 75%, rgba(125,82,255,.14), transparent 70%)`,
      }} />
      <Mundo visivel={mundo} />
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(11,7,16,.94) 0%, rgba(11,7,16,.78) 34%, rgba(11,7,16,0) 58%)', opacity: veu }} />
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 260px rgba(0,0,0,.75)' }} />

      {/* 00 · abertura */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Palavras texto="Sua loja inteira." de={b(1)} ate={b(7)} destaque={['inteira']} />
          <Palavras texto="Numa tela só." de={b(3)} ate={b(7.5)} />
        </div>
      </AbsoluteFill>

      {/* 01 · pedido chegando */}
      <Coluna>
        <Rotulo n="01" texto="Vitrine online" de={C.pedido.de + 6} ate={C.pedido.ate - 6} />
        <Palavras texto="Chegou pedido no seu site." de={C.pedido.de + b(1)} ate={C.pedido.ate - 8} destaque={['site']} />
        <div style={{ height: 30 }} />
        <Palavras texto="Com som, aviso e o Pix do valor certo. Sem você abrir nada." estilo="apoio" passo={2} de={C.pedido.de + b(4)} ate={C.pedido.ate - 8} />
      </Coluna>
      <PedidoChegou de={C.pedido.de + b(2)} />

      {/* 02 · balcão */}
      <Coluna>
        <Rotulo n="02" texto="Balcão (PDV)" de={C.balcao.de + 6} ate={C.balcao.ate - 6} />
        <Palavras texto="Vendeu no balcão?" de={C.balcao.de + b(1)} ate={C.balcao.ate - 8} />
        <Palavras texto="O estoque já baixou." de={C.balcao.de + b(2.5)} ate={C.balcao.ate - 8} destaque={['baixou']} />
        <Canais de={C.balcao.de + b(5)} />
      </Coluna>

      {/* 03 · pix pelo extrato */}
      <Coluna>
        <Rotulo n="03" texto="Conferir Pix" de={C.pix.de + 6} ate={C.pix.ate - 6} />
        <Palavras texto="200 pedidos no dia?" de={C.pix.de + b(1)} ate={C.pix.ate - 8} />
        <Palavras texto="Sobe o extrato. Pronto." de={C.pix.de + b(2.5)} ate={C.pix.ate - 8} destaque={['Pronto']} />
        <Conferidos de={C.pix.de + b(4.5)} />
      </Coluna>

      {/* 04 · estoque inteligente */}
      <Coluna>
        <Rotulo n="04" texto="Estoque inteligente" de={C.repor.de + 6} ate={C.repor.ate - 6} />
        <Palavras texto="O que comprar." de={C.repor.de + b(1)} ate={C.repor.de + b(7.5)} destaque={['comprar']} />
        <Palavras texto="O que virar promoção." de={C.repor.de + b(8)} ate={C.repor.ate - 8} destaque={['promoção']} />
        <div style={{ height: 30 }} />
        <Palavras texto="Pela sua venda real, não pelo achismo." estilo="apoio" passo={2} de={C.repor.de + b(3)} ate={C.repor.ate - 8} />
      </Coluna>

      {/* 05 · começo */}
      <Coluna>
        <Rotulo n="05" texto="Primeiro dia" de={C.comeco.de + 6} ate={C.comeco.ate - 6} />
        <Palavras texto="Comece hoje." de={C.comeco.de + b(1)} ate={C.comeco.ate - 8} />
        <Palavras texto="Com a planilha que você já tem." de={C.comeco.de + b(2.5)} ate={C.comeco.ate - 8} destaque={['planilha']} />
        <div style={{ height: 30 }} />
        <Palavras texto="A IA entende as colunas. Suas vendas antigas entram também." estilo="apoio" passo={2} de={C.comeco.de + b(5)} ate={C.comeco.ate - 8} />
      </Coluna>

      {/* 06 · mural: a lista de tudo, uma palavra por batida */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: `radial-gradient(45% 35% at 50% 50%, rgba(11,7,16,${interpolate(frame, [C.mural.de + b(1), C.mural.de + b(3), C.mural.de + b(9), C.mural.de + b(10)], [0, 0.85, 0.85, 0], clamp)}), transparent 100%)` }}>
        <div style={{ width: 1500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textShadow: '0 10px 60px rgba(0,0,0,.8)' }}>
          <Palavras texto="Balcão. Vitrine. Pedidos. Pix." de={C.mural.de + b(2)} ate={C.mural.de + b(9.5)} passo={BATIDA_2 / 2} destaque={['Vitrine', 'Pix']} centro />
          <Palavras texto="Estoque. Clientes. Fornecedores. IA." de={C.mural.de + b(4)} ate={C.mural.de + b(9.5)} passo={BATIDA_2 / 2} destaque={['IA']} centro />
        </div>
      </AbsoluteFill>
      <Marca />

      {mundo > 0.05 && <SeloExemplo />}

      {/* som: trilha + efeitos na batida */}
      <Audio src={staticFile('trilha-cine.wav')} />
      {[C.pedido.de, C.balcao.de, C.pix.de, C.repor.de, C.comeco.de, C.mural.de].map((f) => (
        <Sequence key={f} from={f - 8} durationInFrames={30}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} /></Sequence>
      ))}
      <Sequence from={C.pedido.de + b(2)} durationInFrames={60}><Audio src={staticFile('sfx/ding.wav')} volume={0.7} /></Sequence>
      {[0, 1, 2, 3].map((i) => (
        <Sequence key={i} from={C.balcao.de + b(5) + i * BATIDA_2} durationInFrames={15}><Audio src={staticFile('sfx/mouse-click.wav')} volume={0.35} /></Sequence>
      ))}
    </AbsoluteFill>
  )
}
