// Lê o extrato do banco (OFX ou CSV) e devolve só os CRÉDITOS (dinheiro que entrou).
import { paraNumero } from './formato'

export type Lancamento = { chave: string; valor: number; data: string | null; descricao: string }

const tag = (bloco: string, nome: string) => {
  const m = bloco.match(new RegExp(`<${nome}>([^<\\r\\n]*)`, 'i'))
  return m ? m[1].trim() : ''
}

const dataOfx = (d: string) => (/^\d{8}/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : null)

/** OFX: padrão que quase todo banco exporta ("Exportar extrato" → OFX/Money). */
export function lerOFX(texto: string): Lancamento[] {
  const blocos = texto.split(/<STMTTRN>/i).slice(1)
  return blocos.flatMap((b) => {
    const valor = paraNumero(tag(b, 'TRNAMT').replace(',', '.'))
    if (valor === null || valor <= 0) return []
    const data = dataOfx(tag(b, 'DTPOSTED'))
    const descricao = [tag(b, 'NAME'), tag(b, 'MEMO')].filter(Boolean).join(' · ')
    const fitid = tag(b, 'FITID')
    return [{ chave: fitid ? `ofx:${fitid}` : `ofx:${data}:${valor}:${descricao}`, valor: Math.round(valor * 100) / 100, data, descricao }]
  })
}

function dataBr(s: string): string | null {
  const t = s.trim()
  let m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return null
}

function separar(linha: string, sep: string) {
  const out: string[] = []
  let atual = '', aspas = false
  for (const ch of linha) {
    if (ch === '"') aspas = !aspas
    else if (ch === sep && !aspas) { out.push(atual); atual = '' }
    else atual += ch
  }
  out.push(atual)
  return out.map((c) => c.trim())
}

/** CSV: procura as colunas de data, valor (ou crédito) e descrição pelo cabeçalho. */
export function lerCSV(texto: string): Lancamento[] {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim())
  if (linhas.length < 2) return []
  const sep = (linhas[0].match(/;/g)?.length ?? 0) >= (linhas[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const iCab = linhas.findIndex((l) => /data/i.test(l) && /(valor|cr[eé]dito|entrada|quantia)/i.test(l))
  if (iCab < 0) return []
  const cab = separar(linhas[iCab], sep).map((c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())
  const col = (re: RegExp) => cab.findIndex((c) => re.test(c))
  const cData = col(/data/)
  const cCred = col(/credito|entrada/)
  const cValor = col(/valor|quantia/)
  const cDesc = col(/descri|historico|lancamento|detalhe|memo/)
  const cId = col(/^id$|identificador|documento|codigo/)

  return linhas.slice(iCab + 1).flatMap((l) => {
    const c = separar(l, sep)
    const bruto = cCred >= 0 && c[cCred] ? c[cCred] : cValor >= 0 ? c[cValor] : ''
    const negativo = /^\s*-|\(.*\)|\bD\b/.test(bruto)
    const valor = paraNumero(bruto.replace(/[()]/g, '').replace(/^-/, '').replace(/\s*[CD]$/i, ''))
    if (valor === null || valor <= 0 || negativo) return []
    const data = cData >= 0 ? dataBr(c[cData] ?? '') : null
    const descricao = cDesc >= 0 ? (c[cDesc] ?? '') : ''
    const id = cId >= 0 ? c[cId] : ''
    return [{ chave: id ? `csv:${id}` : `csv:${data}:${valor}:${descricao}`, valor: Math.round(valor * 100) / 100, data, descricao }]
  })
}

export function lerExtrato(nome: string, texto: string): Lancamento[] {
  if (/\.ofx$/i.test(nome) || /<OFX>|<STMTTRN>/i.test(texto)) return lerOFX(texto)
  return lerCSV(texto)
}
