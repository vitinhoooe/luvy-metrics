// Trilha original (sintetizada aqui) para o vídeo de produto: public/trilha-cine.wav
// 120 BPM = 1 batida a cada 15 quadros (30 fps). 44 s, 22 compassos de 2 s.
// Estrutura casada com as cenas: intro (0-4s) só pad, entra o pulso, impactos nos cortes,
// pausa antes do mural (34s), final volta ao pad da abertura (o vídeo faz loop).
// Uso: node gerar-trilha-cine.mjs
import { writeFileSync, mkdirSync } from 'node:fs'

const SR = 44100, BPM = 120, DUR = 44
const N = SR * DUR
const L = new Float32Array(N), R = new Float32Array(N)
const beat = 60 / BPM, bar = beat * 4
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12)
let s = 777
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1

function add(t0, dur, fn, gl = 1, gr = 1) {
  const i0 = Math.floor(t0 * SR), n = Math.floor(dur * SR)
  for (let i = 0; i < n && i0 + i < N; i++) {
    if (i0 + i < 0) continue
    const v = fn(i / SR)
    L[i0 + i] += v * gl; R[i0 + i] += v * gr
  }
}
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d))

// progressão menor e quente: Dm9 – Bbmaj7 – Fmaj7 – C6 (1 acorde por compasso)
const ACORDES = [[50, 57, 60, 64, 65], [46, 53, 57, 62], [41, 48, 57, 64], [48, 55, 57, 64]]
const BAIXO = [38, 34, 41, 36]
const CORTES = [4, 10, 16, 22, 28, 34] // segundos: troca de cena (impacto)
const compassos = DUR / bar

for (let c = 0; c < compassos; c++) {
  const t = c * bar
  const ac = ACORDES[c % 4]
  const intro = c < 2 || c >= 20          // abertura e final: só pad (loop limpo)
  const pausa = c === 17                 // respiro antes do mural
  // pad largo, com desafinação e ataque lento
  ac.forEach((m, k) => {
    const f = midi(m + 12)
    add(t, bar + 0.6, (x) => {
      const e = Math.min(1, x / 0.9) * Math.min(1, (bar + 0.6 - x) / 0.7)
      return e * 0.03 * (Math.sin(2 * Math.PI * f * x) + 0.5 * Math.sin(2 * Math.PI * f * 1.004 * x) + 0.5 * Math.sin(2 * Math.PI * f * 0.996 * x))
    }, k % 2 ? 0.6 : 1, k % 2 ? 1 : 0.6)
  })
  if (intro) continue
  for (let b = 0; b < 4; b++) {
    const tb = t + b * beat
    // pulso de baixo em colcheias (o "motor" cinematográfico)
    if (!pausa) for (let h = 0; h < 2; h++) {
      const f = midi(BAIXO[c % 4])
      add(tb + h * beat / 2, beat / 2, (x) => env(x, 0.004, 0.12) * 0.16 * Math.tanh(2 * Math.sin(2 * Math.PI * f * x)))
    }
    // bumbo em todos os tempos (fica mais forte no mural)
    if (!pausa) add(tb, 0.4, (x) => env(x, 0.002, 0.1) * (c >= 18 ? 0.6 : 0.45) * Math.sin(2 * Math.PI * (48 + 110 * Math.exp(-x * 32)) * x))
    // chimbal fechado em semicolcheias, bem baixo
    if (!pausa && c >= 3) for (let h = 0; h < 4; h++) add(tb + h * beat / 4, 0.05, (x) => env(x, 0.001, 0.012) * (h % 2 ? 0.035 : 0.05) * rnd(), h % 2 ? 1 : 0.7, h % 2 ? 0.7 : 1)
    // estalo nos tempos 2 e 4
    if (!pausa && (b === 1 || b === 3)) add(tb, 0.2, (x) => env(x, 0.002, 0.04) * 0.14 * rnd())
  }
  // arpejo brilhante nas cenas (pluck)
  if (!pausa) for (let k = 0; k < 8; k++) {
    const m = ac[k % ac.length] + 24
    add(t + k * beat / 2, 0.5, (x) => env(x, 0.003, 0.18) * 0.03 * Math.sin(2 * Math.PI * midi(m) * x) * Math.exp(-x * 3), k % 2 ? 0.5 : 1, k % 2 ? 1 : 0.5)
  }
}

// subida (ruído filtrado) antes de cada corte + impacto grave no corte
for (const tc of CORTES) {
  add(tc - 1, 1, (x) => (x / 1) ** 2 * 0.06 * rnd())
  add(tc, 1.8, (x) => env(x, 0.003, 0.5) * 0.5 * Math.sin(2 * Math.PI * (32 + 40 * Math.exp(-x * 8)) * x))
  add(tc, 0.4, (x) => env(x, 0.001, 0.08) * 0.12 * rnd())
}

// passa-baixa suave, fade curto (o final já volta ao pad da abertura), normalização
const lp = (buf, a) => { let y = 0; for (let i = 0; i < N; i++) { y += a * (buf[i] - y); buf[i] = y } }
lp(L, 0.45); lp(R, 0.45)
let pico = 0
for (let i = 0; i < N; i++) {
  const t = i / SR
  const f = Math.min(1, t / 1.5) * Math.min(1, (DUR - t) / 1.5)
  L[i] *= f; R[i] *= f
  pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]))
}
const ganho = 0.89 / pico
const dados = Buffer.alloc(N * 4)
for (let i = 0; i < N; i++) {
  dados.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * ganho)) * 32767), i * 4)
  dados.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * ganho)) * 32767), i * 4 + 2)
}
const cab = Buffer.alloc(44)
cab.write('RIFF', 0); cab.writeUInt32LE(36 + dados.length, 4); cab.write('WAVE', 8)
cab.write('fmt ', 12); cab.writeUInt32LE(16, 16); cab.writeUInt16LE(1, 20); cab.writeUInt16LE(2, 22)
cab.writeUInt32LE(SR, 24); cab.writeUInt32LE(SR * 4, 28); cab.writeUInt16LE(4, 32); cab.writeUInt16LE(16, 34)
cab.write('data', 36); cab.writeUInt32LE(dados.length, 40)
mkdirSync('public', { recursive: true })
writeFileSync('public/trilha-cine.wav', Buffer.concat([cab, dados]))
console.log('public/trilha-cine.wav pronto,', DUR, 's,', BPM, 'BPM')
