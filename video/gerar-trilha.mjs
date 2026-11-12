// Gera a trilha de fundo (original, sintetizada aqui) em public/trilha.wav.
// Lo-fi calmo a 96 BPM: bumbo, palma, chimbal, baixo e acordes suaves. 72 s, 44,1 kHz, estéreo.
// Uso: node gerar-trilha.mjs
import { writeFileSync, mkdirSync } from 'node:fs'

const SR = 44100, BPM = 96, DUR = 72
const N = SR * DUR
const L = new Float32Array(N), R = new Float32Array(N)
const beat = 60 / BPM, bar = beat * 4
const midi = m => 440 * Math.pow(2, (m - 69) / 12)

// pseudo-aleatório fixo (a trilha sai sempre igual)
let s = 12345
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1

function add(t0, dur, fn, gl = 1, gr = 1) {
  const i0 = Math.floor(t0 * SR), n = Math.floor(dur * SR)
  for (let i = 0; i < n && i0 + i < N; i++) {
    const v = fn(i / SR)
    L[i0 + i] += v * gl; R[i0 + i] += v * gr
  }
}
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d))

// acordes: Am7, Fmaj7, Cmaj7, G6 (uma por compasso)
const ACORDES = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 64]]
const BAIXO = [45, 41, 48, 43]

const compassos = Math.ceil(DUR / bar)
for (let c = 0; c < compassos; c++) {
  const t = c * bar
  const ac = ACORDES[c % 4]
  // pad: ondas suaves com leve desafinação, ataque lento
  ac.forEach((m, k) => {
    const f = midi(m + 12)
    add(t, bar + 0.4, x => {
      const e = Math.min(1, x / 0.6) * Math.min(1, (bar + 0.4 - x) / 0.5)
      return e * 0.035 * (Math.sin(2 * Math.PI * f * x) + 0.4 * Math.sin(2 * Math.PI * f * 1.003 * x) + 0.15 * Math.sin(4 * Math.PI * f * x))
    }, k % 2 ? 0.7 : 1, k % 2 ? 1 : 0.7)
  })
  // piano elétrico: notas do acorde em arpejo no tempo 1 e 3
  ;[0, 2].forEach(b => ac.forEach((m, k) => {
    const f = midi(m + 12)
    add(t + b * beat + k * 0.06, 1.6, x => env(x, 0.005, 0.5) * 0.045 * Math.sin(2 * Math.PI * f * x) * (1 + 0.3 * Math.sin(2 * Math.PI * 5 * x)))
  }))
  for (let b = 0; b < 4; b++) {
    const tb = t + b * beat
    // bumbo nos tempos 1 e 3 (e um contratempo no 4 de vez em quando)
    if (b === 0 || b === 2 || (b === 3 && c % 2)) {
      const off = b === 3 ? beat / 2 : 0
      add(tb + off, 0.35, x => env(x, 0.002, 0.09) * 0.55 * Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-x * 30)) * x))
    }
    // palma suave nos tempos 2 e 4
    if (b === 1 || b === 3) add(tb, 0.25, x => env(x, 0.003, 0.05) * 0.16 * rnd(), 0.9, 1)
    // baixo
    if (b === 0 || b === 2) {
      const f = midi(BAIXO[c % 4])
      add(tb, beat * 1.8, x => env(x, 0.01, 0.6) * 0.22 * Math.tanh(1.5 * Math.sin(2 * Math.PI * f * x)))
    }
    // chimbal em colcheias, com swing
    for (let h = 0; h < 2; h++) {
      const th = tb + h * beat / 2 + (h ? 0.04 : 0)
      add(th, 0.06, x => env(x, 0.001, 0.015) * 0.06 * rnd(), h ? 1 : 0.8, h ? 0.8 : 1)
    }
  }
}

// filtro passa-baixa leve (som de lo-fi), fade de entrada e saída, normalização
const lp = (buf, a) => { let y = 0; for (let i = 0; i < N; i++) { y += a * (buf[i] - y); buf[i] = y } }
lp(L, 0.35); lp(R, 0.35)
let pico = 0
for (let i = 0; i < N; i++) {
  const t = i / SR
  const f = Math.min(1, t / 2) * Math.min(1, (DUR - t) / 3)
  L[i] *= f; R[i] *= f
  pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]))
}
const ganho = 0.89 / pico

// grava WAV 16 bits
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
writeFileSync('public/trilha.wav', Buffer.concat([cab, dados]))
console.log('public/trilha.wav pronto,', DUR, 's')
