const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numFmt = new Intl.NumberFormat('pt-BR')

export const brl = (v: number | string | null | undefined) => brlFmt.format(Number(v ?? 0))
export const num = (v: number | string | null | undefined) => numFmt.format(Number(v ?? 0))

/**
 * Converte o que vier da planilha/formulário em número.
 * Aceita "R$ 1.234,56", "1234.56", "1,5", "10 un", 12.
 * Devolve null quando não dá para ter certeza.
 */
export function paraNumero(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  let s = String(v).trim()
  if (!s) return null
  s = s.replace(/[R$\s]|un(id(ade)?s?)?\.?|pçs?|pc/gi, '')
  if (!s) return null
  const temVirgula = s.includes(',')
  const temPonto = s.includes('.')
  if (temVirgula && temPonto) {
    // o último separador é o decimal
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (temVirgula) {
    s = s.replace(',', '.')
  } else if (temPonto && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '') // 1.234 = mil duzentos e trinta e quatro
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function slugify(t: string) {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}

/** Início do dia (ou do mês) no horário de Brasília, em ISO. Brasília é UTC-3 fixo. */
export function inicioDia(diasAtras = 0) {
  const ymd = new Date(Date.now() - 3 * 3600_000 - diasAtras * 86_400_000).toISOString().slice(0, 10)
  return new Date(`${ymd}T00:00:00-03:00`).toISOString()
}
export function inicioMes() {
  const ym = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 7)
  return new Date(`${ym}-01T00:00:00-03:00`).toISOString()
}

export const dataHora =(d: string | Date) =>
  new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

export const data = (d: string | Date) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })
