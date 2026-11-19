// Campos do Luvy que uma planilha pode preencher + mapeamento automático por nome de coluna.
import { paraNumero } from './formato'

export const CAMPOS = [
  { id: 'nome', nome: 'Nome do produto', obrigatorio: true },
  { id: 'quantidade', nome: 'Quantidade em estoque' },
  { id: 'custo', nome: 'Custo (preço de compra)' },
  { id: 'preco', nome: 'Preço de venda' },
  { id: 'categoria', nome: 'Categoria' },
  { id: 'codigo_barras', nome: 'Código de barras (EAN)' },
  { id: 'sku', nome: 'Código interno / referência' },
  { id: 'fornecedor', nome: 'Fornecedor / marca' },
  { id: 'estoque_minimo', nome: 'Estoque mínimo' },
] as const

export type Campo = (typeof CAMPOS)[number]['id']
export type Mapeamento = Record<Campo, number | null>

export const MAPA_VAZIO: Mapeamento = {
  nome: null, quantidade: null, custo: null, preco: null, categoria: null,
  codigo_barras: null, sku: null, fornecedor: null, estoque_minimo: null,
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// ordem importa: os mais específicos primeiro
const REGRAS: [Campo, RegExp][] = [
  ['codigo_barras', /\b(ean|gtin|barras?|barcode|cod barra)\b/],
  ['estoque_minimo', /\b(minimo|min|estoque min)\b/],
  ['custo', /\b(custo|compra|pago|valor compra|preco compra|pc)\b/],
  ['preco', /\b(venda|preco|valor|pv|pvp|varejo)\b/],
  ['quantidade', /\b(qtd|qtde|quant|quantidade|estoque|saldo|unidades|un|disponivel)\b/],
  ['nome', /\b(produto|nome|descricao|desc|item|mercadoria|titulo)\b/],
  ['categoria', /\b(categoria|grupo|departamento|depto|tipo|linha|secao)\b/],
  ['fornecedor', /\b(fornecedor|marca|fabricante|distribuidor)\b/],
  ['sku', /\b(sku|codigo|cod|ref|referencia|id)\b/],
]

export function mapearPorNome(cabecalhos: string[]): Mapeamento {
  const mapa: Mapeamento = { ...MAPA_VAZIO }
  const usadas = new Set<number>()
  for (const [campo, re] of REGRAS) {
    if (mapa[campo] !== null) continue
    const i = cabecalhos.findIndex((h, idx) => !usadas.has(idx) && re.test(norm(h)))
    if (i >= 0) {
      mapa[campo] = i
      usadas.add(i)
    }
  }
  return mapa
}

/** Acha a linha de cabeçalho: a primeira com pelo menos 2 textos não numéricos. */
export function acharCabecalho(linhas: unknown[][]): number {
  for (let i = 0; i < Math.min(linhas.length, 15); i++) {
    const textos = (linhas[i] ?? []).filter((c) => typeof c === 'string' && c.trim() && paraNumero(c) === null)
    if (textos.length >= 2) return i
  }
  return 0
}

export type LinhaImport = {
  nome: string
  categoria: string | null
  codigo_barras: string | null
  sku: string | null
  fornecedor: string | null
  custo: number | null
  preco: number | null
  quantidade: number
  estoque_minimo: number | null
}

export type Problema = { linha: number; motivo: string }

const txt = (v: unknown, max: number) => {
  if (v === null || v === undefined) return null
  const s = String(v).replace(/\s+/g, ' ').trim().slice(0, max)
  return s || null
}

/** Converte as linhas brutas usando o mapeamento. Junta duplicadas do próprio arquivo (soma a quantidade). */
export function montarLinhas(dados: unknown[][], mapa: Mapeamento) {
  const ok: LinhaImport[] = []
  const problemas: Problema[] = []
  const indice = new Map<string, number>()
  let juntadas = 0

  dados.forEach((l, i) => {
    const pega = (c: Campo) => (mapa[c] === null ? null : l[mapa[c]!])
    const nome = txt(pega('nome'), 160)
    const vazia = l.every((c) => c === null || c === undefined || String(c).trim() === '')
    if (vazia) return
    if (!nome) {
      problemas.push({ linha: i + 1, motivo: 'sem nome do produto' })
      return
    }
    // código de barras: só dígitos (Excel às vezes converte em número)
    let cod = txt(pega('codigo_barras'), 40)
    if (cod) cod = cod.replace(/\.0+$/, '').replace(/\s/g, '')
    if (cod && !/^\d{6,14}$/.test(cod)) cod = null

    const qRaw = pega('quantidade')
    const q = paraNumero(qRaw)
    if (qRaw !== null && qRaw !== undefined && String(qRaw).trim() !== '' && q === null) {
      problemas.push({ linha: i + 1, motivo: `quantidade não é número (“${String(qRaw).slice(0, 20)}”)` })
      return
    }
    const custo = paraNumero(pega('custo'))
    const preco = paraNumero(pega('preco'))
    if ((custo !== null && custo < 0) || (preco !== null && preco < 0)) {
      problemas.push({ linha: i + 1, motivo: 'valor negativo' })
      return
    }
    const min = paraNumero(pega('estoque_minimo'))

    const linha: LinhaImport = {
      nome,
      categoria: txt(pega('categoria'), 60),
      codigo_barras: cod,
      sku: txt(pega('sku'), 40),
      fornecedor: txt(pega('fornecedor'), 80),
      custo: custo === null ? null : Math.round(custo * 100) / 100,
      preco: preco === null ? null : Math.round(preco * 100) / 100,
      quantidade: Math.max(0, Math.round(q ?? 0)),
      estoque_minimo: min === null ? null : Math.max(0, Math.round(min)),
    }
    const chave = cod ?? norm(nome)
    const ja = indice.get(chave)
    if (ja !== undefined) {
      ok[ja].quantidade += linha.quantidade
      juntadas++
      return
    }
    indice.set(chave, ok.length)
    ok.push(linha)
  })
  return { ok, problemas, juntadas }
}
