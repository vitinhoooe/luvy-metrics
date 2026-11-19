// Sistema visual do vídeo de produto. Toda decisão de design mora aqui:
// mudar ritmo, cor ou curva = mudar um número.
import { loadFont } from '@remotion/google-fonts/Sora'
import { Easing } from 'remotion'

export const { fontFamily } = loadFont('normal', { weights: ['400', '500', '700', '800'], subsets: ['latin', 'latin-ext'] })

// ---------- RITMO ----------
// trilha a 120 BPM: 1 batida = 0,5 s = 15 quadros; 1 compasso = 60 quadros.
export const FPS = 30
export const BATIDA = 15
export const COMPASSO = BATIDA * 4
export const b = (batidas: number) => Math.round(batidas * BATIDA) // batidas -> quadros

// ---------- CENAS (em compassos de 2 s) ----------
// cada corte cai num compasso cheio, junto com o impacto da trilha
export const CENAS = {
  abertura: { de: 0, ate: b(8) },        // 0–4 s
  pedido: { de: b(8), ate: b(20) },      // 4–10 s
  balcao: { de: b(20), ate: b(32) },     // 10–16 s
  pix: { de: b(32), ate: b(44) },        // 16–22 s
  repor: { de: b(44), ate: b(56) },      // 22–28 s
  comeco: { de: b(56), ate: b(68) },     // 28–34 s
  mural: { de: b(68), ate: b(88) },      // 34–44 s (último compasso devolve à abertura: loop)
} as const
export const DURACAO = b(88) // 1320 quadros = 44 s

// ---------- PALETA ----------
// fundo quase preto puxado para o vinho; um acento por cena, nunca todos juntos.
export const COR = {
  fundo: '#0b0710',
  fundo2: '#170c1d',
  tinta: '#f7eff5',
  apagado: 'rgba(247,239,245,.56)',
  rosa: '#ff5fa2',
  magenta: '#d63ca0',
  violeta: '#7d52ff',
  ok: '#3ddc97',
  grad: 'linear-gradient(100deg, #ff7ab6 0%, #e0479f 45%, #8a5cff 100%)',
}

// ---------- CURVAS ----------
// entrada: expo-out (chega rápido, assenta devagar) · saída: expo-in · câmera: in-out suave
export const EASE = {
  entra: Easing.bezier(0.16, 1, 0.3, 1),
  sai: Easing.bezier(0.7, 0, 0.84, 0),
  camera: Easing.bezier(0.65, 0, 0.35, 1),
  mola: Easing.bezier(0.34, 1.56, 0.64, 1), // leve passada do ponto (pop)
}

// ---------- GRADE ----------
// 1920x1080, margens de 140 px, 12 colunas; texto ocupa as colunas 1–5.
export const GRADE = { margem: 140, coluna: (1920 - 280 - 11 * 24) / 12, calha: 24 }
export const colunaX = (n: number) => GRADE.margem + (n - 1) * (GRADE.coluna + GRADE.calha)

// ---------- TIPOGRAFIA ----------
export const TIPO = {
  titulo: { fontFamily, fontWeight: 800, fontSize: 86, lineHeight: 1, letterSpacing: '-0.05em' } as const,
  apoio: { fontFamily, fontWeight: 500, fontSize: 40, lineHeight: 1.25, letterSpacing: '-0.015em' } as const,
  rotulo: { fontFamily, fontWeight: 700, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase' } as const,
}

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
