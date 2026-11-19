import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emDia, pode, type Assinatura, type Recurso } from '@/lib/planos'

export type Loja = {
  id: string
  nome: string
  slug: string
  cidade: string
  uf: string
  categorias: string[]
  whatsapp: string | null
}

/** Usuária + loja + assinatura da requisição atual (memorizado por requisição). */
export const contexto = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, loja: null, assinatura: null } as const

  const { data: loja } = await supabase
    .from('lojas')
    .select('id, nome, slug, cidade, uf, categorias, whatsapp')
    .eq('dono', user.id)
    .maybeSingle<Loja>()

  let assinatura: Assinatura | null = null
  if (loja) {
    const { data } = await supabase
      .from('assinaturas')
      .select('plano, status, teste_ate, pago_ate')
      .eq('loja_id', loja.id)
      .maybeSingle<Assinatura>()
    assinatura = data
  }
  return { supabase, user, loja, assinatura } as const
})

/** Para páginas do app: exige login e loja criada. */
export async function exigirLoja() {
  const c = await contexto()
  if (!c.user) redirect('/entrar')
  if (!c.loja || !c.assinatura) redirect('/comecar')
  return { ...c, user: c.user, loja: c.loja, assinatura: c.assinatura, podeEditar: emDia(c.assinatura) }
}

/** Para Server Actions que alteram dados: exige plano em dia (e o recurso, se informado). */
export async function exigirEdicao(recurso?: Recurso) {
  const c = await contexto()
  if (!c.user || !c.loja || !c.assinatura) throw new Error('Faça login novamente.')
  if (!emDia(c.assinatura)) throw new Error('Seu teste ou plano acabou. Escolha um plano para continuar editando.')
  if (recurso && !pode(c.assinatura, recurso)) throw new Error('Este recurso não está no seu plano.')
  return { ...c, user: c.user, loja: c.loja, assinatura: c.assinatura }
}

/** Traduz os erros das funções do banco para mensagens humanas. */
export function mensagemErro(e: unknown): string {
  const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e)
  if (m.includes('ESTOQUE_INSUFICIENTE')) return `Estoque insuficiente: ${m.split('ESTOQUE_INSUFICIENTE:')[1] ?? ''}`.trim()
  if (m.includes('SEM_ACESSO') || m.includes('row-level security')) return 'Seu teste ou plano acabou. Escolha um plano para continuar editando.'
  if (m.includes('PRODUTO_NAO_ENCONTRADO')) return 'Produto não encontrado.'
  if (m.includes('VENDA_VAZIA')) return 'Adicione pelo menos um produto.'
  if (m.includes('LIMITE_5000_LINHAS')) return 'A planilha passa de 5.000 linhas. Divida em partes.'
  if (m.includes('produtos_codigo_uq')) return 'Já existe um produto com esse código de barras.'
  if (m.includes('lojas_slug_key')) return 'Esse endereço de loja já está em uso. Escolha outro.'
  return m || 'Algo deu errado. Tente de novo.'
}
