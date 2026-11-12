'use client'

/*
 * Versão D — "Norte" (estrutura e regras do modelo Norte, adaptadas ao LuvyMetrics).
 * Uma noite só, do topo ao rodapé. A palavra "Vendas" gigante atrás de um globo grafite com
 * doze cidades acesas. O scroll dirige só imagem (o globo e o ponto que voa até a busca);
 * o texto entra por tempo, uma vez. Nada prende a página. Lenis só na roda do mouse.
 * Sem texturas externas: os continentes são pontos gerados a partir de contornos aproximados.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Lenis from 'lenis'
import './norte.css'

const CTA = '/login'

/* ---------- dados ---------- */

type Cidade = { nome: string; uf: string; lat: number; lon: number }
const CIDADES: Cidade[] = [
  { nome: 'Manaus', uf: 'AM', lat: -3.1, lon: -60.0 },
  { nome: 'Porto Alegre', uf: 'RS', lat: -30.03, lon: -51.2 },
  { nome: 'Curitiba', uf: 'PR', lat: -25.43, lon: -49.27 },
  { nome: 'Belém', uf: 'PA', lat: -1.45, lon: -48.5 },
  { nome: 'Florianópolis', uf: 'SC', lat: -27.6, lon: -48.55 },
  { nome: 'Brasília', uf: 'DF', lat: -15.8, lon: -47.9 },
  { nome: 'São Paulo', uf: 'SP', lat: -23.55, lon: -46.63 },
  { nome: 'Belo Horizonte', uf: 'MG', lat: -19.92, lon: -43.94 },
  { nome: 'Rio de Janeiro', uf: 'RJ', lat: -22.9, lon: -43.2 },
  { nome: 'Fortaleza', uf: 'CE', lat: -3.73, lon: -38.52 },
  { nome: 'Salvador', uf: 'BA', lat: -12.97, lon: -38.5 },
  { nome: 'Recife', uf: 'PE', lat: -8.05, lon: -34.9 },
] // já de oeste para leste
const IDX_VOO = 2 // Curitiba: o ponto que se solta e pousa na busca
const IDX_SOBE = 6, IDX_CAI = 1 // São Paulo acende forte, Porto Alegre apaga (cena "Um sobe, outro cai")

const UF: Record<string, string> = Object.fromEntries(CIDADES.map(c => [normaliza(c.nome), c.uf]))
Object.assign(UF, { campinas: 'SP', santos: 'SP', londrina: 'PR', maringa: 'PR', joinville: 'SC', blumenau: 'SC', goiania: 'GO', natal: 'RN', 'joao pessoa': 'PB', maceio: 'AL', aracaju: 'SE', teresina: 'PI', 'sao luis': 'MA', cuiaba: 'MT', 'campo grande': 'MS', vitoria: 'ES', niteroi: 'RJ', uberlandia: 'MG', 'ribeirao preto': 'SP', sorocaba: 'SP' })

function normaliza(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const AMERICA_SUL: [number, number][] = [[12.4,-71.7],[11,-74],[9,-77.4],[7,-77.8],[4,-77.4],[1,-79],[-2.5,-80.8],[-5,-81.2],[-8,-79.5],[-12,-77.2],[-15,-75.5],[-18,-70.5],[-23,-70.5],[-28,-71.2],[-33,-71.7],[-38,-73.5],[-42,-74],[-46,-75.5],[-50,-75.3],[-53,-74],[-55,-69],[-54,-66],[-51,-69],[-48,-66],[-45,-65.5],[-42,-63.5],[-40,-62],[-38.5,-57.5],[-36,-56.7],[-34.5,-58.5],[-34,-53.5],[-31,-50.5],[-28.5,-48.6],[-25.5,-48.4],[-23,-43],[-22,-41],[-18,-39.2],[-13,-38.5],[-10,-36],[-7.5,-34.8],[-5,-35.3],[-3,-40],[-2.5,-44],[-1,-48],[0.5,-50],[4,-51.5],[5.8,-55],[6.5,-58],[8.5,-60.5],[10.5,-62],[10.6,-66],[11.5,-70]]
const AFRICA: [number, number][] = [[35.8,-5.9],[37,10],[33,11],[32.5,20],[31.5,32],[22,36.8],[12,43.5],[11.5,51],[2,45.5],[-4,39.7],[-11,40.5],[-16,40],[-25,35.5],[-34.5,26],[-34.8,20],[-30,17],[-22,14],[-17,11.8],[-12,13.7],[-6,12],[-1,9],[4.5,8.5],[4.4,1],[5,-4],[4.5,-7.5],[7.5,-12.5],[10,-15],[14.7,-17.5],[21,-17],[27,-13.5],[31.5,-9.8]]
const AMERICA_CENTRAL: [number, number][] = [[18.5,-103],[20,-105.5],[23,-106.5],[28,-112],[31.5,-114.8],[32.5,-117],[29,-109],[24,-97.7],[21.5,-97.3],[19,-96],[18.5,-91],[21.3,-90],[21.5,-87],[16,-88.5],[15.8,-84],[11,-83.7],[9,-79],[8,-77.5],[7.2,-80.5],[9.5,-85.5],[13,-87.5],[15.8,-93.5]]

function dentro(lat: number, lon: number, poli: [number, number][]) {
  let c = false
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [yi, xi] = poli[i], [yj, xj] = poli[j]
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
const xyz = (lat: number, lon: number, r = 1) => {
  const f = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180
  return new THREE.Vector3(r * Math.cos(f) * Math.sin(l), r * Math.sin(f), r * Math.cos(f) * Math.cos(l))
}

/* ---------- curvas ---------- */
const suave = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const amortecer = (atual: number, alvo: number, k: number, dt: number) => lerp(atual, alvo, 1 - Math.exp(-k * dt))
const semMov = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const celular = () => typeof window !== 'undefined' && window.innerWidth <= 760

/* ---------- prévia fictícia e determinística da busca ---------- */
const CATEGORIAS = ['Óleos e géis', 'Kits presente', 'Lingerie', 'Velas e aromas']
function hash(s: string) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return Math.abs(h) }
function previa(cidade: string) {
  return CATEGORIAS.map((c, i) => {
    const v = (hash(normaliza(cidade) + c) % 61) - 18 // −18% a +42%
    return { c, v, estado: v > 8 ? 'Em alta' : v < -5 ? 'Caindo' : 'Estável', i }
  })
}

/* ---------- componentes pequenos ---------- */
function Linhas({ linhas, className = '', tag: Tag = 'h2' }: { linhas: string[]; className?: string; tag?: 'h1' | 'h2' | 'p' }) {
  return <Tag className={className} data-revela="">{linhas.map((l, i) => <span key={i} className="linha"><span style={{ '--i': i } as React.CSSProperties}>{l}</span></span>)}</Tag>
}
function Seta() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h13M13 6l6 6-6 6" /></svg>
}
function BotaoSeta({ href, rotulo, type }: { href?: string; rotulo: string; type?: 'submit' }) {
  const conteudo = <span className="seta-troca"><span><Seta /></span><span><Seta /></span></span>
  return href
    ? <a className="botao-seta" href={href} aria-label={rotulo}>{conteudo}</a>
    : <button className="botao-seta" type={type ?? 'button'} aria-label={rotulo}>{conteudo}</button>
}
function Botao({ href, children }: { href: string; children: string }) {
  return <a className="botao" href={href}><span className="rola" data-texto={children}><span>{children}</span></span></a>
}

/* ---------- página ---------- */

export default function LandingNorte() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const voo = useRef<HTMLSpanElement>(null)
  const hero = useRef<HTMLElement>(null)
  const palavra = useRef<HTMLParagraphElement>(null)
  const regioes = useRef<HTMLElement>(null)
  const dominio = useRef<HTMLElement>(null)
  const pontoBusca = useRef<HTMLSpanElement>(null)
  const nav = useRef<HTMLElement>(null)
  const espelho = useRef<HTMLSpanElement>(null)
  const campo = useRef<HTMLInputElement>(null)

  const [cidade, setCidade] = useState('')
  const [buscada, setBuscada] = useState<string | null>(null)
  const [procurando, setProcurando] = useState(false)
  const [erro, setErro] = useState('')
  const [treme, setTreme] = useState(0)
  const [pousou, setPousou] = useState(false)
  const [plano, setPlano] = useState(1)
  const [anual, setAnual] = useState(false)
  const [rodada, setRodada] = useState(0)
  const [menu, setMenu] = useState(false)

  const nomeCidade = buscada ?? 'Curitiba'
  const uf = UF[normaliza(nomeCidade)] ?? 'UF'
  const PLANOS = [
    { nome: 'Teste', spec: '7 dias · tudo liberado · sem cartão', mensal: '0', anualV: '0' },
    { nome: 'Lojista', spec: 'ranking · preço ideal · comparador · estoque', mensal: '97', anualV: '80,83' },
    { nome: 'Rede', spec: 'várias lojas e cidades · atendimento direto', mensal: null, anualV: null },
  ]
  const p = PLANOS[plano]
  const precoTxt = p.mensal === null ? 'sob consulta' : (anual ? p.anualV : p.mensal) === '0' ? 'grátis por 7 dias' : `R$ ${anual ? p.anualV : p.mensal} por mês${anual ? ', pago por ano' : ''}`

  /* busca */
  const buscar = (e: React.FormEvent) => {
    e.preventDefault()
    const v = cidade.trim()
    if (!v) { setErro('Digite o nome da sua cidade.'); setTreme(t => t + 1); return }
    if (/[^a-zA-ZÀ-ÿ\s'-]/.test(v)) { setErro('Use só letras: o nome da cidade, sem números.'); setTreme(t => t + 1); return }
    setErro(''); setProcurando(true); setBuscada(v.replace(/\s+/g, ' '))
    setTimeout(() => setProcurando(false), 900)
  }

  /* o mundo: globo, coreografia, voo, arrasto, revelar, nav */
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('nt-page')
    const reduz = semMov()
    const cv = canvas.current!

    // Lenis só na roda do mouse; um requestAnimationFrame para tudo
    const lenis = !reduz && window.matchMedia('(hover: hover) and (pointer: fine)').matches
      ? new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, anchors: true })
      : null
    if (lenis) html.classList.add('lenis')

    // revelar: texto entra por tempo, uma vez
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return
      e.target.classList.add('is-visivel'); io.unobserve(e.target)
      e.target.dispatchEvent(new CustomEvent('revelou'))
      if ((e.target as HTMLElement).dataset.numero !== undefined) desfoca(e.target as HTMLElement)
    }), { rootMargin: '0px 0px -14% 0px' })
    document.querySelectorAll('[data-revela], [data-numero]').forEach(el => io.observe(el))

    // números entram com desfoque só na horizontal (filtro SVG por número)
    function desfoca(el: HTMLElement) {
      const blur = document.getElementById(el.dataset.filtro!)?.querySelector('feGaussianBlur')
      if (!blur || reduz) { el.classList.add('assentou'); return }
      const t0 = performance.now()
      const passo = (t: number) => {
        const k = clamp((t - t0) / 1150), e = 1 - Math.pow(1 - k, 3)
        blur.setAttribute('stdDeviation', `${(70 * (1 - e)).toFixed(2)} 0`)
        el.style.setProperty('--desloca', `${(5 * (1 - e)).toFixed(2)}%`)
        el.style.setProperty('--opa', `${clamp(k * 3)}`)
        if (k < 1) requestAnimationFrame(passo); else el.classList.add('assentou')
      }
      requestAnimationFrame(passo)
    }

    // ajusta as palavras gigantes à largura
    const ajusta = () => {
      document.querySelectorAll<HTMLElement>('[data-palavra]').forEach(el => {
        el.style.fontSize = '100px'
        const rg = document.createRange(); rg.selectNodeContents(el)
        const w = rg.getBoundingClientRect().width
        const alvo = (el.classList.contains('hero__palavra') ? window.innerWidth : el.parentElement!.clientWidth) * (1 - 0.014)
        let tam = (100 * alvo) / Math.max(1, w)
        const teto = el.dataset.teto ? (parseFloat(el.dataset.teto) * window.innerHeight) : Infinity
        tam = Math.min(tam, teto)
        el.style.fontSize = `${tam.toFixed(1)}px`
      })
    }

    /* ---- globo (Three.js, câmera ortográfica em pixels de CSS) ---- */
    const leve = celular() || (navigator.hardwareConcurrency || 8) <= 4
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true })
    renderer.setClearColor(0, 0)
    const cena = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000)
    const grupo = new THREE.Group()
    cena.add(grupo)

    const esfera = new THREE.Mesh(
      new THREE.SphereGeometry(1, leve ? 64 : 112, leve ? 48 : 80),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vN;
          void main(){
            vec3 n = normalize(vN);
            float luz = clamp(dot(n, normalize(vec3(-0.45, 0.6, 0.65))), 0.0, 1.0);
            float borda = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.4);
            vec3 base = mix(vec3(0.075,0.068,0.062), vec3(0.2,0.185,0.17), luz);
            base += vec3(0.95,0.62,0.33) * borda * 0.16;
            gl_FragColor = vec4(base, 1.0);
          }`,
      }),
    )
    grupo.add(esfera)

    // continentes em pontos (grade de lat/lon dentro dos contornos)
    const terra: number[] = []
    const passoGrau = leve ? 1.25 : 0.85
    for (let lat = -58; lat <= 38; lat += passoGrau) {
      const passoLon = passoGrau / Math.max(0.25, Math.cos((lat * Math.PI) / 180))
      for (let lon = -120; lon <= 55; lon += passoLon) {
        if (dentro(lat, lon, AMERICA_SUL) || dentro(lat, lon, AFRICA) || dentro(lat, lon, AMERICA_CENTRAL)) {
          const v = xyz(lat, lon, 1.004); terra.push(v.x, v.y, v.z)
        }
      }
    }
    const geoTerra = new THREE.BufferGeometry()
    geoTerra.setAttribute('position', new THREE.Float32BufferAttribute(terra, 3))
    const matTerra = new THREE.ShaderMaterial({
      uniforms: { uTam: { value: 2 } },
      vertexShader: `uniform float uTam; varying float vZ; void main(){ vec4 p = modelViewMatrix * vec4(position,1.0); vZ = normalize(mat3(modelViewMatrix) * position).z; gl_Position = projectionMatrix * p; gl_PointSize = uTam; }`,
      fragmentShader: `varying float vZ; void main(){ vec2 c = gl_PointCoord - .5; if (dot(c,c) > .25) discard; float a = smoothstep(-0.05, 0.35, vZ); gl_FragColor = vec4(vec3(0.62,0.58,0.53) * (0.35 + 0.65*a), 1.0); }`,
    })
    grupo.add(new THREE.Points(geoTerra, matTerra))

    // doze cidades acesas
    const posCid = new Float32Array(CIDADES.length * 3)
    CIDADES.forEach((c, i) => { const v = xyz(c.lat, c.lon, 1.012); posCid.set([v.x, v.y, v.z], i * 3) })
    const luzCid = new Float32Array(CIDADES.length)
    const geoCid = new THREE.BufferGeometry()
    geoCid.setAttribute('position', new THREE.BufferAttribute(posCid, 3))
    geoCid.setAttribute('aLuz', new THREE.BufferAttribute(luzCid, 1).setUsage(THREE.DynamicDrawUsage))
    const matCid = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTam: { value: 26 } },
      vertexShader: `attribute float aLuz; uniform float uTam; varying float vL; varying float vZ;
        void main(){ vec4 p = modelViewMatrix * vec4(position,1.0); vL = aLuz; vZ = normalize(mat3(modelViewMatrix) * position).z; gl_Position = projectionMatrix * p; gl_PointSize = uTam * (0.6 + 0.6*aLuz); }`,
      fragmentShader: `varying float vL; varying float vZ;
        void main(){ float d = length(gl_PointCoord - .5) * 2.0; float nucleo = smoothstep(0.24, 0.12, d); float halo = exp(-d*d*5.0) * 0.55;
          float frente = smoothstep(0.0, 0.25, vZ); vec3 cor = vec3(0.95,0.65,0.35);
          gl_FragColor = vec4(cor * (nucleo + halo) * vL * frente, 1.0); }`,
    })
    grupo.add(new THREE.Points(geoCid, matCid))

    /* ---- medidas da página (só na montagem e no resize) ---- */
    let W = 0, H = 0
    const L = { heroTopo: 0, heroD: 0, regTopo: 0, regFim: 0, domTopo: 0, alvoX: 0, alvoY: 0 }
    const medir = () => {
      W = window.innerWidth; H = window.innerHeight
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(W, H, false)
      cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2; cam.updateProjectionMatrix()
      matTerra.uniforms.uTam.value = (leve ? 2.2 : 2.4) * Math.min(window.devicePixelRatio || 1, 2) * (W < 760 ? 0.9 : 1)
      matCid.uniforms.uTam.value = 30 * Math.min(window.devicePixelRatio || 1, 2) * (W < 760 ? 0.8 : 1)
      ajusta()
      const sy = window.scrollY
      const pr = palavra.current!.getBoundingClientRect()
      const d = celular() ? W * 1.5 : Math.min(W * 0.515, H * 0.88)
      L.heroD = d
      L.heroTopo = pr.top + sy + pr.height * (celular() ? 0.7 : 0.71)
      hero.current!.style.setProperty('--globo-topo', `${L.heroTopo}px`)
      hero.current!.style.setProperty('--base', `${pr.bottom + sy - (hero.current!.getBoundingClientRect().top + sy)}px`)
      hero.current!.style.setProperty('--globo-d', `${d}px`)
      const rr = regioes.current!.getBoundingClientRect()
      L.regTopo = rr.top + sy; L.regFim = rr.bottom + sy
      const dGlobo = celular() ? Math.min(W * 0.92, H * 0.5) : Math.min(H * 0.74, (W - 2 * 72) * 0.45)
      regioes.current!.style.setProperty('--globo-regioes', `${dGlobo}px`)
      const dr = dominio.current!.getBoundingClientRect()
      L.domTopo = dr.top + sy
      const pb = pontoBusca.current!.getBoundingClientRect()
      L.alvoX = pb.left + pb.width / 2 + pb.width * 0.017; L.alvoY = pb.top + sy + pb.height * 0.62
    }

    /* ---- coreografia: quadros-chave por posição de rolagem ---- */
    type Q = { y: number; cx: number; cy: number; d: number; lat: number; lon: number }
    const quadros = (): Q[] => {
      const cel = celular()
      const dReg = parseFloat(regioes.current!.style.getPropertyValue('--globo-regioes')) || H * 0.6
      const heroCy = L.heroTopo + L.heroD / 2
      return [
        { y: 0, cx: W / 2, cy: heroCy, d: L.heroD, lat: -16, lon: -52 },
        { y: L.regTopo - H * 0.15, cx: W / 2, cy: cel ? H * 0.33 + (L.regTopo - H * 0.15) : H / 2 + (L.regTopo - H * 0.15), d: dReg, lat: -14, lon: -62 },
        { y: L.regFim - H * 1.05, cx: W / 2, cy: (cel ? H * 0.33 : H / 2) + (L.regFim - H * 1.05), d: dReg, lat: -18, lon: -38 },
        { y: L.regFim - H * 0.25, cx: W / 2, cy: (L.regFim - H * 0.25) - dReg * 0.75, d: dReg * 0.9, lat: -20, lon: -30 },
      ]
    }
    let Qs: Q[] = []
    const estado = { cx: 0, cy: 0, d: 0, lat: -16, lon: -52, iniciado: false }
    const alvoEm = (y: number) => {
      const qs = Qs
      if (y <= qs[0].y) return qs[0]
      for (let i = 0; i < qs.length - 1; i++) {
        const a = qs[i], b = qs[i + 1]
        if (y <= b.y) {
          const t = suave(clamp((y - a.y) / Math.max(1, b.y - a.y)))
          // cy está em coordenadas da página; o globo sobe mais devagar que a página entre os quadros
          return { y, cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), d: lerp(a.d, b.d, t), lat: lerp(a.lat, b.lat, t), lon: lerp(a.lon, b.lon, t) }
        }
      }
      const u = qs[qs.length - 1]
      return { ...u, cy: u.cy - (y - u.y) * 0.4 }
    }

    // arrasto (só no hero): gira com a mão, com inércia; no toque só para os lados
    const giro = { lon: 0, lat: 0, vLon: 0, vLat: 0, arrastando: false, x: 0, y: 0, t: 0 }
    const dentroGlobo = (x: number, y: number) => Math.hypot(x - estado.cx, y - (estado.cy - window.scrollY)) < estado.d / 2
    const onDown = (e: PointerEvent) => {
      if (reduz || window.scrollY > H * 0.6) return
      if ((e.target as HTMLElement).closest('a, button, input')) return
      if (!dentroGlobo(e.clientX, e.clientY)) return
      giro.arrastando = true; giro.x = e.clientX; giro.y = e.clientY; giro.t = performance.now(); giro.vLon = giro.vLat = 0
      html.classList.add('is-arrastando')
    }
    const onMove = (e: PointerEvent) => {
      html.classList.remove('is-scrolling')
      if (!giro.arrastando) {
        html.classList.toggle('sobre-globo', !reduz && window.scrollY < H * 0.6 && dentroGlobo(e.clientX, e.clientY) && !(e.target as HTMLElement).closest('a, button'))
        return
      }
      const agora = performance.now(), dt = Math.max(1, agora - giro.t) / 1000
      const r = estado.d / 2
      const dLon = ((e.clientX - giro.x) / r) * (180 / Math.PI)
      const dLat = e.pointerType === 'touch' ? 0 : ((e.clientY - giro.y) / r) * (180 / Math.PI)
      giro.lon -= dLon; giro.lat = clamp(giro.lat + dLat, -40, 40)
      giro.vLon = -dLon / dt; giro.vLat = dLat / dt
      giro.x = e.clientX; giro.y = e.clientY; giro.t = agora
    }
    const onUp = () => { giro.arrastando = false; html.classList.remove('is-arrastando') }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    // cidades acendem uma a uma, de oeste para leste
    let tAcende = -1
    let tSobe = -1
    const blocoB = document.querySelector('[data-falha]')
    const onRevelou = () => { tSobe = performance.now() }
    blocoB?.addEventListener('revelou', onRevelou)

    // nav: some ao descer, volta ao subir
    let ultimoY = window.scrollY, acumulado = 0, navOculta = false
    let rolando = 0
    const onScroll = () => {
      html.classList.add('is-scrolling'); clearTimeout(rolando)
      rolando = window.setTimeout(() => {}, 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    let pronto = false
    let ultimo = performance.now()
    let desenhouFora = false
    let pousado = false
    let raf = 0
    const quadro = (agora: number) => {
      raf = requestAnimationFrame(quadro)
      lenis?.raf(agora)
      const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora
      const y = window.scrollY

      // nav
      const dy = y - ultimoY; ultimoY = y
      if (Math.sign(dy) !== Math.sign(acumulado)) acumulado = 0
      acumulado += dy
      if (!menuAberto && !navOculta && acumulado > 12 && y > 80) { navOculta = true; nav.current?.classList.add('oculta') }
      if (navOculta && acumulado < -24) { navOculta = false; nav.current?.classList.remove('oculta') }
      if (y < 80 && navOculta) { navOculta = false; nav.current?.classList.remove('oculta') }
      nav.current?.classList.toggle('vidro', y > H * 0.6)

      if (!pronto || !Qs.length) return
      const alvo = alvoEm(y)
      const salto = Math.abs(alvo.cy - (estado.cy || alvo.cy)) > H * 1.6
      const k = reduz || salto || !estado.iniciado ? 1000 : 9
      estado.cx = amortecer(estado.cx, alvo.cx, k, dt)
      estado.cy = amortecer(estado.cy, alvo.cy, k, dt)
      estado.d = amortecer(estado.d, alvo.d, k, dt)
      estado.lat = amortecer(estado.lat, alvo.lat, k, dt)
      estado.lon = amortecer(estado.lon, alvo.lon, k, dt)
      estado.iniciado = true

      // giro da mão: inércia; ao descer, volta a zero pelo caminho mais curto
      if (!giro.arrastando) {
        giro.lon += giro.vLon * dt; giro.vLon *= Math.exp(-2.2 * dt)
        giro.lat += giro.vLat * dt; giro.vLat *= Math.exp(-3 * dt)
        giro.lat = amortecer(giro.lat, 0, 1.2, dt)
        if (y > H * 0.25) {
          giro.lon = ((giro.lon + 180) % 360 + 360) % 360 - 180
          giro.lon = amortecer(giro.lon, 0, 3, dt); giro.vLon = 0
        }
      }

      const sy = estado.cy - y // centro na tela
      const r = estado.d / 2
      const visivel = sy + r > -40 && sy - r < H + 40
      grupo.position.set(estado.cx - W / 2, H / 2 - sy, 0)
      grupo.scale.setScalar(r)
      const lat = ((estado.lat + giro.lat) * Math.PI) / 180, lon = ((estado.lon + giro.lon) * Math.PI) / 180
      grupo.rotation.set(lat, -lon, 0, 'XYZ')
      grupo.updateMatrixWorld()

      // luz das cidades: acender, frente, a cena "um sobe, outro cai"
      for (let i = 0; i < CIDADES.length; i++) {
        let luz = tAcende < 0 ? 0 : clamp((agora - tAcende - i * 110) / 300)
        if (tSobe > 0) {
          const s = (agora - tSobe) / 3200
          if (s < 1) {
            const env = Math.sin(clamp(s) * Math.PI)
            if (i === IDX_SOBE) luz *= 1 + env * 0.9
            if (i === IDX_CAI) luz *= 1 - env * 0.85
          }
        }
        if (i === IDX_VOO && pousado) luz *= 0.25
        luzCid[i] = luz
      }
      geoCid.attributes.aLuz.needsUpdate = true

      // o ponto que voa: do globo até o "·" da busca, preso à rolagem
      const v0 = new THREE.Vector3(posCid[IDX_VOO * 3], posCid[IDX_VOO * 3 + 1], posCid[IDX_VOO * 3 + 2]).applyMatrix4(grupo.matrixWorld)
      const origX = v0.x + W / 2, origY = H / 2 - v0.y
      const ini = L.regFim - H * 0.55, fim = L.alvoY - H * 0.62
      const pv = reduz ? (y >= ini ? 1 : 0) : clamp((y - ini) / Math.max(1, fim - ini))
      const pv2 = 1 - Math.pow(1 - pv, 2)
      const alvoX = L.alvoX, alvoYTela = L.alvoY - y
      const el = voo.current!
      if (pv > 0 && pv < 1) {
        // Bézier com o fim na vertical
        const c1x = origX, c1y = origY + 80, c2x = alvoX, c2y = alvoYTela - Math.max(160, (alvoYTela - origY) * 0.5)
        const t = pv2, u = 1 - t
        const bx = u * u * u * origX + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * alvoX
        const by = u * u * u * origY + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * alvoYTela
        el.style.transform = `translate3d(${bx.toFixed(1)}px,${by.toFixed(1)}px,0)`
        el.style.opacity = '1'
      } else el.style.opacity = '0'
      const agoraPousado = pv >= 1
      if (agoraPousado !== pousado) { pousado = agoraPousado; setPousou(agoraPousado) }

      if (visivel) { renderer.render(cena, cam); desenhouFora = false }
      else if (!desenhouFora) { renderer.clear(); desenhouFora = true }
    }

    let menuAberto = false
    const onMenu = (e: Event) => { menuAberto = (e as CustomEvent).detail; if (menuAberto) lenis?.stop(); else lenis?.start() }
    window.addEventListener('nt-menu', onMenu)

    const iniciar = () => {
      medir(); Qs = quadros()
      pronto = true
      cv.classList.add('is-pronto')
      tAcende = performance.now() + (reduz ? -5000 : 500)
    }
    const fontes = Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))])
    fontes.then(() => { html.classList.add('nt-fontes'); iniciar() })
    raf = requestAnimationFrame(quadro)

    let larguraAnt = window.innerWidth
    const onResize = () => {
      if (celular() && window.innerWidth === larguraAnt) return
      larguraAnt = window.innerWidth
      medir(); Qs = quadros()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf); io.disconnect(); lenis?.destroy()
      window.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize)
      window.removeEventListener('nt-menu', onMenu)
      blocoB?.removeEventListener('revelou', onRevelou)
      renderer.dispose()
      html.classList.remove('nt-page', 'nt-fontes', 'lenis', 'is-scrolling', 'is-arrastando', 'sobre-globo')
    }
  }, [])

  // remede quando o texto da busca muda o tamanho do fecho
  useEffect(() => { window.dispatchEvent(new Event('resize')) }, [buscada])
  useEffect(() => { window.dispatchEvent(new CustomEvent('nt-menu', { detail: menu })) }, [menu])
  useEffect(() => {
    if (!menu) return
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false) }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [menu])

  // o campo tem a largura do texto: o sufixo "· UF" fica colado no nome
  useLayoutEffect(() => {
    if (espelho.current && campo.current) campo.current.style.width = `${espelho.current.offsetWidth + 2}px`
  }, [cidade])

  const resultados = buscada ? previa(buscada) : null

  return (
    <div className="nt">
      <canvas className="globo" ref={canvas} aria-hidden="true" />
      <span className="ponto-voo" ref={voo} aria-hidden="true" />
      <svg className="filtros" width="0" height="0" aria-hidden>
        <filter id="nt-f1" x="-20%" width="140%"><feGaussianBlur stdDeviation="70 0" /></filter>
        <filter id="nt-f2" x="-20%" width="140%"><feGaussianBlur stdDeviation="70 0" /></filter>
      </svg>

      <header className="nav" ref={nav}>
        <nav className="nav__grupo nav__grupo--esq" aria-label="Seções">
          <a className="link" href="#regioes">Tendências</a><a className="link" href="#dominio">Sua cidade</a><a className="link" href="#planos">Planos</a>
        </nav>
        <a className="nav__marca" href="#topo">Luvy<span className="nav__ponto" /></a>
        <div className="nav__grupo nav__grupo--dir">
          <a className="link" href="/login">Entrar</a><a className="link" href={CTA}>Testar grátis</a>
        </div>
        <button className={`nav__menu ${menu ? 'aberto' : ''}`} onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-controls="menu">{menu ? 'Fechar' : 'Menu'}</button>
      </header>
      <div className={`menu ${menu ? 'aberto' : ''}`} id="menu" hidden={!menu}>
        {[['#regioes', 'Tendências'], ['#dominio', 'Sua cidade'], ['#planos', 'Planos'], ['#numeros', 'Teste grátis']].map(([h, t], i) => (
          <a key={h} className="menu__link" href={h} style={{ '--i': i } as React.CSSProperties} onClick={() => setMenu(false)}>{t}</a>
        ))}
        <div className="menu__pe"><a className="link" href="/login">Entrar</a><Botao href={CTA}>Testar grátis</Botao></div>
      </div>

      <main id="topo">
        {/* 01 hero */}
        <section className="hero" ref={hero}>
          <p className="palavra hero__palavra" ref={palavra} aria-hidden="true" data-palavra="" data-teto=".36">Vendas</p>
          <Linhas tag="h1" className="hero__lead" linhas={['O que vende', 'na sua cidade,', 'toda semana.']} />
          <Linhas tag="p" className="hero__preco" linhas={['Teste grátis', 'por 7 dias']} />
          <div className="hero__acoes">
            <Botao href={CTA}>Testar grátis</Botao>
            <BotaoSeta href="#regioes" rotulo="Ver como funciona" />
          </div>
        </section>

        {/* 02 regiões (cidades) */}
        <section className="regioes" id="regioes" ref={regioes}>
          <div className="regioes__bloco regioes__bloco--a" data-revela="">
            <Linhas className="titulo" linhas={['Perto da', 'sua loja.']} />
            <p className="corpo">O ranking é o da sua cidade, não a média do Brasil. O que sai em Curitiba não é o que sai em Recife.</p>
          </div>
          <div className="regioes__bloco regioes__bloco--b" data-revela="" data-falha="">
            <Linhas className="titulo" linhas={['Um sobe,', 'outro cai.']} />
            <p className="corpo">Quando um produto dispara ou começa a parar na sua região, o alerta chega antes do próximo pedido.</p>
          </div>
        </section>

        {/* 03 busca (cidade) */}
        <section className="dominio" id="dominio" ref={dominio}>
          <div className="dominio__topo">
            <Linhas className="titulo" linhas={['Comece', 'pela cidade.']} />
            <p className="corpo" data-revela="">Digite onde fica a sua loja. Você vê como a prévia do ranking funciona. Os números de verdade aparecem no seu painel.</p>
          </div>
          <div className="busca__caixa" data-revela="">
          <form className={`busca ${pousou ? 'pousou' : ''} ${erro ? 'erro' : ''}`} onSubmit={buscar} key={treme}>
            <label className="busca__rotulo" htmlFor="nt-cidade">Sua cidade</label>
            <div className="busca__linha">
              <div className={`busca__campo ${cidade ? 'cheio' : ''}`}>
                <span className="busca__espelho" ref={espelho} aria-hidden>{cidade || 'Curitiba'}</span>
                <input id="nt-cidade" ref={campo} className="busca__input" placeholder="Curitiba" maxLength={32} value={cidade} autoComplete="off"
                  onChange={e => { setCidade(e.target.value); setErro('') }} />
                <span className="busca__sufixo" aria-hidden><span className="busca__ponto" ref={pontoBusca}>·<span className="busca__luz" /></span><span>{UF[normaliza(cidade || 'Curitiba')] ?? 'UF'}</span></span>
              </div>
              <BotaoSeta rotulo="Ver a prévia" type="submit" />
            </div>
            <p className="busca__erro" role="alert">{erro}</p>
          </form>
          </div>
          <ul className="tlds" aria-live="polite">
            {CATEGORIAS.map((c, i) => {
              const r = resultados?.[i]
              const est = !buscada ? 'Digite uma cidade' : procurando ? 'Procurando…' : r!.estado
              return (
                <li key={c} className={`tld ${procurando ? 'procurando' : ''} ${r && !procurando ? (r.v > 8 ? 'alta' : r.v < -5 ? 'baixa' : '') : ''}`} style={{ '--i': i } as React.CSSProperties}>
                  <span className="tld__ponto" />
                  <span className="tld__nome">{c}</span>
                  <span className="tld__estado">{est}</span>
                  <span className="tld__preco">{r && !procurando ? `${r.v > 0 ? '+' : r.v < 0 ? '−' : ''}${Math.abs(r.v)}% em 30 dias` : ' '}</span>
                </li>
              )
            })}
          </ul>
          <p className="dominio__nota">Prévia com dados de exemplo.</p>
        </section>

        {/* 04 planos */}
        <section className="planos" id="planos">
          <div className="planos__topo">
            <Linhas className="titulo" linhas={['Escolha', 'o tamanho.']} />
            <div className="alternador" role="radiogroup" aria-label="Período">
              <span className={`alternador__fundo ${anual ? 'dir' : ''}`} />
              <button role="radio" aria-checked={!anual} onClick={() => { setAnual(false); setRodada(r => r + 1) }}>Mensal</button>
              <button role="radio" aria-checked={anual} onClick={() => { setAnual(true); setRodada(r => r + 1) }}>Anual <em>2 meses grátis</em></button>
            </div>
          </div>
          <div className="planos__lista" role="radiogroup" aria-label="Plano" data-revela=""
            onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') setPlano(v => Math.min(2, v + 1)); if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') setPlano(v => Math.max(0, v - 1)) }}>
            {PLANOS.map((pl, i) => {
              const val = anual ? pl.anualV : pl.mensal
              return (
                <button key={pl.nome} role="radio" aria-checked={plano === i} tabIndex={plano === i ? 0 : -1} className={`plano ${plano === i ? 'escolhido' : ''}`} onClick={() => setPlano(i)} style={{ '--i': i } as React.CSSProperties}>
                  <span className="plano__ponto" />
                  <span className="plano__nome">{pl.nome}</span>
                  <span className="plano__spec">{pl.spec}</span>
                  <span className="plano__preco">
                    {val === null ? <span className="plano__valor sc">sob consulta</span> : <>
                      <span className="plano__moeda">R$</span>
                      <span className="plano__valor"><span key={`${val}-${rodada}`} className="rolando" style={{ '--i': i } as React.CSSProperties}>{val}</span></span>
                      <span className="plano__mes">/mês</span>
                    </>}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="planos__resumo" data-revela="">
            <p><b>{nomeCidade} · {uf}</b> no plano <b>{p.nome}</b>, <b>{precoTxt}</b>.</p>
            <Botao href={CTA}>Testar grátis</Botao>
          </div>
          <p className="planos__nota">Sem cartão para testar. Sem fidelidade. Cancele quando quiser.</p>
        </section>

        {/* 05 números */}
        <section className="numeros" id="numeros">
          <div className="numero numero--a" data-numero="" data-filtro="nt-f1">
            <p className="numero__valor" style={{ filter: 'url(#nt-f1)' }}>7 dias</p>
            <p className="numero__legenda">de teste com tudo liberado.<br />Sem cartão de crédito.</p>
          </div>
          <div className="numero numero--b" data-numero="" data-filtro="nt-f2">
            <p className="numero__valor" style={{ filter: 'url(#nt-f2)' }}>3 preços</p>
            <p className="numero__legenda">lado a lado em cada produto.<br />Mercado Livre, Shopee e o seu.</p>
          </div>
        </section>

        {/* 06 fecho */}
        <section className="fecho" data-revela="">
          <div className="fecho__nome">
            <span className="ponto ponto--vivo fecho__ponto" />
            <div className="fecho__caixa"><p className="fecho__dominio" data-palavra="" data-teto=".2">{nomeCidade} · {uf}</p></div>
          </div>
          <div className="fecho__linha">
            <p>no seu radar hoje, <b>{precoTxt}</b>.</p>
            <div className="fecho__acoes"><Botao href={CTA}>Testar grátis</Botao><BotaoSeta href={CTA} rotulo="Testar grátis" /></div>
          </div>
        </section>
      </main>

      <footer className="rodape">
        <div className="rodape__topo">
          <p className="rodape__vivo"><span className="ponto ponto--vivo" /> Dados atualizados todo dia</p>
          <div className="rodape__cols">
            <div><h6>Produto</h6><a className="link" href="#regioes">Tendências</a><a className="link" href="#planos">Planos</a><a className="link" href="/login">Entrar</a></div>
            <div><h6>Ajuda</h6><a className="link" href="#dominio">Prévia por cidade</a><a className="link" href="#numeros">Teste grátis</a></div>
            {/* TODO: links reais de WhatsApp e Instagram */}
            <div><h6>Contato</h6><a className="link" href="https://wa.me/55XXXXXXXXXXX">WhatsApp</a><a className="link" href="#">Instagram</a></div>
          </div>
        </div>
        <div className="rodape__linha">
          <span>© {new Date().getFullYear()} LuvyMetrics</span>
          {/* TODO: páginas de Termos e Privacidade (LGPD) */}
          <span><a className="link" href="#">Termos</a> · <a className="link" href="#">Privacidade</a> · <a className="link" href="#topo">Voltar ao topo</a></span>
        </div>
        <div className="rodape__caixa"><p className="palavra rodape__palavra" data-palavra="" aria-hidden="true">Luvy</p></div>
      </footer>
    </div>
  )
}
