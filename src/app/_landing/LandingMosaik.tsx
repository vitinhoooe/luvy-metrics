'use client'

import { useEffect, useRef, useState } from 'react'
import VideoReal from './VideoReal'
import './mosaik.css'

const SIGNUP_URL = '/criar-conta'
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
// as tarefas que o Luvy tira do dia da lojista (o que ela para de fazer, sem prometer horas)
const TAREFAS: [string, string][] = [
  ['Conferir Pix pedido por pedido', 'Com o Mercado Pago, o pedido vira “pago” sozinho. Sem ele, o extrato confirma todos de uma vez.'],
  ['Vender no site o que já acabou no balcão', 'Estoque único: vendeu na loja, some do site na mesma hora.'],
  ['Perder a cliente que chamou às 23h', 'A atendente virtual responde de madrugada, só com o que tem em estoque.'],
  ['Contar no olho o que repor', 'A lista de compras sai pronta, separada por fornecedor.'],
  ['Mandar o status do pedido um por um', 'Um toque avisa a cliente no WhatsApp. Rastreio colado em lote.'],
  ['Fechar o caixa na calculadora', 'O fechamento mostra na hora se sobrou ou faltou.'],
]
// telas reais do app (dados de exemplo)
const TELAS: [string, string, string][] = [
  ['hoje', 'Hoje', 'Quanto vendeu, quanto lucrou e o que precisa de você.'],
  ['vender', 'Balcão', 'Toca no produto, escolhe o Pix, pronto. O estoque baixa na hora.'],
  ['pedidos', 'Pedidos do site', 'Do Pix à entrega, com prazo de cada etapa e aviso para a cliente.'],
  ['repor', 'Estoque inteligente', 'O que comprar e o que pôr em promoção, pela sua venda real.'],
]
const PASSOS = [
  ['01', 'Importe sua planilha', 'Seu estoque entra em minutos. A IA entende suas colunas.'],
  ['02', 'Venda no balcão e no site', 'Um estoque só. Esgotou num lugar, sai de todos.'],
  ['03', 'Veja o lucro de cada venda', 'Preço menos o custo do produto, no dia em que a venda acontece.'],
  ['04', 'Reponha o que gira', 'Alerta de estoque baixo antes de faltar.'],
]

const ANTES_DEPOIS: [string, string, string][] = [
  ['Seu tempo', 'Pulando entre planilha, caderno, calculadora e WhatsApp o dia todo', 'Tudo numa tela só: o Luvy faz a conta e te avisa'],
  ['Receber do site', 'Comprovante no WhatsApp e conferência no banco, um por um', 'Pix ou cartão pelo Mercado Pago, confirmado sozinho e direto na sua conta'],
  ['Vender o que não tem', 'Vende no site o que já saiu no balcão', 'Estoque único: esgotou, sai de todo lugar'],
  ['O preço de venda', 'Copiado do concorrente', 'Calculado com custo, frete, taxa do canal e a sua margem'],
  ['O lucro de verdade', 'Você só descobre no fim do mês, se descobrir', 'Lucro de cada venda, no dia em que ela acontece'],
  ['O seu site', 'Pagar webdesigner ou depender só de marketplace', 'Site pronto, sem comissão, com atendente IA'],
  ['O caixa do dia', 'Conta de cabeça e diferença na gaveta', 'Fechamento que mostra se sobrou ou faltou'],
]

const PLANOS = [
  {
    nome: 'Starter', para: 'Para controlar estoque, caixa e preço da loja.', preco: '97', periodo: '/mês', dia: 'R$ 3,23', nota: 'Cobrado por mês, sem fidelidade.',
    cta: 'Testar o Starter', itens: ['Estoque e catálogo sem limite de produtos', 'Balcão (PDV) e caixa do dia', 'Importação de planilha com IA', 'Calculadora de preço por canal (balcão, maquininha, site e marketplaces)', 'Lucro real de cada venda'],
    sem: 'Sem site próprio e sem atendente IA', destaque: false, selo: '',
  },
  {
    nome: 'Pro', para: 'Para vender no balcão e na internet sem perder o controle.', preco: '197', depois: '297', periodo: '/mês', dia: 'R$ 6,57',
    nota: 'Preço de lançamento garantido por 12 meses. Sem fidelidade.',
    cta: 'Testar o Pro grátis', itens: ['Tudo do Starter', 'Seu site próprio, sem comissão por venda', 'Atendente IA 24h que só oferece o que tem em estoque', 'Pix e cartão pelo Mercado Pago da sua conta, com o pedido confirmado sozinho', 'Estoque inteligente: o que repor e o que pôr em promoção', 'Clientes e fornecedores'],
    sem: '', destaque: true, selo: 'Preço de lançamento',
  },
  {
    nome: 'Business', para: 'Para quem quer tudo pronto, com a gente do lado.', preco: '1.970', periodo: '/ano', dia: 'R$ 5,40', nota: 'Equivale a R$ 164 por mês. 2 meses grátis.',
    cta: 'Quero o anual', itens: ['Tudo do Pro, por 1 ano', 'A gente monta seu site e cadastra seus produtos com você', 'Pagamento único no ano'],
    sem: '', destaque: false, selo: '2 meses grátis',
  },
]

// tudo que o Luvy entrega hoje (só o que já funciona)
const ENTREGAS: { icone: string; t: string; x: string; pronto: boolean }[] = [
  { icone: 'tendencia', t: 'Estoque único', x: 'Um cadastro para balcão e catálogo. Vendeu, baixou na hora. Seu site entra no mesmo estoque.', pronto: true },
  { icone: 'calc', t: 'Lucro real de cada venda', x: 'Preço menos o custo do produto. Você vê o lucro do dia, não só o faturamento.', pronto: true },
  { icone: 'comparar', t: 'Preço certo em cada canal', x: 'A calculadora soma custo, frete, imposto e a taxa do balcão, da maquininha, do site, do Mercado Livre ou da Shopee.', pronto: true },
  { icone: 'busca', t: 'Sua planilha em 2 minutos', x: 'Arraste o Excel. A IA entende as colunas e você confere antes de importar.', pronto: true },
  { icone: 'sino', t: 'Alerta antes de faltar', x: 'Estoque baixo e produto esgotado aparecem assim que acontecem.', pronto: true },
  { icone: 'cadeado', t: 'Caixa que fecha', x: 'Abre com o troco, mostra quanto deve ter na gaveta e se sobrou ou faltou.', pronto: true },
  { icone: 'pino', t: 'Seu site próprio', x: 'Sua loja online com sua cor e seu catálogo, Pix com QR Code e sem comissão por venda.', pronto: true },
  { icone: 'chat', t: 'Atendente IA 24h', x: 'Responde suas clientes de madrugada, só oferece o que tem em estoque e coloca na sacola.', pronto: true },
  { icone: 'sino', t: 'Pix e cartão no seu site', x: 'Conecte o seu Mercado Pago: a cliente paga com Pix ou cartão, o dinheiro cai na sua conta e o pedido vira “pago” sozinho.', pronto: true },
  { icone: 'sino', t: 'Pedidos até a entrega', x: 'Aviso com som a cada pedido, prazos com alerta de atraso e rastreio colado de uma vez.', pronto: true },
  { icone: 'tendencia', t: 'O que repor', x: 'Quanto comprar de cada produto antes de acabar, pela sua venda real. Lista pronta para o fornecedor.', pronto: true },
  { icone: 'calc', t: 'Dinheiro parado vira promoção', x: 'Veja o que está encalhado e coloque em promoção na vitrine com um clique.', pronto: true },
  { icone: 'busca', t: 'Fornecedores do nicho', x: 'Contatos oficiais de distribuidoras e fabricantes, e os seus fornecedores com prazo e pedido mínimo.', pronto: true },

]

const FAQ = [
  ['Vendo mais pela internet. Serve pra mim?', 'Se você vende pelo seu site, pelo WhatsApp ou pelo Instagram, serve desde o primeiro dia: o site próprio do Luvy usa o mesmo estoque do balcão, e o link vai na bio e no status. Se a maior parte das suas vendas vem do Mercado Livre ou de outra plataforma, o Luvy não puxa esses pedidos sozinho: dá para importar por planilha.'],
  ['Como recebo o dinheiro das vendas do site?', 'Direto na sua conta. Conectando o seu Mercado Pago, a cliente paga com Pix ou cartão e o pedido vira “pago” sozinho. Ou pela sua chave Pix, conferida pelo extrato. O LuvyMetrics não segura o seu dinheiro e não cobra taxa por venda. As taxas do Mercado Pago são as do seu contrato com eles.'],
  ['Vocês fazem o site da minha loja?', 'Sim. No Pro, sua loja online fica pronta usando o mesmo estoque do painel, com a sua cor, Pix com QR Code e sem comissão por venda. No Business, a gente monta com você e cadastra seus produtos.'],
  ['Como funciona a atendente IA?', 'Ela conversa com suas clientes na vitrine, 24 horas. Só fala dos produtos que você tem em estoque, ajuda a escolher, coloca na sacola e passa para você no WhatsApp quando é troca, reclamação ou pedido já feito. Ela se apresenta como atendente virtual, nunca como pessoa.'],
  ['Quanto vou vender a mais?', 'Depende da sua loja, e a gente não promete número. O que entregamos é controle: você vai saber todo dia o que vendeu, quanto lucrou, o que está acabando e o que está parado.'],
  ['Não manjo de tecnologia. Vou conseguir usar?', 'Se você usa o WhatsApp, usa o LuvyMetrics. Arraste sua planilha e o estoque entra sozinho. Vender no balcão é tocar no produto e finalizar.'],
  ['Quanto tempo leva para começar?', 'Se você já tem planilha de estoque, dá para começar no mesmo dia: arraste o arquivo, confira as colunas e pronto. Dá também para importar as vendas antigas, para o “O que repor” funcionar desde o primeiro dia.'],
  ['Já uso planilha. Qual a diferença?', 'A planilha não baixa o estoque quando você vende, não calcula a taxa de cada canal e não avisa quando algo está acabando. O LuvyMetrics faz tudo isso, e você importa a sua planilha no primeiro dia.'],
  ['Por que o Pro está R$ 197?', 'É o preço de lançamento para quem entra agora. Quem assina no lançamento paga R$ 197 por 12 meses, mesmo que o preço suba depois para R$ 297.'],
  ['Preciso de cartão para testar?', 'Não. São 7 dias com tudo liberado. Se não fizer sentido para a sua loja, é só não assinar.'],
  ['E se eu quiser cancelar?', 'No Starter e no Pro não tem fidelidade: você cancela quando quiser e baixa seus produtos, vendas e clientes em planilha. O Business é anual: paga uma vez e usa o ano inteiro, com 2 meses grátis.'],
]

const brlCalc = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** A conta do tempo, feita com os números da própria lojista (não é promessa do Luvy). */
function CalcTempo() {
  const [planilha, setPlanilha] = useState(40)
  const [pix, setPix] = useState(30)
  const [duvidas, setDuvidas] = useState(30)
  const [hora, setHora] = useState(25)
  const horasMes = ((planilha + pix + duvidas) * 30) / 60
  const controle = (rotulo: string, v: number, set: (n: number) => void) => (
    <label>
      <span>{rotulo}</span>
      <b>{v} min por dia</b>
      <input type="range" min={0} max={180} step={5} value={v} onChange={e => set(Number(e.target.value))} aria-label={rotulo} />
    </label>
  )
  return (
    <div className="mk-calc reveal">
      <div className="mk-calc-in">
        {controle('Atualizando planilha, estoque e caderno', planilha, setPlanilha)}
        {controle('Conferindo Pix e status de pedido', pix, setPix)}
        {controle('Respondendo dúvida de produto no direct e no WhatsApp', duvidas, setDuvidas)}
        <label>
          <span>Quanto vale 1 hora do seu trabalho?</span>
          <b>R$ {hora}</b>
          <input type="range" min={10} max={200} step={5} value={hora} onChange={e => setHora(Number(e.target.value))} aria-label="Valor da sua hora" />
        </label>
      </div>
      <div className="mk-calc-out">
        <p className="mk-calc-n"><strong>{horasMes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h</strong> por mês</p>
        <p>É o tempo que essas tarefas te tomam hoje. No valor da sua hora, são <b>R$ {Math.round(horasMes * hora).toLocaleString('pt-BR')}</b> por mês fazendo controle em vez de vender.</p>
        <p className="mk-calc-cmp">O Pro custa <b>R$ 6,57 por dia</b>. É esse tempo que o LuvyMetrics foi feito para devolver. Os números acima são os seus: mexa nos controles.</p>
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
  const why = useRef<HTMLElement>(null)
  const ghost = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const html = document.documentElement
    html.classList.add('mk-page')
    const reduz = semMovimento()

    // reveal: um observer para a página toda
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return
      e.target.classList.add('in')
      io.unobserve(e.target)
      if (e.target.hasAttribute('data-count')) contar(e.target as HTMLElement)
    }), { threshold: 0, rootMargin: '0px 0px -10% 0px' })
    raiz.current!.querySelectorAll('.reveal, [data-count]').forEach(el => io.observe(el))
    // rede de segurança para scroll muito rápido
    let rede = 0
    const onScrollRede = () => {
      clearTimeout(rede)
      rede = window.setTimeout(() => {
        raiz.current?.querySelectorAll('.reveal:not(.in)').forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('in'); io.unobserve(el)
            if (el.hasAttribute('data-count')) contar(el as HTMLElement)
          }
        })
      }, 180)
    }
    window.addEventListener('scroll', onScrollRede, { passive: true })

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
    let topoWhy = 0, altWhy = 0
    const medir = () => {
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
      raiz.current!.querySelectorAll<HTMLElement>('.mk-stat').forEach(el => liga(el, false))
    }

    requestAnimationFrame(() => html.classList.add('mk-ready'))
    return () => {
      html.classList.remove('mk-page', 'mk-ready')
      io.disconnect(); cancelAnimationFrame(raf)
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
            <a href="#video">Vídeo</a><a href="#tempo">Seu tempo</a><a href="#precos">Preços</a>
          </div>
          <BtnClaro href={SIGNUP_URL}>Testar grátis</BtnClaro>
        </nav>

        <div className="mk-hero-copy">
          <p className="mk-hero-tag reveal" style={d(0)}>Para lojas de bem-estar íntimo que vendem no balcão e na internet</p>
          <h1 className="reveal" style={d(60)}>
            <span>Menos tempo na planilha.</span>
            <strong>Mais tempo vendendo.</strong>
          </h1>
          <p className="mk-hero-sub reveal" style={d(150)}>
            Seu site próprio vende 24 horas com a atendente virtual. O Pix e o cartão caem direto na sua conta pelo Mercado Pago, e o pedido vira “pago” sozinho. Vendeu no balcão, some do site na hora. Sem comissão por venda.
          </p>
          <div className="mk-hero-btns reveal" style={d(250)}>
            <BtnClaro href={SIGNUP_URL}>Testar 7 dias grátis</BtnClaro>
            <a href="#video" className="mk-btn-glass glass mk-btn-video" onClick={tocarVideo}><i aria-hidden>▶</i> Ver por dentro</a>
          </div>
        </div>

        <div className="mk-stage" ref={metal} aria-hidden><MarcaMetal /></div>

        <a href="#video" className="mk-scroll" onClick={tocarVideo}>Assista ao vídeo</a>
        <p className="mk-hero-note reveal" style={d(350)}>
          <b>Sem cartão de crédito.</b> Você testa tudo por 7 dias e só assina se <u>fizer sentido para a sua loja</u>.
        </p>
      </section>

      {/* VÍDEO */}
      <section className="mk-video mk-sec">
        <span className="mk-label reveal">Por dentro</span>
        <h2 className="reveal" style={d(100)}><span>Telas reais do app.</span> <strong>Em 44 segundos.</strong></h2>
        <div className="mk-video-box reveal" style={d(200)}><VideoReal /></div>
      </section>

      {/* SEU TEMPO */}
      <section className="mk-custo mk-sec" id="tempo">
        <span className="mk-label reveal">O seu tempo</span>
        <h2 className="reveal" style={d(100)}><span>As tarefas que</span> <strong>somem do seu dia.</strong></h2>
        <div className="mk-tarefas">
          {TAREFAS.map(([antes, depois], i) => (
            <article key={antes} className="mk-tarefa glass reveal" style={d(60 + (i % 3) * 80)}>
              <s>{antes}</s>
              <p><I n="tendencia" s={16} />{depois}</p>
            </article>
          ))}
        </div>
        <h3 className="mk-tempo-pergunta reveal">Quanto tempo isso te toma hoje? Faça a conta.</h3>
        <CalcTempo />
      </section>

      {/* TUDO QUE VEM NO LUVY */}
      <section className="mk-tudo mk-sec" id="tudo">
        <span className="mk-label reveal">O que vem no LuvyMetrics</span>
        <h2 className="reveal" style={d(100)}><span>Sua loja inteira,</span> <strong>num controle só.</strong></h2>
        <div className="mk-tudo-grade">
          {ENTREGAS.map((e, i) => (
            <article key={e.t} className="mk-tudo-item glass reveal" style={d(80 + (i % 3) * 80)}>
              <span className="mk-tudo-ico"><I n={e.icone} s={18} /></span>
              <h3>{e.t}{!e.pronto && <em>em breve</em>}</h3>
              <p>{e.x}</p>
            </article>
          ))}
        </div>
      </section>

      {/* TELAS REAIS */}
      <section className="mk-telas mk-sec" id="painel">
        <span className="mk-label reveal">Telas reais</span>
        <h2 className="reveal" style={d(100)}><span>O que você vê</span> <strong>quando abre o Luvy.</strong></h2>
        <div className="mk-telas-grade">
          {TELAS.map(([img, t, x], i) => (
            <figure key={img} className="mk-tela reveal" style={d(80 + (i % 2) * 120)}>
              <div className="mk-tela-img"><img src={`/landing/${img}.webp`} alt={`Tela ${t} do LuvyMetrics, com dados de exemplo`} loading="lazy" width={1440} height={900} /></div>
              <figcaption><b>{t}</b>{x}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mk-telas-nota reveal">Telas do app com dados de exemplo.</p>
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
        <h2 className="reveal" style={d(100)}><span>Do primeiro dia</span><strong className="grad">ao fechamento do mês.</strong></h2>
        <ol className="mk-chev">
          {PASSOS.map(([n, t, x], i) => (
            <li key={n} style={{ transitionDelay: `${i * 150 + 120}ms` }}>
              <span className="mono">{n}</span><h3>{t}</h3><p>{x}</p>
            </li>
          ))}
        </ol>
        <p className="mk-how-foot reveal"><Marca size={22} /> Cada venda atualiza o estoque e o lucro na hora. Todo dia tem um motivo para abrir.</p>
      </section>

      {/* OFERTA */}
      <section className="mk-stats mk-sec" id="precos">
        <span className="mk-label reveal">A oferta</span>
        <h2 className="reveal" style={d(100)}><span>Escolha o plano.</span> <strong>Teste 7 dias antes de pagar.</strong></h2>
        <div className="mk-dia reveal" style={d(150)}>
          <strong className="grad">R$ 6,57 por dia.</strong>
          <p>É o que custa o Pro para largar a planilha, o caderno e a conferência de Pix um por um. <b>Balcão, site próprio, Pix e cartão pelo Mercado Pago, estoque inteligente, clientes, fornecedores e atendente IA</b> num lugar só.</p>
          <p className="mk-dia-conta">Faça a conta: se ele salvar <b>2 vendas no mês</b> que você perderia por demora para responder ou por estoque errado, o Pro já se pagou. O resultado depende da sua loja.</p>
        </div>
        <div className="mk-planos">
          {PLANOS.map((p, i) => (
            <article key={p.nome} className={`mk-plano reveal ${p.destaque ? 'destaque' : ''}`} style={d(i * 100)}>
              <div className="mk-plano-topo">
                <h3>{p.nome}</h3>
                {p.selo && <span className="mk-plano-selo">{p.selo}</span>}
              </div>
              <p className="mk-plano-para">{p.para}</p>
              {'depois' in p && p.depois && <p className="mk-plano-de">Preço de lançamento · depois R$ {p.depois}</p>}
              <div className="mk-plano-preco"><small>R$</small><b>{p.preco}</b><small>{p.periodo}</small></div>
              <p className="mk-plano-dia">Dá <b>{p.dia} por dia</b></p>
              <p className="mk-plano-nota">{p.nota}</p>
              <a className={p.destaque ? 'mk-btn-light mk-plano-cta' : 'mk-btn-glass glass mk-plano-cta'} href={SIGNUP_URL}>
                <span>{p.cta}</span>{p.destaque && <i><I n="seta" s={16} /></i>}
              </a>
              <ul>
                {p.itens.map(it => <li key={it}><I n="tendencia" s={15} />{it.replace(/^~/, '')}{it.startsWith('~') && <em className="mk-breve">em breve</em>}</li>)}
                {p.sem && <li className="sem">{p.sem}</li>}
              </ul>
            </article>
          ))}
        </div>
        <div className="mk-oferta-cta reveal" style={d(350)}>
          <BtnClaro href={SIGNUP_URL}>Começar meus 7 dias grátis</BtnClaro>
          <span>7 dias grátis em qualquer plano. Sem cartão. Sem fidelidade no mensal.</span>
          <p className="mk-lancamento">
            <b>Preço de lançamento do Pro: R$ 197 por mês, garantido por 12 meses.</b> Depois do lançamento, o Pro passa a custar R$ 297 para quem assinar. Quem entrar agora continua pagando R$ 197 até completar 12 meses.
          </p>
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
          <h2 className="mk-shine reveal"><span data-t="Venda em todo lugar.">Venda em todo lugar.</span><span data-t="Controle num só." className="g">Controle num só.</span></h2>
          <p className="reveal" style={d(150)}>Quem vende no balcão, no site e no WhatsApp não tem tempo a perder com planilha. Precisa de um estoque só, do Pix conferido e do lucro de verdade no fim do dia.</p>
          <div className="mk-princ reveal" style={d(250)}>
            <div><I n="pino" /><h4>Todos os canais</h4><p>Balcão, site, WhatsApp e Instagram.</p></div>
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
          <h2 className="reveal" style={d(100)}>Seu tempo de volta para vender.</h2>
          <p className="reveal" style={d(200)}>7 dias com tudo liberado, sem cartão. Se não fizer sentido para a sua loja, é só não assinar.</p>
          <div className="mk-cta-btns reveal" style={d(300)}>
            <a href={SIGNUP_URL} className="mk-btn-dark">Testar 7 dias grátis <I n="seta" s={16} /></a>
            <a href="#video" className="mk-btn-white" onClick={tocarVideo}>Ver o vídeo de novo</a>
          </div>
          <hr className="reveal" style={d(380)} />
          <small className="reveal" style={d(440)}>Feito para lojistas de bem-estar íntimo do Brasil.</small>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="mk-foot">
        <div className="mk-foot-top">
          <div className="mk-foot-brand">
            <Logo />
            <p>Loja online e controle de estoque para bem-estar íntimo.</p>
            {/* TODO: links reais do Instagram e WhatsApp */}
            <div className="mk-social">
              <a href="#" className="glass" aria-label="Instagram"><I n="insta" s={18} /></a>
              <a href={WHATSAPP} className="glass" aria-label="WhatsApp"><I n="chat" s={18} /></a>
            </div>
          </div>
          <div className="mk-foot-cols">
            <div><h6>Produto</h6><a href="#video">Vídeo</a><a href="#tudo">O que vem</a><a href="#tempo">Seu tempo</a><a href="#precos">Preços</a></div>
            <div><h6>Conta</h6><a href="/entrar">Entrar</a><a href={SIGNUP_URL}>Testar grátis</a></div>
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
