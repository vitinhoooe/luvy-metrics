'use client'

/*
 * Versão A — "Floresta" (estrutura e regras do guia Trami, adaptadas ao LuvyMetrics).
 * O produto nasce da paisagem: céu, morros e copa; o painel fica entre os morros e a copa,
 * roda sozinho e sai de trás das árvores no scroll. O resto é preto, com cards grafite.
 *
 * Regras seguidas: duas escalas (--hu no hero, --su no resto); peças desenhadas num tamanho
 * fixo e reduzidas como um print (--escala); só as camadas do hero seguem a rolagem (transform);
 * texto entra por marco, checado a cada quadro de rolagem; interface viva só com a peça na tela;
 * Lenis só com mouse/trackpad; hover desligado enquanto rola; nada rola para o lado.
 */

import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import './landing.css'

const CTA = '/login'
// TODO: número real do WhatsApp (só dígitos, com 55 e DDD)
const WHATSAPP = 'https://wa.me/55XXXXXXXXXXX'

/* ---------- utilidades ---------- */

function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}
const semMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const toque = () => typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches
const brl = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function useNaTela<T extends Element>(ref: React.RefObject<T | null>) {
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVis(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return vis
}

/** Peça desenhada num tamanho fixo e reduzida inteira: escreve --escala = largura ÷ largura de design. */
function useEscala<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const de = parseFloat(getComputedStyle(el).getPropertyValue('--de')) || 1
      el.style.setProperty('--escala', (e.contentRect.width / de).toFixed(4))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
}

/** Número que conta até o alvo direto no DOM (sem re-render por quadro). */
function Conta({ alvo, ativo }: { alvo: number; ativo: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!ativo) { el.textContent = '—'; return }
    if (semMovimento()) { el.textContent = brl(alvo); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900)
      el.textContent = brl(alvo * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [alvo, ativo])
  return <span ref={ref}>—</span>
}

/* ---------- ícones (sprite inline, traço único) ---------- */

const ICONES: Record<string, React.ReactNode> = {
  tendencia: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  calculadora: <><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" /></>,
  comparar: <><path d="M7 4v16M17 4v16" /><path d="M3 8l4-4 4 4M13 16l4 4 4-4" /></>,
  estoque: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>,
  regiao: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  alerta: <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  chat: <><path d="M4 12a8 8 0 1 1 3.3 6.5L4 20l1.4-3.4A8 8 0 0 1 4 12z" /><path d="M9 11h6M9 14h4" /></>,
  painel: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
  loja: <><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9v11h16V9" /><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /></>,
  sacola: <><path d="M5 8h14l-1 13H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  seta: <path d="M5 12h13M13 6l6 6-6 6" />,
  estrela: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
}

function Icone({ nome, size = 22 }: { nome: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONES[nome]}
    </svg>
  )
}

/* ---------- logo: L feito de gráfico ---------- */

function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg className="lv-logo" width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#000" />
      <circle cx="16" cy="16" r="15.5" fill="none" stroke="rgba(255,255,255,.14)" />
      <path d="M10 8v15h13" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path className="lv-logo-line" d="M12.5 19.5l3.5-3.5 2.6 2 4-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="lv-logo-node" cx="22.6" cy="13" r="2" fill="#e9a7a0" />
    </svg>
  )
}

/* ---------- paisagem desenhada (poucos caminhos: leve para rolar) ---------- */

function linhaDeArvores(seed: number, base: number, amp: number, rMin: number, rMax: number) {
  const r = rng(seed)
  let x = -40, y = base
  let d = `M-40 600 L-40 ${base}`
  while (x < 1640) {
    const w = 2 * (rMin + r() * (rMax - rMin))
    const yFim = base + (r() - 0.5) * amp
    const alto = w * (0.45 + r() * 0.5)
    d += ` Q${(x + w / 2).toFixed(1)} ${(Math.min(y, yFim) - alto * 1.6).toFixed(1)} ${(x + w).toFixed(1)} ${yFim.toFixed(1)}`
    x += w; y = yFim
  }
  return d + ' L1640 600 Z'
}
const ARV_FUNDO = linhaDeArvores(11, 205, 60, 9, 20)
const ARV_MEIO = linhaDeArvores(23, 190, 70, 11, 24)
const ARV_FRENTE = linhaDeArvores(5, 175, 90, 12, 30)

function Copa({ id, espelho = false }: { id: string; espelho?: boolean }) {
  return (
    <svg className={`lv-copa-svg ${espelho ? 'espelho' : ''}`} viewBox="0 40 1600 560" preserveAspectRatio="xMidYMin slice" aria-hidden>
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c9c1" stopOpacity=".95" />
          <stop offset=".14" stopColor="#e9a7a0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-chao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".3" stopColor="#050506" stopOpacity="0" />
          <stop offset=".85" stopColor="#050506" />
        </linearGradient>
      </defs>
      <path d={ARV_FUNDO} fill="#2a1d24" />
      <path d={ARV_MEIO} fill="#170f14" stroke={`url(#${id}-rim)`} strokeWidth="1.5" opacity=".95" />
      <path d={ARV_FRENTE} fill="#0b080b" stroke={`url(#${id}-rim)`} strokeWidth="2.5" />
      <rect y="40" width="1600" height="560" fill={`url(#${id}-chao)`} />
    </svg>
  )
}

function Fundo() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="lv-nevoa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0b2a8" stopOpacity=".3" />
          <stop offset="1" stopColor="#e9a7a0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 560 C180 480 330 530 480 492 S800 400 980 470 S1340 430 1600 498 V900 H0Z" fill="#2c2531" />
      <path d="M0 560 C180 480 330 530 480 492 S800 400 980 470 S1340 430 1600 498 V640 H0Z" fill="url(#lv-nevoa)" />
      <path d="M0 640 C220 570 420 626 640 582 S1000 542 1200 590 S1480 560 1600 586 V900 H0Z" fill="#1e1a22" />
      <path d="M0 640 C220 570 420 626 640 582 S1000 542 1200 590 S1480 560 1600 586 V700 H0Z" fill="url(#lv-nevoa)" opacity=".55" />
    </svg>
  )
}

/* ---------- painel do produto (1180 × 740 de design; dados de exemplo) ---------- */

const PRODUTOS = [
  { nome: 'Gel lubrificante 60 ml', var: 12 },
  { nome: 'Kit presente casal', var: 9 },
  { nome: 'Vela aromática', var: 6 },
  { nome: 'Óleo de massagem', var: 38 },
  { nome: 'Lingerie renda', var: -4 },
]
const ALERTAS = [
  { t: 'Óleo de massagem subiu 38%', c: 'Curitiba', h: 'agora' },
  { t: 'Kit presente casal subiu 9%', c: 'Londrina', h: '2 h' },
  { t: 'Fantasia temática caiu 21%', c: 'Curitiba', h: 'ontem', baixa: true },
  { t: 'Vela aromática subiu 14%', c: 'Joinville', h: 'ontem' },
]
const CUSTO = 22, EXTRA = 3.5, TAXA = 0.14, MARGEM = 0.4
const PRECO = (CUSTO + EXTRA) / (1 - TAXA - MARGEM)

function Painel() {
  const moldura = useRef<HTMLDivElement>(null)
  useEscala(moldura)
  const vis = useNaTela(moldura)
  const [passo, setPasso] = useState(0)
  const [rodada, setRodada] = useState(0)

  useEffect(() => {
    const el = moldura.current
    if (el && toque()) el.setAttribute('inert', '')
  }, [])

  useEffect(() => {
    if (semMovimento()) { setPasso(4); return }
    if (!vis) return
    const id = setInterval(() => setPasso(p => {
      if (p >= 4) { setRodada(r => r + 1); return 0 }
      return p + 1
    }), 1700)
    return () => clearInterval(id)
  }, [vis])

  const ordem = passo >= 1 ? [3, 0, 1, 2, 4] : [0, 1, 2, 3, 4]
  const lista = passo >= 4 ? ALERTAS.slice(0, 3) : ALERTAS.slice(1, 4)

  return (
    <div className="lv-moldura" ref={moldura} data-moldura role="img"
      aria-label="Exemplo do painel do LuvyMetrics: ranking de produtos em alta, preço ideal, comparador e alertas">
      <div className="lv-app">
        <aside className="lv-app-side">
          <div className="lv-app-brand"><Logo size={22} /> LuvyMetrics</div>
          {[['painel', 'Painel'], ['tendencia', 'Tendências'], ['calculadora', 'Calculadora'], ['comparar', 'Comparador'], ['estoque', 'Estoque'], ['regiao', 'Regiões'], ['alerta', 'Alertas']].map(([ic, m], i) => (
            <div key={m} className={`lv-app-menu ${i === 1 ? 'on' : ''}`}><Icone nome={ic} size={16} />{m}</div>
          ))}
          <div className="lv-app-plano"><small>Teste grátis</small><b>7 dias</b></div>
        </aside>
        <div className="lv-app-main">
          <div className="lv-app-bar">
            <div>
              <div className="lv-app-h">Tendências</div>
              <div className="lv-app-sync"><i /> Curitiba · PR · atualizado hoje</div>
            </div>
            <div className="lv-app-bar-dir">
              <span className="lv-app-ex">Dados de exemplo</span>
              <span className="lv-app-btn">Exportar</span>
              <span className="lv-app-btn dark">Ver cidade</span>
            </div>
          </div>
          <div className="lv-app-grid">
            <section className="lv-ui-card lv-ui-rank">
              <h4>Em alta esta semana <em>{passo >= 1 ? '1 subiu de posição' : 'semana atual'}</em></h4>
              <div className="lv-rank">
                {PRODUTOS.map((p, i) => {
                  const pos = ordem.indexOf(i)
                  return (
                    <div key={p.nome} className={`lv-rank-row ${i === 3 && passo >= 1 ? 'hot' : ''}`} style={{ transform: `translateY(${pos * 46}px)` }}>
                      <span className="lv-rank-n">{pos + 1}</span>
                      <span>{p.nome}</span>
                      <span className="lv-spark"><i style={{ width: `${Math.min(100, Math.abs(p.var) * 2.3)}%` }} className={p.var < 0 ? 'down' : ''} /></span>
                      <span className={`lv-rank-var ${p.var < 0 ? 'down' : ''}`}>{p.var < 0 ? '−' : '+'}{Math.abs(p.var)}%</span>
                    </div>
                  )
                })}
              </div>
            </section>
            <section className="lv-ui-card lv-ui-calc">
              <h4>Preço ideal · Óleo de massagem</h4>
              <dl className="lv-calc">
                {[['Custo do produto', `R$ ${brl(CUSTO)}`], ['Embalagem e envio', `R$ ${brl(EXTRA)}`], ['Taxa do canal', '14%'], ['Margem desejada', '40%']].map(([a, b], i) => (
                  <div key={a} className={passo >= 2 ? 'ok' : ''} style={{ transitionDelay: `${i * 120}ms` }}><dt><i><Icone nome="check" size={11} /></i>{a}</dt><dd>{b}</dd></div>
                ))}
              </dl>
              <div className="lv-calc-total"><span>Preço sugerido</span><strong>R$ <Conta alvo={PRECO} ativo={passo >= 2} /></strong></div>
              <div className="lv-calc-lucro">Lucro por unidade <b>R$ <Conta alvo={PRECO * MARGEM} ativo={passo >= 2} /></b></div>
            </section>
            <section className="lv-ui-card lv-comp">
              <h4>Comparador</h4>
              {[{ c: 'Mercado Livre', p: 62.9 }, { c: 'Shopee', p: 58.4 }, { c: 'Sua loja', p: PRECO }].map((x, i) => (
                <div key={x.c} className={`lv-comp-row ${passo >= 3 && i === 2 ? 'win' : ''}`}><span>{x.c}</span><b>R$ {brl(x.p)}</b></div>
              ))}
            </section>
            <section className="lv-ui-card lv-ui-alertas">
              <h4>Alertas recentes <em className="lv-cont">{12 + rodada * 1 + (passo >= 4 ? 1 : 0)} no mês</em></h4>
              <ul>
                {lista.map((a, i) => (
                  <li key={`${a.t}-${passo >= 4 ? 'n' : 'v'}`} className={`${a.baixa ? 'baixa' : ''} ${passo >= 4 && i === 0 ? 'novo' : ''}`}>
                    <i />{a.t}<span>{a.c}</span><time>{a.h}</time>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className={`lv-toast ${passo === 3 ? 'on' : ''}`}><Icone nome="check" size={14} /> Seu preço está abaixo dos dois marketplaces</div>
          <div className={`lv-cursor ${vis ? 'run' : ''}`}><svg width="14" height="16" viewBox="0 0 14 16"><path d="M1 1l12 7-5.5 1.3L5 15z" fill="#2f9e6b" /></svg><span>Você</span></div>
        </div>
      </div>
    </div>
  )
}

/* ---------- peças de seção ---------- */

function Titulo({ linhas, className = '' }: { linhas: string[]; className?: string }) {
  return (
    <h2 className={`lv-title serifa ${className}`} data-titulo="">
      {linhas.map((l, i) => (
        <span key={i} className="linha"><span style={{ '--atraso': `${i * 110}ms` } as React.CSSProperties}>{l}</span></span>
      ))}
    </h2>
  )
}

function Btn({ href, children, variante = 'branco' }: { href: string; children: React.ReactNode; variante?: 'branco' | 'grafite' }) {
  return (
    <a href={href} className={`botao botao--${variante}`}>
      <span>{children}</span>
      <Icone nome="seta" size={16} />
    </a>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip" data-entra=""><Logo size={20} />{children}</span>
}

/* ---------- seções ---------- */

function PorQue() {
  return (
    <section className="secao" id="por-que">
      <Chip>Por que o LuvyMetrics</Chip>
      <Titulo linhas={['Estoque parado', 'é dinheiro parado']} />
      <div className="lv-pq card" data-entra="">
        <div className="lv-pq-ill">
          <div className="lv-pq-tela">
            <div className="lv-pq-topo"><b>Últimos 30 dias</b><span>Curitiba · PR</span></div>
            {([['Óleo de massagem', 38], ['Gel lubrificante', 12], ['Kit presente casal', 9], ['Fantasia temática', -21]] as const).map(([n, v], i) => (
              <div key={n} className="lv-pq-row" style={{ '--atraso': `${350 + i * 120}ms` } as React.CSSProperties}>
                <span>{n}</span>
                <span className="lv-pq-bar"><i style={{ width: `${Math.min(100, Math.abs(v) * 2.4)}%` }} className={v < 0 ? 'down' : ''} /></span>
                <b className={v < 0 ? 'down' : ''}>{v < 0 ? '−' : '+'}{Math.abs(v)}%</b>
              </div>
            ))}
            <div className="lv-pq-balao"><Icone nome="alerta" size={14} /> Segure a recompra de Fantasia temática</div>
          </div>
        </div>
        <div className="lv-pq-txt">
          <span className="lv-ladrilho"><Logo size={26} /></span>
          <h3 className="serifa">Feito para quem compra com o próprio dinheiro</h3>
          <p>Antes de fechar o pedido com o fornecedor, você vê o que está subindo e o que está parando na sua região. Compra mais do que gira, menos do que encalha.</p>
          <Btn href="#como-funciona" variante="grafite">Ver como funciona</Btn>
        </div>
        <svg className="lv-pq-fantasma" viewBox="0 0 32 32" aria-hidden><path d="M10 8v15h13" /><path d="M12.5 19.5l3.5-3.5 2.6 2 4-5" /><circle cx="22.6" cy="13" r="2" /></svg>
      </div>
    </section>
  )
}

function Como() {
  return (
    <section className="secao" id="como-funciona">
      <Titulo linhas={['Do palpite ao pedido', 'em três passos']} />
      <div className="lv-passos trilho">
        <article className="lv-passo card" data-entra="">
          <div className="lv-tela">
            {['Curitiba · PR', 'Londrina · PR', 'Joinville · SC'].map((c, i) => (
              <div key={c} className="lv-cidade" style={{ '--atraso': `${450 + i * 150}ms` } as React.CSSProperties}><Icone nome="regiao" size={16} />{c}</div>
            ))}
            <div className="lv-chave"><span /> Cidade ativa</div>
          </div>
          <small>1</small><h3>Escolha sua cidade</h3>
          <p>O painel passa a mostrar o que vende perto de você, não a média do Brasil.</p>
        </article>
        <article className="lv-passo card meio" data-entra="" style={{ '--atraso': '120ms' } as React.CSSProperties}>
          <div className="lv-tela lv-barras">
            {[38, 56, 44, 86, 50].map((h, i) => <i key={i} className={i === 3 ? 'hot' : ''} style={{ height: `${h}%`, '--atraso': `${450 + i * 90}ms` } as React.CSSProperties} />)}
            <span className="lv-barras-tag">+38% na semana</span>
          </div>
          <small>2</small><h3>Leia o ranking da semana</h3>
          <p>Os produtos que mais crescem na sua cidade, e o aviso do que começou a cair.</p>
        </article>
        <article className="lv-passo card" data-entra="" style={{ '--atraso': '240ms' } as React.CSSProperties}>
          <div className="lv-tela lv-mcalc">
            <div><span>Custo</span><b>R$ 22,00</b></div>
            <div><span>Taxa do canal</span><b>14%</b></div>
            <div><span>Margem</span><b>40%</b></div>
            <div className="tot"><span>Preço sugerido</span><b>R$ {brl(PRECO)}</b></div>
          </div>
          <small>3</small><h3>Precifique antes de anunciar</h3>
          <p>Custo, frete e a taxa de cada canal entram na conta. Sai o preço que mantém sua margem.</p>
        </article>
      </div>
    </section>
  )
}

// Palco dos recursos: 1200 × 480 de design (600 × 700 no celular). Só funções que o app tem.
const RECURSOS = [
  { ic: 'tendencia', n: 'Ranking', x: 190, y: 110, xm: 110, ym: 120 },
  { ic: 'calculadora', n: 'Preço ideal', x: 330, y: 260, xm: 300, ym: 70 },
  { ic: 'sacola', n: 'Mercado Livre', x: 180, y: 390, xm: 490, ym: 120 },
  { ic: 'loja', n: 'Shopee', x: 420, y: 110, xm: 90, ym: 300 },
  { ic: 'comparar', n: 'Comparador', x: 780, y: 110, xm: 510, ym: 300 },
  { ic: 'estoque', n: 'Estoque', x: 870, y: 260, xm: 90, ym: 480 },
  { ic: 'regiao', n: 'Regiões', x: 1010, y: 110, xm: 510, ym: 480 },
  { ic: 'alerta', n: 'Alertas', x: 1020, y: 390, xm: 160, ym: 620 },
  { ic: 'chat', n: 'Assistente', x: 780, y: 410, xm: 440, ym: 620 },
  { ic: 'painel', n: 'Painel diário', x: 420, y: 410, xm: 300, ym: 640 },
]

function Recursos() {
  const palco = useRef<HTMLDivElement>(null)
  useEscala(palco)
  const vis = useNaTela(palco)
  const [ativo, setAtivo] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const [cel, setCel] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const f = () => setCel(mq.matches)
    f(); mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  useEffect(() => {
    if (!vis || semMovimento()) return
    const id = setInterval(() => setAtivo(a => (a + 1) % RECURSOS.length), 1400)
    return () => clearInterval(id)
  }, [vis])
  const W = cel ? 600 : 1200, H = cel ? 700 : 480
  const cx = W / 2, cy = cel ? 380 : 260
  const aceso = hover ?? ativo
  return (
    <section className="secao" id="recursos">
      <Titulo linhas={['Sua loja inteira', 'num painel só']} />
      <p className="lv-sub" data-entra="">Tendências, preço, comparação e estoque juntos. Sem planilha e sem abrir dez abas.</p>
      <div className="lv-rec card" data-entra="">
        <div className="lv-folhas" aria-hidden />
        <div className="lv-palco" ref={palco}>
          <div className="lv-palco-in">
            <svg className="lv-fios" viewBox={`0 0 ${W} ${H}`} aria-hidden>
              {RECURSOS.map((r, i) => {
                const x = cel ? r.xm : r.x, y = cel ? r.ym : r.y
                const mx = (cx + x) / 2, my = (cy + y) / 2 - (x - cx) * 0.12
                const d = `M${cx} ${cy} Q${mx} ${my} ${x} ${y}`
                return (
                  <g key={r.n} className={i === aceso ? 'on' : ''}>
                    <path d={d} className="base" />
                    <path d={d} className="luz" pathLength={100} />
                  </g>
                )
              })}
            </svg>
            <div className="lv-centro" style={{ left: cx, top: cy }}><Logo size={58} /><span>LuvyMetrics</span></div>
            {RECURSOS.map((r, i) => (
              <button key={r.n} type="button" className={`lv-no ${i === aceso ? 'on' : ''}`}
                style={{ left: cel ? r.xm : r.x, top: cel ? r.ym : r.y }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                <span className="lv-no-ico"><Icone nome={r.ic} size={24} /></span>
                <span className="lv-no-nome">{r.n}</span>
                <span className="lv-no-ok"><Icone nome="check" size={10} /></span>
              </button>
            ))}
          </div>
        </div>
        <div className="lv-rec-copa"><Copa id="c2" espelho /></div>
      </div>
    </section>
  )
}

function Planos() {
  const [anual, setAnual] = useState(false)
  const planos = [
    { nome: 'Teste grátis', ic: 'estrela', mensal: '0', anualV: '0', nota: 'por 7 dias', cta: 'Começar o teste', href: CTA, itens: ['Todos os recursos liberados', 'Sem cartão de crédito', 'Ranking da sua cidade'] },
    { nome: 'Lojista', ic: 'loja', mensal: '97', anualV: '80,83', nota: anual ? 'por mês, cobrado R$ 970 por ano' : 'por mês', cta: 'Assinar o Lojista', href: CTA, destaque: true,
      itens: ['Ranking de tendências da sua cidade', 'Calculadora de preço ideal', 'Comparador Mercado Livre e Shopee', 'Controle de estoque', 'Alertas de alta e queda'] },
    { nome: 'Rede', ic: 'regiao', mensal: null, anualV: null, nota: 'para várias lojas', cta: 'Falar no WhatsApp', href: WHATSAPP, itens: ['Várias lojas e cidades', 'Tudo do Lojista', 'Atendimento direto'] },
  ]
  const chave = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setAnual(true)
    if (e.key === 'ArrowLeft') setAnual(false)
  }
  return (
    <section className="secao" id="precos">
      <Titulo linhas={['Teste grátis.', 'Assine se gostar.']} className="dim2" />
      <div className="lv-toggle" data-entra="" role="radiogroup" aria-label="Período de cobrança" onKeyDown={chave}>
        <span className={`lv-toggle-bg ${anual ? 'r' : ''}`} />
        <button role="radio" aria-checked={!anual} className={!anual ? 'on' : ''} onClick={() => setAnual(false)}>Mensal</button>
        <button role="radio" aria-checked={anual} className={anual ? 'on' : ''} onClick={() => setAnual(true)}>Anual <em>2 meses grátis</em></button>
      </div>
      <div className="lv-planos trilho">
        {planos.map((p, i) => {
          const preco = anual ? p.anualV : p.mensal
          return (
            <article key={p.nome} className={`lv-plano card ${p.destaque ? 'claro' : ''}`} data-entra="" style={{ '--atraso': `${i * 90}ms` } as React.CSSProperties}>
              <div className="lv-plano-topo">
                <span className="lv-ladrilho sm"><Icone nome={p.ic} size={18} /></span>
                <h3>{p.nome}</h3>
                {p.destaque && <span className="lv-selo">Mais escolhido</span>}
              </div>
              <div className="lv-preco">
                {preco ? <><small>R$</small><strong key={preco} className="serifa">{preco}</strong></> : <strong className="serifa sm">Sob consulta</strong>}
              </div>
              <p className="lv-plano-nota">{p.nota}</p>
              <a className="lv-plano-cta" href={p.href}>{p.cta}</a>
              <ul>{p.itens.map(it => <li key={it}><Icone nome="check" size={16} />{it}</li>)}</ul>
            </article>
          )
        })}
      </div>
      <p className="lv-fino" data-entra="">Preços em reais, sem fidelidade. No anual, cobrado uma vez por ano.</p>
    </section>
  )
}

const FAQ = [
  { p: 'Preciso de cartão para testar?', r: 'Não. Você cria a conta e usa tudo por 7 dias. Só paga se decidir assinar.' },
  { p: 'Serve para loja física ou só para quem vende online?', r: 'Para as duas. O ranking é por cidade, e a calculadora tem as taxas de cada canal, inclusive a venda no balcão.' },
  { p: 'Alguém vê os números da minha loja?', r: 'Não. O seu painel é privado e os dados da sua loja ficam só na sua conta.' },
  { p: 'Tem fidelidade?', r: 'Não. No mensal você cancela quando quiser. No anual, paga uma vez e usa o ano inteiro.' },
]

/* ---------- página ---------- */

export default function Landing() {
  const hero = useRef<HTMLElement>(null)
  const nav = useRef<HTMLElement>(null)
  const rodape = useRef<HTMLElement>(null)

  useEffect(() => {
    const html = document.documentElement
    html.classList.add('lv-page')
    const reduz = semMovimento()
    const dedo = toque()
    if (dedo) html.classList.add('toque')

    // Lenis só com mouse ou trackpad, nunca no toque nem com movimento reduzido
    const lenis = !reduz && window.matchMedia('(hover: hover) and (pointer: fine)').matches
      ? new Lenis({ autoRaf: true, smoothWheel: true, syncTouch: false, anchors: { offset: -72 } })
      : null
    if (lenis) html.classList.add('lenis')

    const camadas = [...(hero.current?.querySelectorAll<HTMLElement>('[data-camada]') ?? [])]
    const pendentes = new Set(document.querySelectorAll<HTMLElement>('[data-entra], [data-titulo]'))
    let vidro = false, escondida = false, rolando = 0, raf = 0

    // um cálculo por quadro, para tudo o que segue a rolagem
    const quadro = () => {
      raf = 0
      const y = window.scrollY, vh = window.innerHeight
      // camadas do hero: translateY = k × scrollY (fundo 0,5; copa 0,14 / 0,06 no celular; painel e texto −0,22)
      if (!reduz && hero.current && y < hero.current.offsetHeight + vh) {
        const cel = window.innerWidth <= 760
        for (const el of camadas) {
          const tipo = el.dataset.camada
          const k = tipo === 'fundo' ? 0.5 : tipo === 'copa' ? (cel ? 0.06 : 0.14) : -0.22
          el.style.transform = `translate3d(0,${(y * k).toFixed(1)}px,0)`
        }
      }
      // entradas por marco: topo abaixo de 88% da tela entra; quem já passou entra direto no final
      for (const el of pendentes) {
        const top = el.getBoundingClientRect().top
        if (top < vh * 0.88) {
          if (top < -el.offsetHeight) el.classList.add('direto')
          el.classList.add('in')
          pendentes.delete(el)
        }
      }
      // nav: vidro depois de 24 px; sobe para fora quando o rodapé encosta nela
      if ((y > 24) !== vidro) { vidro = y > 24; nav.current?.classList.toggle('vidro', vidro) }
      const topoRodape = rodape.current?.getBoundingClientRect().top ?? 1e9
      const sai = topoRodape < 80
      if (sai !== escondida) { escondida = sai; nav.current?.classList.toggle('sai', sai) }
    }
    const pede = () => { if (!raf) raf = requestAnimationFrame(quadro) }
    const onScroll = () => {
      pede()
      if (!dedo) { html.classList.add('is-scrolling'); clearTimeout(rolando); rolando = window.setTimeout(() => html.classList.remove('is-scrolling'), 150) }
    }
    if (lenis) lenis.on('scroll', quadro)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', pede)
    quadro()

    // estado de clique no toque (70 ms, para não piscar no arrasto)
    let tToque = 0
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      const alvo = (e.target as HTMLElement).closest('a, button')
      if (!alvo) return
      tToque = window.setTimeout(() => alvo.classList.add('apertou'), 70)
      const solta = () => { clearTimeout(tToque); setTimeout(() => alvo.classList.remove('apertou'), 120); window.removeEventListener('pointerup', solta); window.removeEventListener('pointercancel', solta) }
      window.addEventListener('pointerup', solta); window.addEventListener('pointercancel', solta)
    }
    window.addEventListener('pointerdown', onDown, { passive: true })

    // entrada do hero (o céu e a copa já estão lá; o resto sobe)
    const pronto = requestAnimationFrame(() => html.classList.add('lv-ready'))

    return () => {
      lenis?.destroy()
      html.classList.remove('lv-page', 'lv-ready', 'lenis', 'toque', 'is-scrolling')
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', pede)
      window.removeEventListener('pointerdown', onDown)
      cancelAnimationFrame(raf); cancelAnimationFrame(pronto); clearTimeout(rolando)
    }
  }, [])

  const d = (s: string) => ({ '--d': s }) as React.CSSProperties

  return (
    <div className="lv">
      <a className="lv-pular" href="#conteudo">Pular para o conteúdo</a>

      <header className="lv-nav" ref={nav}>
        <a href="#" className="lv-marca" aria-label="LuvyMetrics, início"><Logo /> <span>LuvyMetrics</span></a>
        <nav className="lv-nav-links" aria-label="Principal">
          <a href="#por-que">Produto</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#recursos">Recursos</a>
          <a href="#precos">Preços</a>
          <a href="#duvidas">Dúvidas</a>
        </nav>
        <div className="lv-nav-cta">
          <a href="/login" className="botao botao--branco pequeno">Entrar</a>
          <a href={CTA} className="botao botao--grafite pequeno">Testar grátis</a>
        </div>
      </header>

      <main id="conteudo">
        {/* 01 · HERO */}
        <section className="lv-hero" ref={hero}>
          <div className="lv-camada lv-fundo" data-camada="fundo">
            <div className="lv-ceu" />
            <div className="lv-morros"><Fundo /></div>
          </div>
          <div className="lv-camada lv-frente" data-camada="frente">
            <div className="lv-hero-copy">
              <a href="#por-que" className="lv-hero-chip entra-hero" style={d('.32s')}><i /> Inteligência de mercado para sex shops <span aria-hidden>→</span></a>
              <h1 className="lv-hero-titulo serifa">
                <span className="linha"><span className="entra-linha" style={d('.06s')}>Saiba o que vende</span></span>
                <span className="linha"><span className="entra-linha" style={d('.17s')}>antes de comprar</span></span>
              </h1>
              <p className="lv-hero-sub entra-hero" style={d('.42s')}>
                O LuvyMetrics mostra os produtos que estão saindo na sua cidade, calcula o preço com todas as taxas e compara com o Mercado Livre e a Shopee.
              </p>
              <div className="lv-hero-acoes entra-hero" style={d('.52s')}>
                <Btn href={CTA}>Testar grátis por 7 dias</Btn>
                <span className="lv-nota"><Icone nome="check" size={15} /> Sem cartão de crédito</span>
              </div>
            </div>
            <div className="lv-palco-hero"><div className="lv-nasce"><Painel /></div></div>
          </div>
          <div className="lv-camada lv-copa" data-camada="copa"><Copa id="c1" /></div>
          <div className="lv-hero-pe" aria-hidden />
          <p className="lv-hero-faixa" data-entra="">Ranking atualizado todos os dias,<br /><span>cidade por cidade.</span></p>
        </section>

        <PorQue />
        <Como />
        <Recursos />
        <Planos />

        {/* DÚVIDAS */}
        <section className="secao estreita" id="duvidas">
          <Titulo linhas={['Perguntas frequentes']} />
          <div className="lv-faq" data-entra="">
            {FAQ.map(f => (
              <details key={f.p}>
                <summary>{f.p}<span aria-hidden /></summary>
                <p>{f.r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 07 · FECHO */}
        <section className="secao lv-fecho">
          <Titulo linhas={['Seu próximo pedido,', 'com dados na mão']} className="fecho" />
          <p className="lv-sub" data-entra="">7 dias grátis, sem cartão de crédito.</p>
          <div className="lv-fecho-acoes" data-entra="">
            <Btn href={CTA}>Testar grátis</Btn>
            <Btn href={WHATSAPP} variante="grafite">Falar no WhatsApp</Btn>
          </div>
        </section>
      </main>

      <footer className="lv-rodape" ref={rodape}>
        <div className="lv-rodape-topo">
          <div className="lv-rodape-marca">
            <a href="#" className="lv-marca"><Logo /> <span>LuvyMetrics</span></a>
            <p>Inteligência de mercado para sex shops.</p>
          </div>
          <div className="lv-rodape-cols">
            <div><h6>Produto</h6><a href="#recursos">Recursos</a><a href="#precos">Preços</a><a href="/login">Entrar</a></div>
            <div><h6>Empresa</h6><a href="#por-que">Sobre</a><a href="#duvidas">Dúvidas</a></div>
            {/* TODO: link do Instagram */}
            <div><h6>Contato</h6><a href={WHATSAPP}>WhatsApp</a><a href="#">Instagram</a></div>
          </div>
        </div>
        <div className="lv-rodape-linha">
          <span>© {new Date().getFullYear()} LuvyMetrics</span>
          {/* TODO: páginas de Termos e Privacidade (LGPD) */}
          <span className="lv-rodape-legal"><a href="#">Termos de uso</a><a href="#">Privacidade</a></span>
        </div>
        <div className="lv-gigante" data-entra="" aria-hidden>
          <div className="lv-gigante-nome serifa">Luvy<i /></div>
          <div className="lv-gigante-copa"><Copa id="c3" /></div>
        </div>
      </footer>
    </div>
  )
}
