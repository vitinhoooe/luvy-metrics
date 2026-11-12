/* As oito cenas do vídeo. Tudo anima pelo frame (useCurrentFrame), nada por CSS. */
import { ThreeCanvas } from '@remotion/three'
import { useMemo } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { FPS } from './roteiro'
import { COR, Fundo3D, Janela, Legenda, Marca3D, anima, brl, fontFamily, mola, palavras, quando, saida } from './ui'

const s = (seg: number) => seg * FPS
const base: React.CSSProperties = { backgroundColor: COR.fundo, fontFamily, color: COR.tinta, overflow: 'hidden' }

/* palavras grandes que aparecem no ritmo da fala (para os ganchos) */
const Cinetico: React.FC<{ id: string; size?: number; destaque?: string[]; y?: number }> = ({ id, size = 120, destaque = [], y = 0 }) => {
  const frame = useCurrentFrame()
  const t = frame / FPS
  return (
    <div style={{ position: 'absolute', left: 160, right: 160, top: '50%', translate: `0 calc(-50% + ${y}px)`, textAlign: 'center',
      fontSize: size, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.045em' }}>
      {palavras(id).map((w, i) => {
        const f0 = s(w.ini)
        const hi = destaque.some(d => w.p.toLowerCase().startsWith(d))
        return (
          <span key={i} style={{ display: 'inline-block', marginRight: '0.22em',
            opacity: anima(frame, [f0 - 2, f0 + 5], [0, 1]),
            translate: `0 ${anima(frame, [f0 - 2, f0 + 9], [60, 0], mola)}px`,
            filter: `blur(${anima(frame, [f0 - 2, f0 + 7], [14, 0])}px)`,
            color: hi ? COR.rosa : t > w.ini ? COR.tinta : 'transparent' }}>
            {w.p}
          </span>
        )
      })}
    </div>
  )
}

/* 1 · quantas abas — túnel 3D de abas voando na direção da câmera */
export const CenaAbas: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const abas = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    a: i * 2.399, r: 3 + (i % 5) * 0.9, z: -i * 1.4, cor: ['#f3f3f4', '#2f9e6b', '#e0782f', '#ffe600', '#ee4d2d', '#cfcfd2'][i % 6],
  })), [])
  return (
    <AbsoluteFill style={base}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 6], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 6]} intensity={1.2} />
        {abas.map((t, i) => {
          const z = ((t.z + frame * 0.32) % 84) - 0
          const zz = z > 6 ? z - 84 : z
          return (
            <group key={i} position={[Math.cos(t.a + frame * 0.01) * t.r, Math.sin(t.a + frame * 0.01) * t.r * 0.62, zz]} rotation={[0, 0, Math.sin(i) * 0.3]}>
              <mesh><boxGeometry args={[2.2, 1.35, 0.04]} /><meshStandardMaterial color="#1b1b20" metalness={0.3} roughness={0.5} /></mesh>
              <mesh position={[0, 0.55, 0.03]}><boxGeometry args={[2.2, 0.25, 0.02]} /><meshStandardMaterial color={t.cor} emissive={t.cor} emissiveIntensity={0.25} /></mesh>
            </group>
          )
        })}
      </ThreeCanvas>
      <AbsoluteFill style={{ background: 'radial-gradient(60% 55% at 50% 50%, rgba(11,11,13,.92), rgba(11,11,13,.2) 75%)' }} />
      <Cinetico id="abas" size={128} destaque={['abas']} />
    </AbsoluteFill>
  )
}

/* 2 · o caos — janelas pulando em 3D a cada nome falado */
const JANELAS = [
  { chave: 'planilha', titulo: 'estoque_final_v3.xlsx', cor: '#e8f5ec', x: -560, y: -230, r: -10 },
  { chave: 'mercado', titulo: 'Mercado Livre', cor: '#fff159', x: 470, y: -250, r: 9 },
  { chave: 'shopee', titulo: 'Shopee', cor: '#ffe3dc', x: -480, y: 190, r: 7 },
  { chave: 'calculadora', titulo: 'Calculadora', cor: '#e9e9ee', x: 560, y: 160, r: -8 },
  { chave: 'caderno', titulo: 'Caderno de pedidos', cor: '#fff7e0', x: 0, y: -20, r: 3 },
]
export const CenaCaos: React.FC = () => {
  const frame = useCurrentFrame()
  const chute = s(quando('caos', 'chute', 7))
  const treme = frame > chute - 6 ? Math.sin(frame * 2.1) * anima(frame, [chute - 6, chute + 16], [10, 0]) : 0
  return (
    <AbsoluteFill style={base}>
      <Fundo3D seed={7} velocidade={1.6} />
      <AbsoluteFill style={{ perspective: 1800, translate: `${treme}px 0` }}>
        {JANELAS.map((j, i) => {
          const f0 = s(quando('caos', j.chave, 0.8 + i * 1.1))
          return (
            <div key={j.chave} style={{ position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d',
              translate: `calc(-50% + ${j.x}px) calc(-50% + ${j.y + anima(frame, [f0 - 3, f0 + 14], [180, 0], mola)}px) ${anima(frame, [f0 - 3, f0 + 16], [-900, 0])}px`,
              rotate: `${j.r + Math.sin((frame + i * 20) / 30) * 2}deg`,
              scale: anima(frame, [f0 - 3, f0 + 14], [0.4, 1], mola) * (1 + Math.sin((frame + i * 9) / 25) * 0.01),
              opacity: anima(frame, [f0 - 3, f0 + 4], [0, 1]) }}>
              <div style={{ transform: `rotateY(${Math.sin((frame + i * 30) / 40) * 14}deg) rotateX(${Math.cos((frame + i * 17) / 45) * 8}deg)` }}>
                <Janela titulo={j.titulo} cor={j.cor} w={i === 4 ? 460 : 500} h={i === 4 ? 300 : 300}>
                  {Array.from({ length: 5 }, (_, k) => (
                    <div key={k} style={{ height: 22, margin: '10px 0', borderRadius: 6, background: k % 2 ? '#e6e6e8' : '#ececef', width: `${90 - ((k * 23 + i * 11) % 40)}%` }} />
                  ))}
                </Janela>
              </div>
            </div>
          )
        })}
        {/* o relógio correndo: o tempo que vai embora */}
        <div style={{ position: 'absolute', left: '50%', top: 120, translate: '-50% 0', display: 'flex', alignItems: 'center', gap: 18, fontSize: 40, fontWeight: 700,
          opacity: anima(frame, [s(1.2), s(1.8)], [0, 1]) }}>
          <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="#fff" strokeWidth="4" />
            <line x1="32" y1="32" x2={32 + 18 * Math.sin(frame * 0.35)} y2={32 - 18 * Math.cos(frame * 0.35)} stroke={COR.laranja} strokeWidth="4" strokeLinecap="round" />
            <line x1="32" y1="32" x2={32 + 12 * Math.sin(frame * 0.03)} y2={32 - 12 * Math.cos(frame * 0.03)} stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>
          <span>tempo indo embora</span>
        </div>
        {/* carimbo "no chute" */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', translate: '-50% -50%', rotate: '-12deg', padding: '18px 44px', border: `8px solid ${COR.vermelho}`, borderRadius: 18,
          color: COR.vermelho, fontSize: 120, fontWeight: 800, letterSpacing: '-0.03em', background: 'rgba(11,11,13,.82)',
          scale: anima(frame, [chute - 2, chute + 8], [2.4, 1], mola), opacity: anima(frame, [chute - 2, chute + 3], [0, 1]) }}>
          NO CHUTE
        </div>
      </AbsoluteFill>
      <Legenda id="caos" />
    </AbsoluteFill>
  )
}

/* 3 · numa tela só — as janelas voam e viram uma tela */
export const CenaUmaTela: React.FC = () => {
  const frame = useCurrentFrame()
  const junta = anima(frame, [0, s(1.3)], [0, 1], saida)
  const abre = anima(frame, [s(1.1), s(2.2)], [0, 1], mola)
  return (
    <AbsoluteFill style={base}>
      <Fundo3D seed={11} velocidade={0.6} opacidade={0.8} />
      <AbsoluteFill style={{ perspective: 1800 }}>
        {JANELAS.map((j, i) => (
          <div key={j.chave} style={{ position: 'absolute', left: '50%', top: '50%',
            translate: `calc(-50% + ${j.x * (1 - junta)}px) calc(-50% + ${j.y * (1 - junta)}px) ${-400 * junta}px`,
            rotate: `${j.r * (1 - junta)}deg`, scale: 1 - junta * 0.5, opacity: 1 - abre }}>
            <Janela titulo={j.titulo} cor={j.cor} w={500} h={300} />
          </div>
        ))}
        <div style={{ position: 'absolute', left: '50%', top: '52%', translate: '-50% -50%', transform: `rotateY(${(1 - abre) * 80}deg) rotateX(${(1 - abre) * 10}deg)`, opacity: abre }}>
          <Painel w={1280} h={560} cena={0} />
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontSize: 84, fontWeight: 800, letterSpacing: '-0.045em',
        opacity: anima(frame, [s(0.6), s(1.1)], [0, 1]), translate: `0 ${anima(frame, [s(0.6), s(1.3)], [40, 0])}px` }}>
        Tudo numa <span style={{ color: COR.rosa }}>tela só.</span>
      </div>
    </AbsoluteFill>
  )
}

/* o painel do LuvyMetrics (usado em várias cenas) */
const PRODUTOS = [['Gel lubrificante 60 ml', 12], ['Kit presente casal', 9], ['Vela aromática', 6], ['Óleo de massagem', 38], ['Lingerie renda', -4]] as const
export const Painel: React.FC<{ w: number; h: number; cena: number; t?: number }> = ({ w, h, cena, t = 0 }) => {
  const sobe = cena >= 1 ? anima(t, [s(1.2), s(2.2)], [0, 1], mola) : 0
  return (
    <div style={{ width: w, height: h, borderRadius: 24, overflow: 'hidden', background: COR.ui, color: COR.uiTinta, display: 'grid', gridTemplateColumns: '240px 1fr',
      boxShadow: '0 60px 140px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1)', fontFamily }}>
      <div style={{ background: '#0e0e10', color: '#a3a1aa', padding: 24, display: 'grid', alignContent: 'start', gap: 6, fontSize: 20 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 24, marginBottom: 18 }}>LuvyMetrics</div>
        {['Painel', 'Tendências', 'Calculadora', 'Comparador', 'Estoque', 'Alertas'].map((m, i) => (
          <div key={m} style={{ padding: '10px 12px', borderRadius: 10, background: i === 1 ? '#222126' : 'transparent', color: i === 1 ? '#fff' : undefined }}>{m}</div>
        ))}
      </div>
      <div style={{ padding: 28, display: 'grid', gap: 18, alignContent: 'start' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 34, fontWeight: 700 }}>Em alta esta semana</div>
          <div style={{ fontSize: 20, color: '#6f6d75' }}>Curitiba · PR</div>
        </div>
        <div style={{ position: 'relative', height: 5 * 70 }}>
          {PRODUTOS.map(([n, v], i) => {
            const ordem = i === 3 ? 3 - 3 * sobe : i < 3 ? i + sobe : 4
            return (
              <div key={n} style={{ position: 'absolute', left: 0, right: 0, top: ordem * 70, height: 60, display: 'grid', gridTemplateColumns: '44px 1fr 220px 90px', alignItems: 'center', gap: 16,
                padding: '0 16px', borderRadius: 14, fontSize: 24, background: i === 3 && sobe > 0.5 ? '#fff1e6' : 'transparent', border: i === 3 && sobe > 0.5 ? '2px solid #f4cba9' : '2px solid transparent' }}>
                <span style={{ width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 18, background: i === 3 && sobe > 0.5 ? COR.laranja : '#e6e6e8', color: i === 3 && sobe > 0.5 ? '#fff' : '#444' }}>{Math.round(ordem) + 1}</span>
                <span>{n}</span>
                <span style={{ height: 8, borderRadius: 8, background: '#ececef', overflow: 'hidden' }}>
                  <i style={{ display: 'block', height: '100%', width: `${Math.abs(v) * 2.4 * (cena >= 1 ? anima(t, [s(0.3), s(1.4)], [0, 1]) : 1)}%`, background: v < 0 ? COR.vermelho : COR.verde }} />
                </span>
                <b style={{ textAlign: 'right', color: v < 0 ? COR.vermelho : COR.verde }}>{v < 0 ? '−' : '+'}{Math.abs(v)}%</b>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* 4 · ranking da cidade — a câmera entra no painel */
export const CenaRanking: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={base}>
      <Fundo3D seed={19} velocidade={0.5} opacidade={0.7} />
      <AbsoluteFill style={{ perspective: 2000 }}>
        <div style={{ position: 'absolute', left: '50%', top: '47%', translate: '-50% -50%',
          transform: `rotateX(${anima(frame, [0, s(2)], [14, 4])}deg) rotateY(${anima(frame, [0, s(4)], [-12, 6])}deg) scale(${anima(frame, [0, s(5)], [0.92, 1.06])})` }}>
          <Painel w={1360} h={560} cena={1} t={frame} />
        </div>
        {/* selo que sobe junto com o produto que disparou */}
        <div style={{ position: 'absolute', left: 1150, top: 250, padding: '12px 22px', borderRadius: 999, background: COR.verde, color: '#fff', fontSize: 30, fontWeight: 800,
          boxShadow: '0 16px 40px rgba(47,158,107,.45)', opacity: anima(frame, [s(2.2), s(2.5)], [0, 1]),
          translate: `0 ${anima(frame, [s(2.2), s(3.4)], [80, -30], mola) + Math.sin(frame / 8) * 6}px`, scale: anima(frame, [s(2.2), s(2.6)], [0.5, 1], mola) }}>
          +38% esta semana
        </div>
        {/* pino da cidade */}
        <div style={{ position: 'absolute', right: 150, top: 120, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px', borderRadius: 999, background: '#fff', color: COR.uiTinta,
          fontSize: 28, fontWeight: 700, boxShadow: '0 20px 50px rgba(0,0,0,.4)',
          scale: anima(frame, [s(0.5), s(1)], [0, 1], mola), rotate: `${anima(frame, [s(0.5), s(1)], [-15, 0])}deg` }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: COR.laranja, boxShadow: `0 0 0 ${6 + Math.sin(frame / 5) * 4}px rgba(224,120,47,.25)` }} /> Sua cidade
        </div>
      </AbsoluteFill>
      <Legenda id="ranking" />
    </AbsoluteFill>
  )
}

/* 5 · preço ideal — a conta se monta e o preço conta */
export const CenaPreco: React.FC = () => {
  const frame = useCurrentFrame()
  const linhas = [['Custo do produto', 'R$ 22,00', 'custo'], ['Embalagem e frete', 'R$ 3,50', 'frete'], ['Taxa do canal', '14%', 'taxa'], ['Margem que você quer', '40%', 'canal']]
  const fimConta = s(quando('preco', 'canal', 4)) + 6
  const valor = anima(frame, [fimConta, fimConta + 22], [0, 55.43])
  return (
    <AbsoluteFill style={base}>
      <Fundo3D seed={23} velocidade={0.8} opacidade={0.7} />
      <AbsoluteFill style={{ perspective: 1800, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 900, padding: 44, borderRadius: 28, background: COR.ui, color: COR.uiTinta, boxShadow: '0 60px 140px rgba(0,0,0,.6)',
          transform: `rotateY(${anima(frame, [0, s(1.2)], [-28, -6])}deg) rotateX(${anima(frame, [0, s(1.2)], [12, 4])}deg)`,
          translate: `0 ${anima(frame, [0, s(1)], [120, -40])}px`, opacity: anima(frame, [0, 10], [0, 1]) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 34, fontWeight: 700, marginBottom: 20 }}>Preço ideal <span style={{ color: '#8b8991', fontWeight: 500, fontSize: 26 }}>Óleo de massagem</span></div>
          {linhas.map(([a, b, chave], i) => {
            const f0 = s(quando('preco', chave, 1 + i))
            return (
              <div key={a} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '2px solid #e6e6e8', fontSize: 30,
                opacity: anima(frame, [f0 - 4, f0 + 4], [0.15, 1]), translate: `${anima(frame, [f0 - 4, f0 + 8], [-40, 0])}px 0` }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#56545c' }}>
                  <span style={{ width: 30, height: 30, borderRadius: 15, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 18, background: frame > f0 + 2 ? COR.verde : '#d9d9dd' }}>✓</span>{a}
                </span>
                <b>{b}</b>
              </div>
            )
          })}
          <div style={{ marginTop: 26, padding: '22px 28px', borderRadius: 18, background: COR.uiTinta, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            boxShadow: frame > fimConta + 20 ? `0 0 ${40 + Math.sin(frame / 4) * 10}px rgba(47,158,107,.45)` : 'none' }}>
            <span style={{ fontSize: 28, color: '#a9a8ae' }}>Venda por</span>
            <strong style={{ fontSize: 76, letterSpacing: '-0.03em' }}>R$ {brl(valor)}</strong>
          </div>
        </div>
        {/* o lucro aparece logo depois do preço */}
        <div style={{ position: 'absolute', right: 230, top: 210, padding: '16px 26px', borderRadius: 20, background: COR.verde, color: '#fff', fontSize: 34, fontWeight: 800,
          boxShadow: '0 20px 50px rgba(47,158,107,.4)', opacity: anima(frame, [fimConta + 24, fimConta + 30], [0, 1]),
          scale: anima(frame, [fimConta + 24, fimConta + 34], [0.4, 1], mola), rotate: `${anima(frame, [fimConta + 24, fimConta + 34], [-12, 4], mola)}deg` }}>
          Lucro: R$ 22,17 por unidade
        </div>
      </AbsoluteFill>
      <Legenda id="preco" />
    </AbsoluteFill>
  )
}

/* 6 · comparador — barras 3D de verdade, câmera girando */
export const CenaCompara: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const barras = [['Mercado Livre', 62.9, '#fff159'], ['Shopee', 58.4, '#ee4d2d'], ['Sua loja', 55.43, '#f4f4f4']] as const
  const giro = anima(frame, [0, s(5)], [-0.5, 0.35])
  return (
    <AbsoluteFill style={base}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 3, 13], fov: 40 }}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 8, 6]} intensity={1.6} />
        <pointLight position={[-5, 2, 4]} intensity={30} color="#e9a7a0" />
        <group rotation={[0, giro, 0]} position={[0, -2.6, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><circleGeometry args={[6, 64]} /><meshStandardMaterial color="#131316" metalness={0.4} roughness={0.6} /></mesh>
          {barras.map(([n, v], i) => {
            const f0 = s(0.3 + i * 0.45)
            const h = (v / 62.9) * 3.1 * anima(frame, [f0, f0 + 24], [0.02, 1], mola)
            return (
              <mesh key={n} position={[(i - 1) * 2.4, h / 2, 0]}>
                <boxGeometry args={[1.5, h, 1.5]} />
                <meshStandardMaterial color={barras[i][2]} metalness={i === 2 ? 0.9 : 0.2} roughness={i === 2 ? 0.15 : 0.5}
                  emissive={i === 2 ? '#ffffff' : '#000000'} emissiveIntensity={i === 2 ? 0.08 + Math.max(0, Math.sin(frame / 6)) * 0.08 : 0} />
              </mesh>
            )
          })}
        </group>
      </ThreeCanvas>
      {/* rótulos */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', justifyContent: 'center', gap: 70 }}>
        {barras.map(([n, v], i) => {
          const f0 = s(0.6 + i * 0.45)
          return (
            <div key={n} style={{ textAlign: 'center', opacity: anima(frame, [f0, f0 + 10], [0, 1]), translate: `0 ${anima(frame, [f0, f0 + 14], [30, 0])}px`,
              padding: '14px 26px', borderRadius: 18, background: i === 2 ? '#fff' : 'rgba(255,255,255,.08)', color: i === 2 ? COR.uiTinta : '#fff' }}>
              <div style={{ fontSize: 24, opacity: 0.75 }}>{n}</div>
              <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em' }}>R$ {brl(v)}</div>
            </div>
          )
        })}
      </div>
      <Legenda id="compara" />
    </AbsoluteFill>
  )
}

/* 7 · alerta — notificações voando da profundidade */
export const CenaAlerta: React.FC = () => {
  const frame = useCurrentFrame()
  const avisos = [
    { t: 'Fantasia temática caiu 21% em 30 dias', s2: 'Segure a recompra', cor: COR.vermelho, chave: 'parar', y: -200 },
    { t: 'Óleo de massagem subiu 38% na sua cidade', s2: 'Vale repor antes de acabar', cor: COR.verde, chave: 'sabendo', y: 0 },
    { t: 'Vela aromática subiu 14% em Londrina', s2: 'Tendência na sua região', cor: COR.verde, chave: 'comprar', y: 200 },
  ]
  return (
    <AbsoluteFill style={base}>
      <Fundo3D seed={31} velocidade={1.2} opacidade={0.8} />
      <AbsoluteFill style={{ perspective: 1600 }}>
        {avisos.map((a, i) => {
          const f0 = s(quando('alerta', a.chave, 1 + i * 2)) - 4
          return (
            <div key={a.t} style={{ position: 'absolute', left: '50%', top: '46%', width: 1100, display: 'grid', gridTemplateColumns: '64px 1fr auto', alignItems: 'center', gap: 26,
              padding: '30px 36px', borderRadius: 28, background: COR.ui, color: COR.uiTinta, boxShadow: '0 40px 100px rgba(0,0,0,.55)',
              translate: `-50% calc(-50% + ${a.y}px) ${anima(frame, [f0, f0 + 18], [-1400, 0], saida)}px`,
              rotate: `${anima(frame, [f0, f0 + 18], [i ? 8 : -8, 0])}deg`, opacity: anima(frame, [f0, f0 + 6], [0, 1]),
              filter: `blur(${anima(frame, [f0, f0 + 14], [12, 0])}px)` }}>
              <span style={{ width: 64, height: 64, borderRadius: 18, display: 'grid', placeItems: 'center', background: a.cor, color: '#fff', fontSize: 36, fontWeight: 800 }}>{i ? '↗' : '↘'}</span>
              <div><div style={{ fontSize: 36, fontWeight: 700 }}>{a.t}</div><div style={{ fontSize: 26, color: '#6f6d75', marginTop: 4 }}>{a.s2}</div></div>
              <span style={{ fontSize: 22, color: '#8b8991' }}>agora</span>
            </div>
          )
        })}
      </AbsoluteFill>
      <Legenda id="alerta" />
    </AbsoluteFill>
  )
}

/* 8 · chamada final — a marca 3D girando */
export const CenaCta: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const t1 = s(quando('cta', 'mais', 1.6))
  const t2 = s(quando('cta', 'teste', 3.2))
  return (
    <AbsoluteFill style={base}>
      <Fundo3D seed={41} velocidade={0.5} opacidade={0.6} />
      <AbsoluteFill style={{ background: 'radial-gradient(45% 50% at 50% 38%, rgba(233,167,160,.14), transparent 70%)' }} />
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 9], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 6, 7]} intensity={2.2} />
        <directionalLight position={[-6, -2, 4]} intensity={0.8} color="#e9a7a0" />
        <pointLight position={[0, 3, 5]} intensity={20} />
        <Marca3D giro={interpolate(frame, [0, s(7)], [-0.9, 0.5]) + anima(frame, [0, 26], [Math.PI, 0], saida)} escala={anima(frame, [0, 22], [0.2, 1.15], mola)} y={1.7} />
      </ThreeCanvas>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', display: 'grid', gap: 6, fontSize: 86, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.02 }}>
        <span style={{ color: COR.dim, fontWeight: 600, opacity: anima(frame, [6, 18], [0, 1]), translate: `0 ${anima(frame, [6, 20], [30, 0])}px` }}>Menos tempo em planilha.</span>
        <span style={{ opacity: anima(frame, [t1 - 4, t1 + 8], [0, 1]), translate: `0 ${anima(frame, [t1 - 4, t1 + 12], [30, 0])}px` }}>Mais tempo vendendo.</span>
      </div>
      <div style={{ position: 'absolute', left: '50%', top: 800, translate: '-50% 0', display: 'flex', alignItems: 'center', gap: 22, padding: '22px 42px', borderRadius: 999, background: '#fafafa', color: '#000',
        fontSize: 40, fontWeight: 700, scale: anima(frame, [t2 - 3, t2 + 12], [0.6, 1], mola), opacity: anima(frame, [t2 - 3, t2 + 4], [0, 1]),
        boxShadow: `0 0 ${50 + Math.sin(frame / 5) * 14}px rgba(255,255,255,.25)` }}>
        Teste grátis por 7 dias <span style={{ fontWeight: 500, color: '#55555a' }}>· sem cartão</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, textAlign: 'center', fontSize: 30, color: COR.dim, opacity: anima(frame, [t2 + 6, t2 + 16], [0, 1]) }}>luvymetrics.com.br</div>
      <div style={{ position: 'absolute', right: 34, bottom: 24, fontSize: 18, color: 'rgba(255,255,255,.35)' }}>Narração gerada por IA · dados de exemplo</div>
    </AbsoluteFill>
  )
}
