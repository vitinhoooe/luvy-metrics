'use client'

import { useEffect, useRef, useState } from 'react'
import VideoReal from './VideoReal'
import './mosaik.css'

const SIGNUP_URL = '/login'
// TODO: número real do WhatsApp
const WHATSAPP = 'https://wa.me/55XXXXXXXXXXX'

const semMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const desktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 901px)').matches

/* ---------- ícones ---------- */
const P: Record<string, React.ReactNode> = {
  seta: <path d="M5 12h13M13 6l6 6-6 6" />,
  tendencia: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  calc: <><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" /></>,
  comparar: <><path d="M7 4v16M17 4v16" /><path d="M3 8l4-4 4 4M13 16l4 4 4-4" /></>,
  pino: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  busca: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  sino: <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  cadeado: <><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  insta: <><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.6" /><path d="M16.8 7.2h.01" /></>,
  chat: <><path d="M4 12a8 8 0 1 1 3.3 6.5L4 20l1.4-3.4A8 8 0 0 1 4 12z" /></>,
}
const I = ({ n, s = 20 }: { n: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{P[n]}</svg>
)

/* ---------- marca ---------- */
function Marca({ size = 28, claro = true }: { size?: number; claro?: boolean }) {
  const c = claro ? '#f4f4f4' : '#0d0d0f'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M8 6v19h18" stroke={c} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 20l4.5-4.5 3.4 2.6 5.6-7" stroke={c} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25" cy="11.1" r="2.4" fill={c} />
    </svg>
  )
}
function Logo({ claro = true }: { claro?: boolean }) {
  return <span className={`mk-logo ${claro ? '' : 'dark'}`}><Marca size={26} claro={claro} /> LuvyMetrics</span>
}

/** A marca em "metal": camadas empilhadas em 3D (sem WebGL), gira com o scroll. */
function MarcaMetal() {
  const camadas = 14
  return (
    <div className="mk-metal">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <linearGradient id="mk-face" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" /><stop offset=".28" stopColor="#c9c9ce" /><stop offset=".5" stopColor="#f2f2f4" />
            <stop offset=".72" stopColor="#8d8d93" /><stop offset="1" stopColor="#d7d7db" />
          </linearGradient>
        </defs>
      </svg>
      {Array.from({ length: camadas }, (_, i) => {
        const frente = i === camadas - 1
        const tom = 40 + Math.round((i / camadas) * 60)
        const cor = frente ? 'url(#mk-face)' : `rgb(${tom},${tom},${tom + 4})`
        return (
          <svg key={i} className="mk-metal-layer" viewBox="0 0 32 32" style={{ transform: `translateZ(${(i - camadas / 2) * 3}px)` }} aria-hidden>
            <path d="M8 6v19h18" stroke={cor} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.5 20l4.5-4.5 3.4 2.6 5.6-7" stroke={cor} strokeWidth="3.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="25" cy="11.1" r="3" fill={cor} />
          </svg>
        )
      })}
    </div>
  )
}

function BtnClaro({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="mk-btn-light"><span>{children}</span><i><I n="seta" s={16} /></i></a>
}
function BtnVidro({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="mk-btn-glass glass">{children}</a>
}

/* ---------- conteúdo ---------- */
type Card = { tipo: 'alta' | 'preco' | 'alerta'; t: string; a: string; b: string }
const FAIXA_1: Card[] = [
  { tipo: 'alta', t: 'Óleo de massagem', a: 'Curitiba · PR', b: '+38%' },
  { tipo: 'preco', t: 'Gel lubrificante 60 ml', a: 'Custo R$ 14,00 · taxa 14% · margem 40%', b: 'R$ 30,43' },
  { tipo: 'alerta', t: 'Fantasia temática', a: 'Caiu 21% em 30 dias', b: 'Segure a recompra' },
  { tipo: 'alta', t: 'Kit presente casal', a: 'Londrina · PR', b: '+9%' },
  { tipo: 'preco', t: 'Vela aromática', a: 'Custo R$ 18,00 · taxa 12% · margem 40%', b: 'R$ 37,50' },
  { tipo: 'alta', t: 'Lingerie renda', a: 'Joinville · SC', b: '+15%' },
]
const FAIXA_2: Card[] = [
  { tipo: 'preco', t: 'Óleo de massagem', a: 'Mercado Livre R$ 62,90', b: 'R$ 55,43' },
  { tipo: 'alta', t: 'Gel lubrificante 60 ml', a: 'Florianópolis · SC', b: '+12%' },
  { tipo: 'alerta', t: 'Vela aromática', a: 'Subiu 22% na semana', b: 'Reponha o estoque' },
  { tipo: 'alta', t: 'Kit presente casal', a: 'Porto Alegre · RS', b: '+11%' },
  { tipo: 'preco', t: 'Lingerie renda', a: 'Shopee R$ 74,00', b: 'R$ 69,90' },
  { tipo: 'alerta', t: 'Óleo de massagem', a: 'Restam 3 unidades', b: 'Estoque baixo' },
]
const ROTULO: Record<Card['tipo'], string> = { alta: 'Em alta', preco: 'Preço ideal', alerta: 'Alerta' }

function CardFaixa({ c }: { c: Card }) {
  return (
    <article className={`mk-card mk-card-${c.tipo}`}>
      <header><span className="mk-card-ico"><I n={c.tipo === 'alta' ? 'tendencia' : c.tipo === 'preco' ? 'calc' : 'sino'} s={16} /></span>{ROTULO[c.tipo]}<em>exemplo</em></header>
      <h4>{c.t}</h4>
      <p>{c.a}</p>
      <strong>{c.b}</strong>
    </article>
  )
}

const LISTA = [
  ['Óleo de massagem', '+38%'], ['Gel lubrificante 60 ml', '+12%'], ['Kit presente casal', '+9%'], ['Lingerie renda', '+6%'],
  ['Vela aromática', '+4%'], ['Bolinha funcional', '+2%'], ['Sabonete íntimo', '−3%'], ['Fantasia temática', '−21%'],
]
const DESCRICAO = 'Subiu 38% em Curitiba nas últimas 4 semanas. Preço ideal com 40% de margem: R$ 55,43.'
const PASSOS = [
  ['01', 'Abra o ranking da semana', 'O que mais cresceu na sua cidade, em ordem.'],
  ['02', 'Veja o que subiu e o que caiu', 'Alerta no painel quando algo dispara ou para.'],
  ['03', 'Confira o preço ideal', 'Custo, frete e taxa de cada canal já na conta.'],
  ['04', 'Faça o pedido', 'Mais do que gira, menos do que encalha.'],
]

const ANTES_DEPOIS: [string, string, string][] = [
  ['Seu tempo', 'Pulando entre planilha, marketplaces, calculadora e caderno', 'Tudo numa tela só, em poucos cliques'],
  ['O pedido ao fornecedor', 'No palpite, ou no que o vendedor empurrou', 'Pelo ranking do que mais cresce na sua cidade'],
  ['O preço de venda', 'Copiado do concorrente', 'Calculado com custo, frete, taxa e a sua margem'],
  ['O produto que começou a parar', 'Você descobre quando já encalhou', 'Alerta assim que ele começa a cair'],
  ['Mercado Livre e Shopee', 'Dez abas abertas para comparar', 'Seu preço lado a lado com os dois'],
  ['Onde fica a informação', 'Caderno, planilha e memória', 'Num painel só, atualizado todo dia'],
]

const FAQ = [
  ['Funciona na minha cidade?', 'O ranking é montado por região. No teste grátis você vê na hora o que aparece para a sua cidade, antes de pagar qualquer coisa.'],
  ['Não sou bom com tecnologia. Vou conseguir usar?', 'Se você usa o WhatsApp, usa o LuvyMetrics. É abrir o painel e ler a lista: o que subiu, o que caiu e por quanto vender.'],
  ['Já uso planilha. Qual a diferença?', 'A planilha mostra o que você já vendeu. O LuvyMetrics mostra o que a sua cidade está comprando agora, e faz a conta do preço por você.'],
  ['Preciso de cartão para testar?', 'Não. São 7 dias com tudo liberado. Se não fizer sentido para a sua loja, é só não assinar.'],
  ['E se eu quiser cancelar?', 'Sem fidelidade. No mensal você cancela quando quiser. No anual, paga uma vez e usa o ano inteiro.'],
]

const brlCalc = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** A conta que o próprio lojista faz: quanto dinheiro está parado e quanto custa o LuvyMetrics perto disso. */
function Calculadora() {
  const [parado, setParado] = useState(4000)
  const [custo, setCusto] = useState(25)
  const unidades = Math.floor(parado / custo)
  const pct = (97 / parado) * 100
  return (
    <div className="mk-calc reveal">
      <div className="mk-calc-in">
        <label>
          <span>Quanto você tem em produto parado há mais de 60 dias?</span>
          <b>R$ {parado.toLocaleString('pt-BR')}</b>
          <input type="range" min={500} max={30000} step={500} value={parado} onChange={e => setParado(Number(e.target.value))} aria-label="Valor em produto parado" />
        </label>
        <label>
          <span>Quanto custa, em média, cada produto para você?</span>
          <b>R$ {custo}</b>
          <input type="range" min={10} max={200} step={5} value={custo} onChange={e => setCusto(Number(e.target.value))} aria-label="Custo médio por produto" />
        </label>
      </div>
      <div className="mk-calc-out">
        <p className="mk-calc-n"><strong>{unidades.toLocaleString('pt-BR')}</strong> produtos parados</p>
        <p>São <b>R$ {parado.toLocaleString('pt-BR')}</b> que não viram pedido novo. Esse dinheiro poderia estar no que está saindo agora na sua cidade.</p>
        <p className="mk-calc-cmp">Um mês de LuvyMetrics custa <b>R$ 97</b>, ou <b>{brlCalc(pct)}%</b> do que está parado na sua prateleira.</p>
      </div>
    </div>
  )
}

const tocarVideo = (e: React.MouseEvent) => {
  e.preventDefault()
  document.getElementById('video')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  setTimeout(() => window.dispatchEvent(new Event('luvy-video-play')), 650)
}

export default function LandingMosaik() {
  const raiz = useRef<HTMLDivElement>(null)
  const metal = useRef<HTMLDivElement>(null)
  const faixas = useRef<HTMLElement>(null)
  const f1 = useRef<HTMLDivElement>(null)
  const f2 = useRef<HTMLDivElement>(null)
  const mock = useRef<HTMLDivElement>(null)
  const why = useRef<HTMLElement>(null)
  const ghost = useRef<HTMLDivElement>(null)
  const tipo = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const html = document.documentElement
    html.classList.add('mk-page')
    const reduz = semMovimento()

    // reveal: um observer para a página toda
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return
      e.target.classList.add('in')
      io.unobserve(e.target)
      if (e.target === mock.current) digitar()
      if (e.target.hasAttribute('data-count')) contar(e.target as HTMLElement)
    }), { threshold: 0, rootMargin: '0px 0px -10% 0px' })
    raiz.current!.querySelectorAll('.reveal, [data-count]').forEach(el => io.observe(el))
    if (mock.current) io.observe(mock.current)
    // rede de segurança para scroll muito rápido
    let rede = 0
    const onScrollRede = () => {
      clearTimeout(rede)
      rede = window.setTimeout(() => {
        raiz.current?.querySelectorAll('.reveal:not(.in), .mk-mock:not(.in)').forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('in'); io.unobserve(el)
            if (el === mock.current) digitar()
            if (el.hasAttribute('data-count')) contar(el as HTMLElement)
          }
        })
      }, 180)
    }
    window.addEventListener('scroll', onScrollRede, { passive: true })

    // texto digitado no mockup (o resto do texto segura o espaço)
    let timer = 0
    function digitar() {
      const el = tipo.current
      if (!el) return
      if (reduz) { el.dataset.done = '1'; (el.children[0] as HTMLElement).textContent = DESCRICAO; (el.children[1] as HTMLElement).textContent = ''; return }
      let i = 0
      const passo = () => {
        i++
        ;(el.children[0] as HTMLElement).textContent = DESCRICAO.slice(0, i)
        ;(el.children[1] as HTMLElement).textContent = DESCRICAO.slice(i)
        if (i < DESCRICAO.length) timer = window.setTimeout(passo, 30)
        else el.dataset.done = '1'
      }
      timer = window.setTimeout(passo, 550)
    }

    // números que contam
    function contar(el: HTMLElement) {
      const alvo = Number(el.dataset.count)
      const alvoEl = el.querySelector('b')!
      if (reduz) { alvoEl.textContent = String(alvo); return }
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1200)
        alvoEl.textContent = String(Math.round(alvo * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    // medidas só na montagem e no resize
    let larg1 = 0, larg2 = 0, topoFaixas = 0, topoWhy = 0, altWhy = 0
    const medir = () => {
      larg1 = (f1.current?.scrollWidth ?? 0) / 3
      larg2 = (f2.current?.scrollWidth ?? 0) / 3
      topoFaixas = faixas.current ? faixas.current.getBoundingClientRect().top + window.scrollY : 0
      if (why.current) { topoWhy = why.current.getBoundingClientRect().top + window.scrollY; altWhy = why.current.offsetHeight }
    }
    medir()
    window.addEventListener('resize', medir)

    let raf = 0
    const quadro = () => {
      raf = 0
      if (reduz) return
      const y = window.scrollY, vh = window.innerHeight
      const grande = desktop()
      const p = grande ? Math.min(1, Math.max(0, y / vh)) : 0
      const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      metal.current?.style.setProperty('--spin', `${(e * 0.7 * 360).toFixed(2)}deg`)
      if (grande && f1.current && larg1) {
        const d = (y - topoFaixas + vh) * 0.3
        f1.current.style.transform = `translate3d(${(-larg1 + (((d % larg1) + larg1) % larg1)).toFixed(1)}px,0,0)`
        f2.current!.style.transform = `translate3d(${(-(((d % larg2) + larg2) % larg2)).toFixed(1)}px,0,0)`
      }
      if (grande && ghost.current && altWhy) {
        const q = Math.max(-.5, Math.min(.5, (y + vh / 2 - (topoWhy + altWhy / 2)) / (altWhy + vh)))
        ghost.current.style.transform = `translateY(calc(-42% + ${(q * 300).toFixed(1)}px)) rotate(${(q * 8).toFixed(2)}deg) scale(${(1 + q * .14).toFixed(3)})`
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(quadro) }
    window.addEventListener('scroll', onScroll, { passive: true })
    quadro()

    // inclinação + luz do cursor no mockup e nos números (variáveis CSS, sem estado)
    const tiraTilt: (() => void)[] = []
    if (!reduz && window.matchMedia('(pointer: fine) and (min-width: 901px)').matches) {
      const liga = (el: HTMLElement | null, tilt: boolean) => {
        if (!el) return
        const move = (ev: PointerEvent) => {
          const r = el.getBoundingClientRect()
          const x = (ev.clientX - r.left) / r.width, yy = (ev.clientY - r.top) / r.height
          el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
          el.style.setProperty('--my', `${(yy * 100).toFixed(1)}%`)
          if (tilt) { el.style.setProperty('--rx', `${((x - .5) * 10).toFixed(2)}deg`); el.style.setProperty('--ry', `${(-(yy - .5) * 10).toFixed(2)}deg`) }
        }
        const sai = () => { el.style.removeProperty('--mx'); el.style.removeProperty('--my'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') }
        el.addEventListener('pointermove', move); el.addEventListener('pointerleave', sai)
        tiraTilt.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', sai) })
      }
      liga(mock.current, true)
      raiz.current!.querySelectorAll<HTMLElement>('.mk-stat').forEach(el => liga(el, false))
    }

    requestAnimationFrame(() => html.classList.add('mk-ready'))
    return () => {
      html.classList.remove('mk-page', 'mk-ready')
      io.disconnect(); clearTimeout(timer); cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll); window.removeEventListener('scroll', onScrollRede); clearTimeout(rede); window.removeEventListener('resize', medir)
      tiraTilt.forEach(f => f())
    }
  }, [])
  const d = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as React.CSSProperties

  return (
    <div className="mk" ref={raiz}>
      <div className="mk-grain" aria-hidden />

      {/* HERO: a promessa */}
      <section className="mk-hero">
        <nav className="mk-nav" aria-label="Principal">
          <a href="#" aria-label="LuvyMetrics, início"><Logo /></a>
          <div className="mk-nav-pill glass">
            <a href="#video">Vídeo</a><a href="#custo">Faça a conta</a><a href="#precos">Preços</a>
          </div>
          <BtnClaro href={SIGNUP_URL}>Testar grátis</BtnClaro>
        </nav>

        <div className="mk-hero-copy">
          <p className="mk-hero-tag reveal" style={d(0)}>Para donos de sex shop</p>
          <h1 className="reveal" style={d(60)}>
            <span>Chega de estoque parado.</span>
            <strong>Compre o que vende na sua cidade.</strong>
          </h1>
          <p className="mk-hero-sub reveal" style={d(150)}>
            Ranking da sua cidade, preço ideal e comparação com Mercado Livre e Shopee numa tela só. Você para de perder tempo pulando entre planilhas e para de apostar no pedido.
          </p>
          <div className="mk-hero-btns reveal" style={d(250)}>
            <BtnClaro href={SIGNUP_URL}>Testar 7 dias grátis</BtnClaro>
            <a href="#video" className="mk-btn-glass glass mk-btn-video" onClick={tocarVideo}><i aria-hidden>▶</i> Ver em 1 minuto</a>
          </div>
        </div>

        <div className="mk-stage" ref={metal} aria-hidden><MarcaMetal /></div>

        <a href="#video" className="mk-scroll" onClick={tocarVideo}>Assista ao vídeo</a>
        <p className="mk-hero-note reveal" style={d(350)}>
          <b>Sem cartão de crédito.</b> Você testa tudo por 7 dias e só assina se <u>fizer sentido para a sua loja</u>.
        </p>
      </section>

      {/* FAIXAS (só desktop) */}
      <section className="mk-strips" ref={faixas} aria-hidden>
        <div className="mk-strip" ref={f1}>{[0, 1, 2].flatMap(k => FAIXA_1.map((c, i) => <CardFaixa key={`${k}-${i}`} c={c} />))}</div>
        <div className="mk-strip" ref={f2}>{[0, 1, 2].flatMap(k => FAIXA_2.map((c, i) => <CardFaixa key={`${k}-${i}`} c={c} />))}</div>
      </section>

      {/* VÍDEO */}
      <section className="mk-video mk-sec">
        <span className="mk-label reveal">Em 1 minuto</span>
        <h2 className="reveal" style={d(100)}><span>Chega de pular de planilha em planilha.</span> <strong>Tudo numa tela só.</strong></h2>
        <div className="mk-video-box reveal" style={d(200)}><VideoReal /></div>
      </section>

      {/* A CONTA */}
      <section className="mk-custo mk-sec" id="custo">
        <span className="mk-label reveal">Faça a conta</span>
        <h2 className="reveal" style={d(100)}><span>Quanto o estoque parado</span> <strong>está te custando?</strong></h2>
        <Calculadora />
      </section>

      {/* O QUE VOCÊ RECEBE (painel) */}
      <section className="mk-ws mk-sec" id="painel">
        <div className="mk-ws-txt">
          <span className="mk-label reveal">O que você recebe</span>
          <h2 className="reveal" style={d(100)}><span>Três decisões que</span> <strong>mudam o mês da loja.</strong></h2>
          <p className="reveal" style={d(200)}><b>O que comprar.</b> O ranking mostra o que mais cresce na sua cidade e o que começou a cair, antes de você fechar o pedido.</p>
          <p className="reveal mk-hide-m" style={d(260)}><b>Por quanto vender.</b> A calculadora soma custo, embalagem, frete e a taxa de cada canal e entrega o preço que mantém a sua margem.</p>
          <p className="reveal mk-hide-m" style={d(320)}><b>Onde você está caro.</b> O comparador põe o seu preço ao lado do Mercado Livre e da Shopee.</p>
        </div>

        <div className="mk-mock-stage">
          <div className="mk-mock" ref={mock}>
            <div className="mk-mock-light" />
            <div className="mk-mock-bar">
              <Logo />
              <span className="mk-mock-search"><I n="busca" s={15} /><span>Buscar produto</span></span>
              <span className="mk-mock-tag">Dados de exemplo</span>
            </div>
            <div className="mk-mock-body">
              <aside>
                <h6>Cidades</h6>
                {[['Curitiba', 128], ['Londrina', 74], ['Joinville', 61]].map(([c, n], i) => (
                  <div key={c} className={i === 0 ? 'on' : ''}><I n="pino" s={14} />{c}<em>{n}</em></div>
                ))}
                <h6>Atalhos</h6>
                <div><I n="tendencia" s={14} />Em alta</div><div><I n="calc" s={14} />Calculadora</div><div><I n="comparar" s={14} />Comparador</div>
              </aside>
              <ol className="mk-mock-list">
                {LISTA.map(([n, v], i) => (
                  <li key={n} className={i === 0 ? 'on' : ''} style={{ transitionDelay: `${i * 45 + 250}ms` }}>
                    <span className="mono">{String(i + 1).padStart(2, '0')}</span>{n}<b className={v.startsWith('−') ? 'down' : ''}>{v}</b>
                  </li>
                ))}
              </ol>
              <div className="mk-mock-detail">
                <h5>Óleo de massagem</h5>
                <p className="mk-type" ref={tipo}><span /><span className="ghost">{DESCRICAO}</span><i /></p>
                <dl>
                  <div><dt>Preço ideal</dt><dd>R$ 55,43</dd></div>
                  <div><dt>Mercado Livre</dt><dd>R$ 62,90</dd></div>
                  <div><dt>Shopee</dt><dd>R$ 58,40</dd></div>
                </dl>
                <h6>Últimas semanas</h6>
                <ul className="mk-mock-vers">
                  {[['Semana 4', '+38%'], ['Semana 3', '+21%'], ['Semana 2', '+9%'], ['Semana 1', '+2%']].map(([s, v], i) => (
                    <li key={s} style={{ transitionDelay: `${i * 130 + 700}ms` }}><span>{s}</span><b>{v}</b></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEM × COM */}
      <section className="mk-vs mk-sec">
        <span className="mk-label reveal">A diferença</span>
        <h2 className="reveal" style={d(100)}><span>Sem o LuvyMetrics,</span> <strong>e com ele.</strong></h2>
        <div className="mk-vs-tab reveal" style={d(200)} role="table" aria-label="Comparação sem e com o LuvyMetrics">
          <div className="mk-vs-head" role="row"><span role="columnheader" /><span role="columnheader">Sem</span><span role="columnheader">Com o LuvyMetrics</span></div>
          {ANTES_DEPOIS.map(([a, s, c]) => (
            <div key={a} className="mk-vs-row" role="row">
              <span role="rowheader">{a}</span>
              <span role="cell" className="sem">{s}</span>
              <span role="cell" className="com"><I n="tendencia" s={16} />{c}</span>
            </div>
          ))}
        </div>
      </section>

      {/* O HÁBITO (anti-cancelamento: o valor aparece toda semana) */}
      <section className="mk-how mk-sec" id="como">
        <span className="mk-label reveal">Como funciona</span>
        <h2 className="reveal" style={d(100)}><span>Uma olhada por semana,</span><strong className="grad">antes de cada pedido.</strong></h2>
        <ol className="mk-chev">
          {PASSOS.map(([n, t, x], i) => (
            <li key={n} style={{ transitionDelay: `${i * 150 + 120}ms` }}>
              <span className="mono">{n}</span><h3>{t}</h3><p>{x}</p>
            </li>
          ))}
        </ol>
        <p className="mk-how-foot reveal"><Marca size={22} /> Todo dia o ranking é atualizado. Toda semana tem um motivo novo para abrir.</p>
      </section>

      {/* OFERTA */}
      <section className="mk-stats mk-sec" id="precos">
        <span className="mk-label reveal">A oferta</span>
        <h2 className="reveal" style={d(100)}><span>Teste tudo antes.</span> <strong>Pague só se servir.</strong></h2>
        <div className="mk-stats-grid">
          <div className="mk-stat reveal" data-count="7"><div className="mk-num"><b>0</b><small>dias</small></div><p>de teste com tudo liberado. Sem cartão de crédito.</p></div>
          <div className="mk-stat reveal" style={d(100)} data-count="97"><div className="mk-num"><small>R$</small><b>0</b><small>/mês</small></div><p>no plano Lojista. É <b>R$ 3,23 por dia</b> para comprar e precificar com dados.</p></div>
          <div className="mk-stat mk-stat-txt reveal" style={d(200)}><h3>Anual: 2 meses grátis.</h3><p>R$ 970 por ano, o mesmo que R$ 80,83 por mês. Para quem já decidiu que compra com dados.</p></div>
          <div className="mk-stat mk-stat-txt reveal" style={d(300)}><h3>Sem fidelidade.</h3><p>No mensal, cancele quando quiser. Seus dados ficam só na sua conta.</p></div>
        </div>
        <div className="mk-oferta-cta reveal" style={d(350)}>
          <BtnClaro href={SIGNUP_URL}>Começar meus 7 dias grátis</BtnClaro>
          <span>Sem cartão. Cancele quando quiser.</span>
        </div>
      </section>

      {/* OBJEÇÕES */}
      <section className="mk-faq mk-sec" id="duvidas">
        <span className="mk-label reveal">Dúvidas</span>
        <h2 className="reveal" style={d(100)}><span>Antes de testar,</span> <strong>você deve estar pensando.</strong></h2>
        <div className="mk-faq-list reveal" style={d(200)}>
          {FAQ.map(([p, r]) => (
            <details key={p}><summary>{p}<i aria-hidden /></summary><p>{r}</p></details>
          ))}
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="mk-why mk-sec" ref={why}>
        <div className="mk-why-txt">
          <h2 className="mk-shine reveal"><span data-t="Estoque é">Estoque é</span><span data-t="decisão, não aposta." className="g">decisão, não aposta.</span></h2>
          <p className="reveal" style={d(150)}>Quem compra com dados repõe o que gira, segura o que para e não deixa a taxa do canal levar a margem embora.</p>
          <div className="mk-princ reveal" style={d(250)}>
            <div><I n="pino" /><h4>Da sua cidade</h4><p>Não a média do Brasil.</p></div>
            <div><I n="calc" /><h4>Com todas as taxas</h4><p>Preço que fecha a conta.</p></div>
            <div><I n="cadeado" /><h4>Privado</h4><p>Ninguém vê os números da sua loja.</p></div>
          </div>
        </div>
        <div className="mk-ghost" ref={ghost} aria-hidden><Marca size={520} /></div>
      </section>

      {/* CTA */}
      <section className="mk-cta-wrap mk-sec">
        <div className="mk-cta">
          <div className="reveal"><Logo claro={false} /></div>
          <h2 className="reveal" style={d(100)}>Faça o próximo pedido sabendo o que vende.</h2>
          <p className="reveal" style={d(200)}>7 dias com tudo liberado, sem cartão. Se não fizer sentido para a sua loja, é só não assinar.</p>
          <div className="mk-cta-btns reveal" style={d(300)}>
            <a href={SIGNUP_URL} className="mk-btn-dark">Testar 7 dias grátis <I n="seta" s={16} /></a>
            <a href="#video" className="mk-btn-white" onClick={tocarVideo}>Ver o vídeo de novo</a>
          </div>
          <hr className="reveal" style={d(380)} />
          <small className="reveal" style={d(440)}>Feito para lojistas de sex shop do Brasil.</small>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="mk-foot">
        <div className="mk-foot-top">
          <div className="mk-foot-brand">
            <Logo />
            <p>Inteligência de mercado para sex shops.</p>
            {/* TODO: links reais do Instagram e WhatsApp */}
            <div className="mk-social">
              <a href="#" className="glass" aria-label="Instagram"><I n="insta" s={18} /></a>
              <a href={WHATSAPP} className="glass" aria-label="WhatsApp"><I n="chat" s={18} /></a>
            </div>
          </div>
          <div className="mk-foot-cols">
            <div><h6>Produto</h6><a href="#video">Vídeo</a><a href="#custo">Faça a conta</a><a href="#precos">Preços</a></div>
            <div><h6>Conta</h6><a href="/login">Entrar</a><a href={SIGNUP_URL}>Testar grátis</a></div>
            <div><h6>Ajuda</h6><a href="#duvidas">Dúvidas</a><a href={WHATSAPP}>WhatsApp</a></div>
            {/* TODO: páginas de Termos e Privacidade (LGPD) */}
            <div><h6>Legal</h6><a href="#">Termos de uso</a><a href="#">Privacidade</a></div>
          </div>
        </div>
        <div className="mk-foot-line">© {new Date().getFullYear()} LuvyMetrics</div>
        <div className="mk-foot-giant" aria-hidden>LuvyMetrics</div>
      </footer>
    </div>
  )
}
