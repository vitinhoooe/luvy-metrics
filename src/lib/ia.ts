import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { CAMPOS, MAPA_VAZIO, type Campo, type Mapeamento } from './mapeamento'

// Modelos por tarefa (ver planos.ts para os limites de uso):
// - mapear planilha: roda pouco, errar custa caro → Opus 5.5
export const MODELO_MAPEAMENTO = 'claude-opus-5-5'

let cliente: Anthropic | null = null
const ia = () => (cliente ??= new Anthropic())

export const iaDisponivel = () => Boolean(process.env.ANTHROPIC_API_KEY)

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mapeamento', 'observacao'],
  properties: {
    mapeamento: {
      type: 'object',
      additionalProperties: false,
      required: CAMPOS.map((c) => c.id),
      properties: Object.fromEntries(
        CAMPOS.map((c) => [c.id, { anyOf: [{ type: 'integer' }, { type: 'null' }], description: c.nome }]),
      ),
    },
    observacao: { type: 'string', description: 'Uma frase curta em português para a lojista, ou vazio.' },
  },
} as const

/**
 * Pede ao Claude para ligar as colunas da planilha aos campos do Luvy.
 * Devolve null se a IA não estiver configurada ou falhar (aí vale o mapeamento automático).
 */
export async function mapearComIA(cabecalhos: string[], amostra: unknown[][]): Promise<{ mapa: Mapeamento; observacao: string } | null> {
  if (!iaDisponivel()) return null

  const colunas = cabecalhos.map((h, i) => ({
    indice: i,
    cabecalho: h || '(sem título)',
    exemplos: amostra.map((l) => l[i]).filter((v) => v !== null && v !== undefined && String(v).trim() !== '').slice(0, 6).map((v) => String(v).slice(0, 60)),
  }))

  try {
    const resp = await ia().messages.create({
      model: MODELO_MAPEAMENTO,
      max_tokens: 2000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system:
        'Você liga colunas de planilhas de estoque de lojas brasileiras de bem-estar íntimo aos campos de um sistema. ' +
        'Use o cabeçalho E os exemplos. Cada coluna só pode ir para um campo. Se nenhum coluna servir para um campo, use null. ' +
        'Custo é o preço de compra; preço é o preço de venda ao cliente (normalmente o maior dos dois). ' +
        'Código de barras tem 8 a 14 dígitos; códigos curtos ou com letras são código interno (sku). ' +
        'Nunca invente: na dúvida, null.',
      messages: [{ role: 'user', content: `Colunas da planilha (JSON):\n${JSON.stringify(colunas)}` }],
    })
    if (resp.stop_reason !== 'end_turn') return null
    const bloco = resp.content.find((b) => b.type === 'text')
    if (!bloco || bloco.type !== 'text') return null
    const json = JSON.parse(bloco.text) as { mapeamento: Record<string, number | null>; observacao: string }

    // valida: índices existentes e sem coluna repetida
    const mapa: Mapeamento = { ...MAPA_VAZIO }
    const usadas = new Set<number>()
    for (const c of CAMPOS) {
      const v = json.mapeamento[c.id]
      if (Number.isInteger(v) && v! >= 0 && v! < cabecalhos.length && !usadas.has(v!)) {
        mapa[c.id as Campo] = v!
        usadas.add(v!)
      }
    }
    return { mapa, observacao: (json.observacao ?? '').slice(0, 300) }
  } catch (e) {
    console.error('[ia] mapeamento falhou:', e instanceof Error ? e.message : e)
    return null
  }
}
