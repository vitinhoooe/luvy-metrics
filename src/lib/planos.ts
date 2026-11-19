// Fonte única da verdade: o que cada plano libera.
// Para mudar um plano, edite só este arquivo.

export type Plano = 'starter' | 'pro' | 'business'
export type Status = 'teste' | 'ativo' | 'atrasado' | 'cancelado'

export type Assinatura = {
  plano: Plano
  status: Status
  teste_ate: string
  pago_ate: string | null
}

export const PLANOS: Record<Plano, { nome: string; preco: string; periodo: string; nota?: string }> = {
  starter: { nome: 'Starter', preco: '97', periodo: '/mês' },
  // preço de lançamento: R$ 197 garantido por 12 meses para quem assinar no lançamento; depois, R$ 297.
  // quem assinar no lançamento mantém 197 por 12 meses (guardar a data da assinatura ao integrar o Asaas).
  pro: { nome: 'Pro', preco: '197', periodo: '/mês', nota: 'Preço de lançamento (depois R$ 297). Garantido por 12 meses para quem assinar agora.' },
  business: { nome: 'Business', preco: '1.970', periodo: '/ano', nota: 'Equivale a R$ 164 por mês' },
}

export const RECURSOS = {
  catalogo: ['starter', 'pro', 'business'],
  importar: ['starter', 'pro', 'business'],
  pdv: ['starter', 'pro', 'business'],
  calculadora: ['starter', 'pro', 'business'],
  radar: ['starter', 'pro', 'business'],
  espiao: ['starter', 'pro', 'business'],
  vitrine: ['pro', 'business'],
  atendenteIA: ['pro', 'business'],
  telegram: ['pro', 'business'],
  whatsappBeta: ['pro', 'business'],
  setupGuiado: ['business'],
} as const satisfies Record<string, readonly Plano[]>

export type Recurso = keyof typeof RECURSOS

// limites mensais de IA (calibrar com o custo real medido)
export const LIMITES: Record<Plano, { copiloto: number; atendente: number; importacoesIA: number }> = {
  starter: { copiloto: 50, atendente: 0, importacoesIA: 30 },
  pro: { copiloto: 300, atendente: 1500, importacoesIA: 60 },
  business: { copiloto: 600, atendente: 4000, importacoesIA: 120 },
}

const DIA = 86_400_000
const TOLERANCIA_ATRASO = 3 * DIA

/** Está em dia? (teste no prazo, ativo, ou atrasado dentro da tolerância) */
export function emDia(a: Assinatura, agora = Date.now()): boolean {
  if (a.status === 'teste') return new Date(a.teste_ate).getTime() > agora
  if (a.status === 'ativo') return true
  if (a.status === 'atrasado') {
    const base = a.pago_ate ? new Date(a.pago_ate).getTime() : agora
    return base + TOLERANCIA_ATRASO > agora
  }
  return false
}

export function pode(a: Assinatura, r: Recurso): boolean {
  return emDia(a) && (RECURSOS[r] as readonly string[]).includes(a.plano)
}

export function diasRestantesTeste(a: Assinatura, agora = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(a.teste_ate).getTime() - agora) / DIA))
}
