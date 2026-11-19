'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import { brl } from '@/lib/formato'

export async function aplicarPreco(id: string, preco: number): Promise<{ erro?: string; ok?: string }> {
  try {
    const { supabase, loja } = await exigirEdicao('calculadora')
    const v = Math.round(Number(preco) * 100) / 100
    if (!Number.isFinite(v) || v <= 0 || v > 1_000_000) return { erro: 'Preço inválido.' }
    const { error } = await supabase.from('produtos').update({ preco: v, atualizado_em: new Date().toISOString() }).eq('id', id).eq('loja_id', loja.id)
    if (error) return { erro: mensagemErro(error) }
    revalidatePath('/produtos')
    revalidatePath('/calculadora')
    return { ok: `Preço atualizado para ${brl(v)}.` }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}
