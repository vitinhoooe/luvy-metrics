'use client'

/*
 * "Por que o LuvyMetrics, em 1 minuto" — vídeo explicativo feito em código (sem arquivo de vídeo).
 * Toca dentro da página: play/pausa, barra de progresso clicável, tempo, legendas e "assistir de novo".
 * Cada cena tem uma frase (a legenda) e uma animação própria. Dados das cenas são de exemplo.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import './video.css'

const CENAS = [
  { t: 0, fim: 7, frase: 'Você comprou 20 unidades. Vendeu 3.' },
  { t: 7, fim: 14, frase: 'E o produto que vendia de verdade acabou na prateleira.' },
  { t: 14, fim: 22, frase: 'O LuvyMetrics mostra o que está saindo na sua cidade, toda semana.' },
  { t: 22, fim: 30, frase: 'Calcula o preço certo, com custo, frete e a taxa de cada canal.' },
  { t: 30, fim: 37, frase: 'Compara o seu preço com o Mercado Livre e a Shopee.' },
  { t: 37, fim: 45, frase: 'E avisa quando um produto dispara ou começa a parar.' },
  { t: 45, fim: 53, frase: 'Compre o que vende. Venda com lucro. Teste 7 dias grátis.' },
]
const DURACAO = 53
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const brl = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function VideoExplica({ cta = '/login', id = 'video' }: { cta?: string; id?: string }) {
  const [tocando, setTocando] = useState(false)
  const [comecou, setComecou] = useState(false)
  const [tempo, setTempo] = useState(0)
  const tRef = useRef(0)
  const caixa = useRef<HTMLDivElement>(null)

  // relógio do vídeo: um requestAnimationFrame só enquanto toca
  useEffect(() => {
    if (!tocando) return
    let raf = 0, ultimo = performance.now()
    const passo = (agora: number) => {
      tRef.current = Math.min(DURACAO, tRef.current + (agora - ultimo) / 1000)
      ultimo = agora
      setTempo(tRef.current)
      if (tRef.current >= DURACAO) { setTocando(false); return }
      raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [tocando])

  // pausa sozinho quando sai da tela
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) setTocando(false) }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // outros botões da página podem pedir para tocar ("Ver em 1 minuto")
  const tocar = useCallback(() => {
    if (tRef.current >= DURACAO) { tRef.current = 0; setTempo(0) }
    setComecou(true); setTocando(true)
  }, [])
  useEffect(() => {
    const f = () => tocar()
    window.addEventListener('luvy-video-play', f)
    return () => window.removeEventListener('luvy-video-play', f)
  }, [tocar])

  const alterna = () => (tocando ? setTocando(false) : tocar())
  const busca = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    tRef.current = Math.max(0, Math.min(DURACAO, ((e.clientX - r.left) / r.width) * DURACAO))
    setTempo(tRef.current); setComecou(true)
  }
  const tecla = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); alterna() }
    if (e.key === 'ArrowRight') { tRef.current = Math.min(DURACAO, tRef.current + 5); setTempo(tRef.current) }
    if (e.key === 'ArrowLeft') { tRef.current = Math.max(0, tRef.current - 5); setTempo(tRef.current) }
  }

  const idx = Math.max(0, CENAS.findIndex(c => tempo >= c.t && tempo < c.fim))
  const cena = tempo >= DURACAO ? CENAS.length - 1 : idx
  const local = tempo - CENAS[cena].t // segundos dentro da cena
  const acabou = tempo >= DURACAO
  const cls = (i: number) => (comecou && cena === i ? 'on' : comecou && cena > i ? 'foi' : '')

  // números que dependem do tempo da cena
  const parados = Math.min(17, Math.max(0, Math.floor((local - 1.2) * 6)))
  const preco = cena === 3 ? Math.min(1, Math.max(0, (local - 3.5) / 1.6)) * 55.43 : 55.43

  return (
    <div className={`vx ${tocando ? 'tocando' : ''} ${comecou ? 'comecou' : ''}`} id={id} ref={caixa}
      tabIndex={0} onKeyDown={tecla} role="region" aria-label="Vídeo: por que usar o LuvyMetrics, em 1 minuto">
      <div className="vx-tela" onClick={alterna}>
        {/* cena 1: compra demais */}
        <div className={`vx-cena vx-c1 ${cls(0)}`}>
          <div className="vx-caixas">
            {Array.from({ length: 20 }, (_, i) => (
              <span key={i} className={i < 3 && local > 2.4 ? 'vendida' : ''} style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
          <div className="vx-cont"><b>R$ {brl((17 * 25) * Math.min(1, Math.max(0, (local - 3) / 2)))}</b><small>parados na prateleira</small></div>
        </div>
        {/* cena 2: acabou o que vendia */}
        <div className={`vx-cena vx-c2 ${cls(1)}`}>
          <div className="vx-prateleira">
            <div className="vx-slot cheio"><span>Kit presente casal</span><em>17 em estoque</em></div>
            <div className="vx-slot vazio"><span>Óleo de massagem</span><em>esgotado</em></div>
            <div className="vx-slot cheio"><span>Vela aromática</span><em>12 em estoque</em></div>
          </div>
          <p className="vx-perdeu">O cliente procurou e foi comprar em outro lugar.</p>
        </div>
        {/* cena 3: ranking da cidade */}
        <div className={`vx-cena vx-c3 ${cls(2)}`}>
          <div className="vx-card">
            <header>Em alta esta semana <small>Curitiba · PR</small></header>
            {[['Óleo de massagem', 38], ['Gel lubrificante 60 ml', 12], ['Kit presente casal', 9], ['Vela aromática', 6]].map(([n, v], i) => (
              <div key={n as string} className="vx-row" style={{ '--i': i } as React.CSSProperties}>
                <span className="n">{i + 1}</span><span>{n}</span><i style={{ width: `${(v as number) * 2.2}%` }} /><b>+{v}%</b>
              </div>
            ))}
          </div>
        </div>
        {/* cena 4: preço certo */}
        <div className={`vx-cena vx-c4 ${cls(3)}`}>
          <div className="vx-card">
            <header>Preço ideal <small>Óleo de massagem</small></header>
            {[['Custo do produto', 'R$ 22,00'], ['Embalagem e envio', 'R$ 3,50'], ['Taxa do canal', '14%'], ['Margem que você quer', '40%']].map(([a, b], i) => (
              <div key={a} className="vx-linha" style={{ '--i': i } as React.CSSProperties}><span>{a}</span><b>{b}</b></div>
            ))}
            <div className="vx-total"><span>Venda por</span><strong>R$ {brl(preco)}</strong></div>
          </div>
        </div>
        {/* cena 5: comparador */}
        <div className={`vx-cena vx-c5 ${cls(4)}`}>
          <div className="vx-barras">
            {[['Mercado Livre', 62.9], ['Shopee', 58.4], ['Sua loja', 55.43]].map(([c, p], i) => (
              <div key={c as string} className={i === 2 ? 'sua' : ''} style={{ '--h': `${((p as number) / 62.9) * 100}%`, '--i': i } as React.CSSProperties}>
                <b>R$ {brl(p as number)}</b><i /><span>{c}</span>
              </div>
            ))}
          </div>
        </div>
        {/* cena 6: alerta */}
        <div className={`vx-cena vx-c6 ${cls(5)}`}>
          <div className="vx-avisos">
            <div className="vx-aviso alta"><i />Óleo de massagem subiu 38% na sua cidade<small>agora</small></div>
            <div className="vx-aviso baixa"><i />Fantasia temática caiu 21% em 30 dias. Segure a recompra.<small>hoje</small></div>
          </div>
        </div>
        {/* cena 7: fecho */}
        <div className={`vx-cena vx-c7 ${cls(6)}`}>
          <p className="vx-fecho"><span>Compre o que vende.</span><strong>Venda com lucro.</strong></p>
          <a className="vx-cta" href={cta} onClick={e => e.stopPropagation()}>Testar 7 dias grátis</a>
          <small>Sem cartão de crédito · cancele quando quiser</small>
        </div>

        {/* capa */}
        {!comecou && (
          <div className="vx-capa">
            <span className="vx-play" aria-hidden><svg width="28" height="28" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></span>
            <p><strong>Por que o LuvyMetrics</strong><span>em 1 minuto</span></p>
          </div>
        )}
        {acabou && (
          <button className="vx-denovo" onClick={e => { e.stopPropagation(); tRef.current = 0; setTempo(0); setTocando(true) }}>Assistir de novo</button>
        )}
        <span className="vx-ex">dados de exemplo</span>
      </div>

      {comecou && <p className="vx-legenda" aria-live="polite">{CENAS[cena].frase}</p>}

      <div className="vx-controles">
        <button className="vx-btn" onClick={alterna} aria-label={tocando ? 'Pausar' : 'Tocar'}>
          {tocando
            ? <svg width="16" height="16" viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>}
        </button>
        <div className="vx-trilho" onClick={busca} role="slider" aria-label="Posição do vídeo" aria-valuemin={0} aria-valuemax={DURACAO} aria-valuenow={Math.round(tempo)}>
          {CENAS.slice(1).map(c => <span key={c.t} className="vx-marca" style={{ left: `${(c.t / DURACAO) * 100}%` }} />)}
          <span className="vx-feito" style={{ width: `${(tempo / DURACAO) * 100}%` }} />
        </div>
        <span className="vx-tempo">{fmt(tempo)} / {fmt(DURACAO)}</span>
      </div>
    </div>
  )
}
