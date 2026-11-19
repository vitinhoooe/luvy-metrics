'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import type { Lancamento } from '@/lib/extrato'

export type ResultadoConciliacao = {
  confirmados: { numero: number; cliente: string; valor: number }[]
  sem_pedido: { valor: number; data: string | null; descricao: string }[]
  repetidos: number
  falhas: { numero: number; motivo: string }[]
  pendentes: number
}

export async function conciliar(lancamentos: Lancamento[]): Promise<{ erro?: string; resultado?: ResultadoConciliacao }> {
  try {
    const { supabase } = await exigirEdicao('vitrine')
    const lista = (Array.isArray(lancamentos) ? lancamentos : []).slice(0, 3000).map((l) => ({
      chave: String(l.chave).slice(0, 120), valor: Number(l.valor), data: l.data, descricao: String(l.descricao ?? '').slice(0, 120),
    }))
    if (!lista.length) return { erro: 'Não achamos nenhum dinheiro recebido (crédito) nesse extrato.' }
    const { data, error } = await supabase.rpc('conciliar_pix', { p_lancamentos: lista })
    if (error) return { erro: mensagemErro(error) }
    revalidatePath('/pedidos')
    revalidatePath('/painel')
    return { resultado: data as ResultadoConciliacao }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}
