// Importação de vendas antigas (histórico): mapeia colunas, lê datas e valores.
import { paraNumero } from './formato'

export const CAMPOS_HIST = [
  { id: 'data', nome: 'Data da venda', obrigatorio: true },
  { id: 'produto', nome: 'Produto', obrigatorio: true },
  { id: 'quantidade', nome: 'Quantidade' },
  { id: 'valor', nome: 'Valor', obrigatorio: true },
  { id: 'codigo', nome: 'Código / EAN / SKU' },
] as const
export type CampoHist = (typeof CAMPOS_HIST)[number]['id']
export type MapaHist = Record<CampoHist, number | null>
export type LinhaHist = { data: string; produto: string; codigo: string | null; quantidade: number; valor: number }

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const REGRAS: [CampoHist, RegExp][] = [
  ['data', /\b(data|dia|emissao|emitido|criado|date)\b/],
  ['codigo', /\b(ean|gtin|barras?|sku|codigo|cod|ref|referencia)\b/],
  ['quantidade', /\b(qtd|qtde|quant|quantidade|unidades|un)\b/],
  ['valor', /\b(total|valor|preco|vlr|subtotal|venda)\b/],
  ['produto', /\b(produto|nome|descricao|desc|item|mercadoria|titulo)\b/],
]

export function mapearHistorico(cab: string[]): MapaHist {
  const m: MapaHist = { data: null, produto: null, quantidade: null, valor: null, codigo: null }
  const usadas = new Set<number>()
  for (const [campo, re] of REGRAS) {
    // "valor total" ganha de "preço unitário" quando os dois existem
    const candidatas = cab.map((h, i) => ({ h: norm(String(h ?? '')), i })).filter((x) => !usadas.has(x.i) && re.test(x.h))
    const escolha = campo === 'valor' ? candidatas.find((x) => /total/.test(x.h)) ?? candidatas[0] : candidatas[0]
    if (escolha) { m[campo] = escolha.i; usadas.add(escolha.i) }
  }
  return m
}

const p2 = (n: number) => String(n).padStart(2, '0')

/** Aceita Date, número de série do Excel, dd/mm/aaaa (com ou sem hora) e aaaa-mm-dd. Devolve AAAA-MM-DD ou null. */
export function lerData(v: unknown): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return `${v.getFullYear()}-${p2(v.getMonth() + 1)}-${p2(v.getDate())}`
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const d = new Date(Math.round((v - 25569) * 86400000))
    return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`
  }
  const s = String(v ?? '').trim()
  let r = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/)
  if (r) {
    const ano = r[3].length === 2 ? 2000 + Number(r[3]) : Number(r[3])
    const mes = Number(r[2]), dia = Number(r[1])
    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) return `${ano}-${p2(mes)}-${p2(dia)}`
  }
  r = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (r) return `${r[1]}-${r[2]}-${r[3]}`
  return null
}

/** Monta as linhas para o banco. valorEhUnitario: a coluna de valor é o preço de 1 unidade. */
export function montarHistorico(linhas: unknown[][], m: MapaHist, valorEhUnitario: boolean) {
  const boas: LinhaHist[] = []
  let ruins = 0
  for (const l of linhas) {
    const pega = (c: CampoHist) => (m[c] == null ? null : l[m[c]!])
    const data = lerData(pega('data'))
    const produto = String(pega('produto') ?? '').trim().slice(0, 160)
    const qtd = Math.round(paraNumero(pega('quantidade')) ?? 1)
    const v = paraNumero(pega('valor'))
    if (!data || !produto || !qtd || qtd <= 0 || v == null || v < 0) { ruins++; continue }
    const codigo = pega('codigo') == null ? null : String(pega('codigo')).trim().slice(0, 40) || null
    boas.push({ data, produto, codigo, quantidade: qtd, valor: Math.round((valorEhUnitario ? v * qtd : v) * 100) / 100 })
  }
  return { boas, ruins }
}
