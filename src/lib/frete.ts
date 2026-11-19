// Frete da vitrine: mesma regra do banco (criar_pedido). Aqui é só para mostrar o valor na hora;
// o valor que vale é sempre o calculado no banco.

export type Regiao = 'N' | 'NE' | 'CO' | 'SE' | 'S'
export const REGIOES: { id: Regiao; nome: string; ufs: string }[] = [
  { id: 'NE', nome: 'Nordeste', ufs: 'AL BA CE MA PB PE PI RN SE' },
  { id: 'SE', nome: 'Sudeste', ufs: 'ES MG RJ SP' },
  { id: 'S', nome: 'Sul', ufs: 'PR RS SC' },
  { id: 'CO', nome: 'Centro-Oeste', ufs: 'DF GO MT MS' },
  { id: 'N', nome: 'Norte', ufs: 'AC AP AM PA RO RR TO' },
]
export type FreteRegioes = Partial<Record<Regiao, { valor: number; prazo?: string }>>

// faixas oficiais de CEP por estado
const FAIXAS: [number, number, string][] = [
  [1000000, 19999999, 'SP'], [20000000, 28999999, 'RJ'], [29000000, 29999999, 'ES'], [30000000, 39999999, 'MG'],
  [40000000, 48999999, 'BA'], [49000000, 49999999, 'SE'], [50000000, 56999999, 'PE'], [57000000, 57999999, 'AL'],
  [58000000, 58999999, 'PB'], [59000000, 59999999, 'RN'], [60000000, 63999999, 'CE'], [64000000, 64999999, 'PI'],
  [65000000, 65999999, 'MA'], [66000000, 68899999, 'PA'], [68900000, 68999999, 'AP'], [69000000, 69299999, 'AM'],
  [69300000, 69399999, 'RR'], [69400000, 69899999, 'AM'], [69900000, 69999999, 'AC'], [70000000, 72799999, 'DF'],
  [72800000, 72999999, 'GO'], [73000000, 73699999, 'DF'], [73700000, 76799999, 'GO'], [76800000, 76999999, 'RO'],
  [77000000, 77999999, 'TO'], [78000000, 78899999, 'MT'], [79000000, 79999999, 'MS'], [80000000, 87999999, 'PR'],
  [88000000, 89999999, 'SC'], [90000000, 99999999, 'RS'],
]

export function cepUf(cep: string) {
  const d = cep.replace(/\D/g, '')
  if (d.length !== 8) return null
  const n = Number(d)
  return FAIXAS.find(([a, b]) => n >= a && n <= b)?.[2] ?? null
}
export function ufRegiao(uf: string | null): Regiao | null {
  if (!uf) return null
  return REGIOES.find((r) => r.ufs.split(' ').includes(uf))?.id ?? null
}

/** Frete para o Brasil pela região do CEP. null = região não atendida ou CEP incompleto. */
export function freteBrasil(regioes: FreteRegioes, cep: string, subtotal: number, gratisAcima: number | null) {
  const uf = cepUf(cep)
  const reg = ufRegiao(uf)
  const r = reg ? regioes[reg] : undefined
  if (!uf || !reg) return { uf, regiao: reg, atende: false as const }
  if (!r || typeof r.valor !== 'number') return { uf, regiao: reg, atende: false as const }
  const gratis = gratisAcima != null && subtotal >= gratisAcima
  return { uf, regiao: reg, atende: true as const, valor: gratis ? 0 : r.valor, gratis, prazo: r.prazo ?? null }
}

export const formatarCep = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d }
