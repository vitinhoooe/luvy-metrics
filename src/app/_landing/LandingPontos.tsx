'use client'

/*
 * Versão C — "Pontos" (inspirada no modelo Ollo).
 * Um mundo preso na tela: a rolagem não desce a página, ela move a câmera e troca a cena.
 * A peça central é o símbolo do LuvyMetrics feito de pontos 3D (gerado aqui, sem modelo externo).
 * Cenas (em telas de rolagem): 0 hero · 1 cartão · 2–3,5 tendências · 3,5–4,5 chuva · 4,5–6 preço · 7 fim.
 */

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './pontos.css'

const SIGNUP_URL = '/login'

/* ---------- roteiro ---------- */

type Pose = { f: number; cam: [number, number, number]; alvo: [number, number, number]; shift: number; roll: number }
const POSES: Record<'desk' | 'cel', Pose[]> = {
  desk: [
    { f: 0, cam: [0, 0.12, 7.2], alvo: [0, 0.12, 0], shift: 0, roll: 0 },
    { f: 1, cam: [0, 0.05, 6.2], alvo: [0, 0.05, 0], shift: 0, roll: 0 },
    { f: 2, cam: [0.55, 0.45, 3.1], alvo: [0.2, 0.2, 0], shift: 0.5, roll: -0.12 },
    { f: 3.5, cam: [0.5, 0.4, 2.7], alvo: [0.22, 0.22, 0], shift: 0.52, roll: -0.12 },
    { f: 4.5, cam: [-0.5, -0.2, 2.6], alvo: [-0.2, -0.2, 0], shift: -0.52, roll: 0.1 },
    { f: 6, cam: [-0.45, -0.2, 2.3], alvo: [-0.22, -0.22, 0], shift: -0.55, roll: 0.1 },
    { f: 7, cam: [0, -0.2, 7.6], alvo: [0, -0.2, 0], shift: 0, roll: 0 },
  ],
  cel: [
    { f: 0, cam: [0, -0.55, 10.5], alvo: [0, -0.55, 0], shift: 0, roll: 0 },
    { f: 1, cam: [0, -0.2, 9.5], alvo: [0, -0.2, 0], shift: 0, roll: 0 },
    { f: 2, cam: [0.7, -0.6, 2.9], alvo: [0.45, 0.1, 0], shift: 0, roll: -0.08 },
    { f: 3.5, cam: [0.7, -0.6, 2.6], alvo: [0.5, 0.15, 0], shift: 0, roll: -0.08 },
    { f: 4.5, cam: [-0.7, -1.0, 2.6], alvo: [-0.4, -0.25, 0], shift: 0, roll: 0.08 },
    { f: 6, cam: [-0.7, -1.0, 2.3], alvo: [-0.4, -0.22, 0], shift: 0, roll: 0.08 },
    { f: 7, cam: [0, -0.2, 10.5], alvo: [0, -0.2, 0], shift: 0, roll: 0 },
  ],
}
const FIM = 7
const suave = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))

function poseEm(lista: Pose[], f: number) {
  let i = 0
  while (i < lista.length - 2 && f > lista[i + 1].f) i++
  const a = lista[i], b = lista[i + 1]
  const t = suave(clamp((f - a.f) / (b.f - a.f)))
  return {
    cam: a.cam.map((v, k) => lerp(v, b.cam[k], t)) as [number, number, number],
    alvo: a.alvo.map((v, k) => lerp(v, b.alvo[k], t)) as [number, number, number],
    shift: lerp(a.shift, b.shift, t),
    roll: lerp(a.roll, b.roll, t),
  }
}

/** Cena e passo da pilha para cada posição do filme. */
function cenaDe(f: number) {
  if (f < 0.5) return { cena: 'hero', passo: 0 }
  if (f < 1.5) return { cena: 'card', passo: 0 }
  if (f < 3.6) return { cena: 'tend', passo: Math.min(2, Math.floor((f - 1.9) / 0.5)) }
  if (f < 4.4) return { cena: 'chuva', passo: 0 }
  if (f < 6.4) return { cena: 'preco', passo: Math.min(2, Math.floor((f - 4.4) / 0.5)) }
  return { cena: 'fim', passo: 0 }
}

/* ---------- o símbolo em pontos ---------- */

function geraSimbolo(n: number) {
  // Segmentos do "L de gráfico": eixo vertical, eixo horizontal e a linha que sobe; mais a bolinha no fim.
  const segs: [number, number, number, number, number][] = [
    [-0.78, 0.86, -0.78, -0.78, 0.1],
    [-0.78, -0.78, 0.95, -0.78, 0.1],
    [-0.46, -0.26, -0.05, 0.14, 0.085],
    [-0.05, 0.14, 0.26, -0.06, 0.085],
    [0.26, -0.06, 0.66, 0.42, 0.085],
  ]
  const bola = { x: 0.7, y: 0.5, r: 0.19 }
  const comp = segs.map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1))
  const areaBola = 1.3
  const total = comp.reduce((a, b) => a + b, 0) + areaBola
  const pos = new Float32Array(n * 3)
  const cor = new Float32Array(n * 3)
  const sorte = new Float32Array(n)
  const topo = new THREE.Color('#f7d7d0'), base = new THREE.Color('#ff6a26'), meio = new THREE.Color('#e9a7a0')
  const c = new THREE.Color()
  let s = 7
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number
    let escolha = r() * total
    let k = 0
    while (k < segs.length && escolha > comp[k]) { escolha -= comp[k]; k++ }
    if (k < segs.length) {
      const [x1, y1, x2, y2, raio] = segs[k]
      const t = r()
      const ang = r() * Math.PI * 2, rr = raio * Math.sqrt(r())
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy)
      const nx = -dy / L, ny = dx / L
      x = x1 + dx * t + nx * Math.cos(ang) * rr
      y = y1 + dy * t + ny * Math.cos(ang) * rr
      z = Math.sin(ang) * rr
    } else {
      const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = bola.r * Math.cbrt(r())
      const q = Math.sqrt(1 - u * u)
      x = bola.x + rr * q * Math.cos(th); y = bola.y + rr * q * Math.sin(th); z = rr * u
    }
    pos.set([x, y, z], i * 3)
    const h = clamp((y + 0.85) / 1.6)
    c.copy(base).lerp(meio, clamp(h * 1.6)).lerp(topo, clamp((h - 0.55) * 2.2))
    const luz = 0.72 + 0.28 * clamp(z / 0.12 * 0.5 + 0.5)
    cor.set([c.r * luz, c.g * luz, c.b * luz], i * 3)
    sorte[i] = r()
  }
  return { pos, cor, sorte }
}

/* ---------- ícones pequenos ---------- */
const I = ({ d, s = 16 }: { d: React.ReactNode; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
)
const Seta = () => <I d={<path d="M5 12h13M13 6l6 6-6 6" />} />
const Check = () => <I d={<path d="M5 12.5l4.5 4.5L19 7.5" />} />

function Marca() {
  return (
    <svg className="pt-marca-svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      {[0, 1, 2].flatMap(l => [0, 1, 2].map(cc => (
        <circle key={`${l}${cc}`} cx={5 + cc * 7} cy={5 + l * 7} r={l === 1 && cc === 1 ? 2.6 : 2} className={l === 1 && cc === 1 ? 'acende' : ''} />
      )))}
    </svg>
  )
}

function Barras({ valores, eixo, finas = false }: { valores: number[]; eixo: string[]; finas?: boolean }) {
  const max = Math.max(...valores, 1)
  return (
    <>
      <div className={`pt-barras ${finas ? 'finas' : ''}`}>
        {valores.map((v, i) => (
          <i key={i} className={`${i === valores.length - 1 ? 'hoje' : ''} ${v === 0 ? 'zero' : ''}`} style={{ '--v': (v / max).toFixed(3) } as React.CSSProperties} />
        ))}
      </div>
      <div className="pt-eixo">{eixo.map(e => <span key={e}>{e}</span>)}</div>
    </>
  )
}

const SERIES: Record<string, number[]> = {
  Semana: [6, 9, 4, 7, 12, 8, 14],
  Mês: [38, 52, 29, 24, 61, 47, 66],
  Ano: [180, 240, 205, 262, 231, 298, 320],
}

/* ---------- página ---------- */

export default function LandingPontos() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const janela = useRef<HTMLDivElement>(null)
  const claro = useRef<HTMLDivElement>(null)
  const trilha = useRef<HTMLDivElement>(null)
  const [cena, setCena] = useState({ cena: 'hero', passo: 0 })
  const [hora, setHora] = useState('')
  const [aba, setAba] = useState('Semana')
  const [chaves, setChaves] = useState([true, true, false])
  const [aplicado, setAplicado] = useState([false, false])
  const [etq, setEtq] = useState<string[]>(['Sua cidade'])
  const [pedido, setPedido] = useState('')
  const [aviso, setAviso] = useState('Preço sugerido: R$ 55,43 com 40% de margem.')
  const [enviando, setEnviando] = useState(false)

  // relógio
  useEffect(() => {
    const t = () => setHora(new Date().toLocaleTimeString('pt-BR'))
    t()
    const id = setInterval(t, 1000)
    return () => clearInterval(id)
  }, [])

  // caixa que digita sozinha quando o cartão chega
  const jaDigitou = useRef(false)
  useEffect(() => {
    if (cena.cena !== 'card' || jaDigitou.current) return
    jaDigitou.current = true
    const frase = 'Qual o preço ideal do óleo de massagem?'
    let i = 0
    const id = setInterval(() => {
      i++
      setPedido(frase.slice(0, i))
      if (i >= frase.length) {
        clearInterval(id)
        setTimeout(() => { setEnviando(true); setAviso('Feito. Com 40% de margem, venda a R$ 55,43.') }, 400)
        setTimeout(() => { setPedido(''); setEnviando(false) }, 1400)
      }
    }, 45)
    return () => clearInterval(id)
  }, [cena.cena])

  // o mundo: três.js + diretor
  useEffect(() => {
    const cv = canvas.current!
    const html = document.documentElement
    html.classList.add('pt-page')
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const celular = () => window.matchMedia('(max-width: 760px), (hover: none)').matches

    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, powerPreference: 'high-performance' })
    renderer.setClearColor(0x000000, 0)
    const cenaGL = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50)

    const N = celular() ? 11000 : 16000
    const { pos, cor, sorte } = geraSimbolo(N)
    const atual = new Float32Array(pos)
    const desl = new Float32Array(N * 3)
    const vel = new Float32Array(N * 3)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(atual, 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('color', new THREE.BufferAttribute(cor, 3))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      uniforms: { uTam: { value: 26 }, uDpr: { value: 1 }, uMonta: { value: 0 } },
      vertexShader: `
        attribute vec3 color; varying vec3 vCor; varying float vA;
        uniform float uTam; uniform float uDpr; uniform float uMonta;
        void main(){
          vCor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(uTam * uDpr / -mv.z, 1.0, 7.0 * uDpr);
          vA = uMonta;
        }`,
      fragmentShader: `
        varying vec3 vCor; varying float vA;
        void main(){ gl_FragColor = vec4(vCor, vA); }`,
    })
    const pontos = new THREE.Points(geo, mat)
    const grupo = new THREE.Group()
    grupo.add(pontos)
    pontos.position.set(-0.085, -0.04, 0) // centraliza o símbolo (o desenho é um pouco deslocado para a direita)
    cenaGL.add(grupo)

    // tamanho
    let W = 0, H = 0
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, celular() ? 1.75 : 2)
      renderer.setPixelRatio(dpr)
      renderer.setSize(W, H, false)
      mat.uniforms.uDpr.value = dpr * (H / 900)
      camera.aspect = W / H
      if (trilha.current) trilha.current.style.height = `${(FIM + 1) * H}px`
    }
    resize()
    window.addEventListener('resize', resize)

    // mouse (o pente) e inclinação
    const mouse = { x: 0, y: 0, px: 0, py: 0, ativo: false, nx: 0, ny: 0 }
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.ativo = true
      mouse.nx = (e.clientX / W) * 2 - 1; mouse.ny = -(e.clientY / H) * 2 + 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    const ray = new THREE.Raycaster()
    const plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const pMundo = new THREE.Vector3(), pAnt = new THREE.Vector3(), tmp = new THREE.Vector3()
    const inv = new THREE.Matrix4()
    let temAnt = false

    // âncoras (#cena) viram posições do filme
    const ancoras: Record<string, number> = { '#inicio': 0, '#card': 1, '#tendencias': 2.5, '#preco': 5.5, '#fim': FIM }
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const alvo = ancoras[a.getAttribute('href') ?? '']
      if (alvo === undefined) return
      e.preventDefault()
      window.scrollTo({ top: alvo * H, behavior: Math.abs(alvo - f) > 1.6 || reduz ? 'auto' : 'smooth' })
    }
    document.addEventListener('click', onClick)

    // diretor
    let f = window.scrollY / Math.max(1, window.innerHeight)
    let monta = reduz ? 1 : 0
    const t0Monta = performance.now()
    let tilt = { x: 0, y: 0 }
    let ultimo = performance.now()
    let raf = 0
    let cenaAtual = ''
    let rolando = 0
    const onScroll = () => { html.classList.add('is-scrolling'); clearTimeout(rolando); rolando = window.setTimeout(() => html.classList.remove('is-scrolling'), 160) }
    window.addEventListener('scroll', onScroll, { passive: true })

    const quadro = (agora: number) => {
      raf = requestAnimationFrame(quadro)
      const dt = Math.min(0.05, (agora - ultimo) / 1000)
      ultimo = agora
      const alvoF = window.scrollY / H
      if (reduz || Math.abs(alvoF - f) > 1.6) f = alvoF
      else f += (alvoF - f) * Math.min(1, dt * 5.5)

      const c = cenaDe(f)
      const chave = `${c.cena}:${c.passo}`
      if (chave !== cenaAtual) { cenaAtual = chave; setCena(c) }

      // janela que vira cartão (0 → 1 → 2)
      const cel = celular()
      const kCard = f < 1 ? suave(clamp(f)) : suave(clamp(2 - f))
      const esc = 1 - kCard * (1 - (cel ? 0.74 : 0.565))
      if (janela.current) {
        janela.current.style.transform = `scale(${esc.toFixed(4)})`
        janela.current.style.borderRadius = `${(kCard * 28 / esc).toFixed(1)}px`
        janela.current.style.setProperty('--k', kCard.toFixed(3))
      }
      if (claro.current) claro.current.style.opacity = kCard.toFixed(3)

      // câmera
      const p = poseEm(POSES[cel ? 'cel' : 'desk'], f)
      camera.position.set(...p.cam)
      camera.up.set(Math.sin(p.roll), Math.cos(p.roll), 0)
      camera.lookAt(...p.alvo)
      camera.updateProjectionMatrix()
      camera.projectionMatrix.elements[8] = p.shift
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()

      // busto/símbolo vira para o cursor (menos nos closes)
      const close = c.cena === 'tend' || c.cena === 'preco'
      const quanto = reduz ? 0 : close ? 0.25 : 1
      tilt.x += ((mouse.ny * 0.22) * quanto - tilt.x) * Math.min(1, dt * 3)
      tilt.y += ((mouse.nx * 0.38) * quanto - tilt.y) * Math.min(1, dt * 3)
      grupo.rotation.set(-tilt.x, tilt.y, -tilt.y * 0.12)
      grupo.updateMatrixWorld()

      // montagem na abertura
      if (monta < 1) monta = Math.min(1, (agora - t0Monta) / 2400)
      mat.uniforms.uMonta.value = Math.min(1, monta * 1.6)
      const emMonta = 1 - suave(monta)

      // chuva entre os closes (3,5 → 4,5)
      const tc = clamp((f - 3.5) / 1)
      const chuvaDesce = tc < 0.5 ? Math.pow(tc / 0.5, 2) : 0
      const chuvaSobe = tc >= 0.5 ? Math.pow(1 - (tc - 0.5) / 0.5, 2) : 0

      // pente: cursor no espaço do símbolo
      let cx = 0, cy = 0, cvx = 0, cvy = 0, pente = false
      if (mouse.ativo && !reduz && !cel) {
        ray.setFromCamera(new THREE.Vector2(mouse.nx, mouse.ny), camera)
        if (ray.ray.intersectPlane(plano, tmp)) {
          inv.copy(grupo.matrixWorld).invert()
          pMundo.copy(tmp).applyMatrix4(inv)
          if (temAnt) { cvx = (pMundo.x - pAnt.x) / Math.max(dt, 0.008); cvy = (pMundo.y - pAnt.y) / Math.max(dt, 0.008) }
          pAnt.copy(pMundo); temAnt = true
          cx = pMundo.x; cy = pMundo.y; pente = Math.hypot(cvx, cvy) > 0.05
        }
      }
      const R = 0.32, R2 = R * R, k = 26, amort = 3.1

      for (let i = 0; i < N; i++) {
        const j = i * 3
        let dx = desl[j], dy = desl[j + 1], dz = desl[j + 2]
        let vx = vel[j], vy = vel[j + 1], vz = vel[j + 2]
        if (pente) {
          const ex = pos[j] + dx - cx, ey = pos[j + 1] + dy - cy
          const d2 = ex * ex + ey * ey
          if (d2 < R2) {
            const w = (1 - Math.sqrt(d2) / R) * 0.16
            vx += (cvx - vx) * w; vy += (cvy - vy) * w; vz += (sorte[i] - 0.5) * w * 2
          }
        }
        vx += (-k * dx - amort * vx) * dt; vy += (-k * dy - amort * vy) * dt; vz += (-k * dz - amort * vz) * dt
        dx += vx * dt; dy += vy * dt; dz += vz * dt
        desl[j] = dx; desl[j + 1] = dy; desl[j + 2] = dz
        vel[j] = vx; vel[j + 1] = vy; vel[j + 2] = vz
        const espalha = emMonta * (2 + sorte[i] * 4)
        const queda = (chuvaSobe - chuvaDesce) * (1.6 + sorte[i] * 2.6)
        atual[j] = pos[j] + dx + (sorte[(i * 7) % N] - 0.5) * espalha
        atual[j + 1] = pos[j + 1] + dy + queda + (sorte[(i * 13) % N] - 0.5) * espalha
        atual[j + 2] = pos[j + 2] + dz + (sorte[(i * 17) % N] - 0.5) * espalha
      }
      geo.attributes.position.needsUpdate = true

      // desenha só no retângulo da janela (o canvas nunca encolhe por CSS)
      const w = W * esc, h = H * esc, x = (W - w) / 2, y = (H - h) / 2
      renderer.setScissorTest(true)
      renderer.setViewport(x, y, w, h)
      renderer.setScissor(x, y, w, h)
      renderer.clear()
      renderer.render(cenaGL, camera)
    }
    raf = requestAnimationFrame(quadro)
    requestAnimationFrame(() => html.classList.add('pt-ready'))

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('click', onClick)
      geo.dispose(); mat.dispose(); renderer.dispose()
      html.classList.remove('pt-page', 'pt-ready', 'is-scrolling')
    }
  }, [])

  const em = (nome: string) => (cena.cena === nome ? 'is-viva' : '')
  const passoClasse = (col: string, i: number) => {
    if (cena.cena !== col) return ''
    return cena.passo === i ? 'is-frente' : cena.passo > i ? 'is-atras' : ''
  }

  return (
    <div className="pt">
      <a className="pt-pular" href="#fim">Pular para o teste grátis</a>

      <header className="pt-nav">
        <a href="#inicio" className="pt-nav-marca" aria-label="LuvyMetrics, início"><Marca /><span>Luvy</span></a>
        <span className="pt-nav-hora mono">{hora}</span>
        <span className="pt-nav-sep" />
        <span className="pt-nav-status"><i />7 dias grátis</span>
        <span className="pt-nav-sep pt-hide-m" />
        <nav className="pt-nav-links" aria-label="Principal">
          <a href="#card" className={cena.cena === 'card' ? 'is-aqui' : ''}>Como funciona</a>
          <a href="#tendencias" className={cena.cena === 'tend' ? 'is-aqui' : ''}>Tendências</a>
          <a href="#preco" className={cena.cena === 'preco' ? 'is-aqui' : ''}>Preço</a>
        </nav>
        <a href="/login" className="pt-btn pt-btn-vidro pt-nav-entrar">Entrar</a>
        <a href={SIGNUP_URL} className="pt-btn pt-btn-sinal">Testar grátis</a>
      </header>

      <div className="pt-mundo">
        <div className="pt-claro" ref={claro} />
        <div className="pt-janela" ref={janela}>
          <div className="pt-brilho" />
          <p className={`pt-titulo pt-titulo-hero ${cena.cena === 'hero' || cena.cena === 'card' ? 'on' : ''}`} aria-hidden>
            <span className="metade">LU</span><span className="metade">VY</span>
          </p>
          <p className={`pt-titulo pt-titulo-fim ${cena.cena === 'fim' ? 'on' : ''}`} aria-hidden>
            <span className="metade">Teste</span><span className="metade">agora</span>
          </p>
          <div className={`pt-conversa ${em('card')}`}>
            <p className="pt-selos"><span className="pt-selo"><i />LuvyMetrics</span></p>
            <h2 className="pt-frase">Sua loja inteira,<br /><span>num painel só.</span></h2>
          </div>
        </div>

        <canvas className="pt-palco" ref={canvas} />

        {/* peças em volta do cartão */}
        <div className={`pt-pecas ${em('card')}`}>
          <div className="pt-peca pt-prod pt-prod-1"><small>Em alta · Curitiba</small><b>Óleo de massagem</b><em>+38%</em></div>
          <div className="pt-peca pt-prod pt-prod-2"><small>Em alta · Londrina</small><b>Kit presente casal</b><em>+9%</em></div>
          <button className="pt-peca pt-pilula pt-anexar" type="button">Trocar cidade <span>+</span></button>
          <div className="pt-peca pt-comandos">
            <button type="button" className="is-on">Ranking <kbd>⌘R</kbd></button>
            <button type="button">Preço <kbd>⌘P</kbd></button>
            <button type="button">Comparar <kbd>⌘C</kbd></button>
          </div>
          <div className="pt-peca pt-grafico">
            <div className="pt-grafico-topo"><span>Vendas na sua cidade</span><b className="pt-badge">+14%</b></div>
            <Barras valores={[2.1, 3.4, 1.6, 2.8, 3.9, 2.4, 4.6]} eixo={['seg', 'hoje']} />
            <small className="pt-ex">dados de exemplo</small>
          </div>
          <div className="pt-peca pt-aviso" role="status"><span className="pt-aviso-check"><Check /></span><span>{aviso}</span></div>
          <form className="pt-peca pt-compositor" onSubmit={e => {
            e.preventDefault()
            if (!pedido.trim()) return
            setAviso(`Anotado: "${pedido.trim()}". A resposta aparece no seu painel.`)
            setPedido('')
          }}>
            <textarea id="pedido" rows={1} placeholder="Pergunte sobre a sua loja…" value={pedido} onChange={e => setPedido(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit() } }} />
            <div className="pt-compositor-pe">
              <span className="pt-mini">Produto</span><span className="pt-mini">Cidade</span>
              <button type="submit" className={`pt-envia ${pedido || enviando ? 'is-pronto' : ''}`} aria-label="Enviar"><I d={<path d="M12 19V5M6 11l6-6 6 6" />} /></button>
            </div>
          </form>
        </div>

        {/* hero */}
        <div className={`pt-hero-pe ${em('hero')}`}>
          <p className="pt-selos"><span className="pt-selo"><i />Para donos de sex shop</span><span className="pt-versao">dados da sua cidade</span></p>
          <h1 className="pt-frase pt-frase-hero">Saiba o que vende antes de comprar.<br /><span>Você só decide o pedido.</span></h1>
        </div>

        {/* close 1: tendências */}
        <section className={`pt-coluna pt-coluna-dir ${em('tend')}`} id="tendencias" aria-label="Tendências">
          <div className={`pt-coluna-texto ${cena.cena === 'tend' && cena.passo <= 0 ? 'is-frente' : 'is-atras-m'}`}>
            <p className="pt-selos"><span className="pt-selo"><i />Tendências</span><span className="pt-versao">da sua cidade</span></p>
            <h2 className="pt-frase">O que está saindo.<br /><span>Antes de fazer o pedido.</span></h2>
            <p className="pt-p">O ranking mostra os produtos que mais crescem perto de você e avisa o que começou a parar. Você compra mais do que gira e menos do que encalha.</p>
            <div className="pt-etiquetas">
              {['Sua cidade', 'Lubrificantes', 'Óleos', 'Lingerie'].map(t => (
                <button key={t} type="button" className={`pt-etiqueta ${etq.includes(t) ? 'is-on' : ''}`}
                  onClick={() => setEtq(v => v.includes(t) ? v.filter(x => x !== t) : [...v, t])} aria-pressed={etq.includes(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="pt-pilha">
            <article className={`pt-cartao ${passoClasse('tend', 1)}`}>
              <div className="pt-cartao-topo"><span>Em alta na sua cidade</span>
                <div className="pt-abas" role="tablist">
                  {Object.keys(SERIES).map(s => <button key={s} role="tab" aria-selected={aba === s} className={aba === s ? 'is-on' : ''} onClick={() => setAba(s)}>{s}</button>)}
                </div>
              </div>
              <Barras valores={SERIES[aba]} eixo={['qui', 'sex', 'sáb', 'dom', 'seg', 'ter', 'hoje']} />
              <p className="pt-cartao-nota">Vendas de Óleo de massagem · dados de exemplo</p>
            </article>
            <article className={`pt-cartao ${passoClasse('tend', 2)}`}>
              <div className="pt-cartao-topo"><span>Alertas</span><b className="pt-badge">No painel</b></div>
              {['Avisar quando um produto subir', 'Avisar quando um produto cair', 'Resumo da semana'].map((t, i) => (
                <button key={t} type="button" role="switch" aria-checked={chaves[i]} className="pt-chave" onClick={() => setChaves(v => v.map((x, k) => k === i ? !x : x))}>
                  <span>{t}</span><i />
                </button>
              ))}
              <p className="pt-cartao-nota">Você escolhe o que quer receber.</p>
            </article>
          </div>
        </section>

        {/* close 2: preço */}
        <section className={`pt-coluna pt-coluna-esq ${em('preco')}`} id="preco" aria-label="Preço">
          <div className={`pt-coluna-texto ${cena.cena === 'preco' && cena.passo <= 0 ? 'is-frente' : 'is-atras-m'}`}>
            <p className="pt-selos"><span className="pt-selo pt-selo-vivo"><i />Preço</span><span className="pt-versao">com todas as taxas</span></p>
            <h2 className="pt-frase">Precifica sem chute.<br /><span>Você só confere.</span></h2>
            <p className="pt-p">Custo, embalagem, frete e a taxa de cada canal entram na conta. O comparador mostra seu preço ao lado do Mercado Livre e da Shopee.</p>
            <div className="pt-etiquetas">
              <span className="pt-etiqueta is-fixa">Mercado Livre</span><span className="pt-etiqueta is-fixa">Shopee</span><span className="pt-etiqueta is-fixa">Balcão</span>
            </div>
          </div>
          <div className="pt-pilha">
            <article className={`pt-cartao ${passoClasse('preco', 1)}`}>
              <div className="pt-cartao-topo"><span>Preço ideal</span><b className="pt-badge">margem 40%</b></div>
              <dl className="pt-calc">
                <div><dt>Custo do produto</dt><dd>R$ 22,00</dd></div>
                <div><dt>Embalagem e envio</dt><dd>R$ 3,50</dd></div>
                <div><dt>Taxa do canal</dt><dd>14%</dd></div>
                <div className="tot"><dt>Preço sugerido</dt><dd>R$ 55,43</dd></div>
              </dl>
              <p className="pt-cartao-nota">Óleo de massagem · dados de exemplo</p>
            </article>
            <article className={`pt-cartao ${passoClasse('preco', 2)}`}>
              <div className="pt-cartao-topo"><span>Comparador</span><b className="pt-badge pt-badge-sinal">{aplicado.filter(x => !x).length}</b></div>
              <ul className="pt-pend">
                {[['Mercado Livre', 'R$ 62,90', 'você fica R$ 7,47 abaixo'], ['Shopee', 'R$ 58,40', 'você fica R$ 2,97 abaixo']].map(([c, p, n], i) => (
                  <li key={c} className={aplicado[i] ? 'is-feito' : ''}>
                    <div><b>{c} · {p}</b><small>{n}</small></div>
                    <button type="button" className="pt-aprovar" onClick={() => setAplicado(v => v.map((x, k) => k === i ? true : x))}>{aplicado[i] ? 'Visto' : 'Ver anúncio'}</button>
                  </li>
                ))}
              </ul>
              <p className="pt-cartao-nota">Sua loja: R$ 55,43 · dados de exemplo</p>
            </article>
          </div>
        </section>

        {/* fim */}
        <section className={`pt-fim ${em('fim')}`} id="fim">
          <h2 className="pt-sr">Teste grátis</h2>
          <p className="pt-fim-frase">7 dias grátis, com tudo liberado.<br /><span>Sem cartão de crédito.</span></p>
          <div className="pt-fim-btns">
            <a href={SIGNUP_URL} className="pt-btn pt-btn-sinal pt-btn-g">Testar grátis</a>
            <a href="/login" className="pt-btn pt-btn-vidro pt-btn-g">Já tenho conta</a>
          </div>
        </section>
      </div>

      <main className="pt-trilha" ref={trilha}>
        <div id="inicio" /><div id="card" />
      </main>

      <footer className="pt-rodape">
        <p className="pt-rodape-marca" aria-hidden>LUVY</p>
        <nav>
          <a href="#inicio">Início</a>
          {/* TODO: páginas de Termos e Privacidade (LGPD) */}
          <a href="#">Privacidade</a>
          {/* TODO: número real do WhatsApp */}
          <a href="https://wa.me/55XXXXXXXXXXX">Contato</a>
        </nav>
        <small>© {new Date().getFullYear()} LuvyMetrics. Inteligência de mercado para sex shops.</small>
      </footer>
    </div>
  )
}
