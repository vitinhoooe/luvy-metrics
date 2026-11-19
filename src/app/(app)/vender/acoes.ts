'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import { CANAIS_PDV, FORMAS_PAGAMENTO } from '@/lib/constantes'

export type ItemCarrinho = { produto_id: string; quantidade: number; preco_unit: number }

export async function finalizarVenda(itens: ItemCarrinho[], forma: string, desconto: number, canal = 'balcao') {
  try {
    const { supabase } = await exigirEdicao('pdv')
    if (!FORMAS_PAGAMENTO.some((f) => f.id === forma)) return { erro: 'Escolha a forma de pagamento.' }
    if (!CANAIS_PDV.some((c) => c.id === canal)) return { erro: 'Escolha onde a venda aconteceu.' }
    const limpos = (Array.isArray(itens) ? itens : [])
      .filter((i) => typeof i.produto_id === 'string' && Number.isInteger(i.quantidade) && i.quantidade > 0 && Number(i.preco_unit) >= 0)
      .slice(0, 200)
      .map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade, preco_unit: Math.round(Number(i.preco_unit) * 100) / 100 }))
    if (!limpos.length) return { erro: 'Adicione pelo menos um produto.' }

    const { data, error } = await supabase.rpc('registrar_venda', {
      p_itens: limpos,
      p_forma: forma,
      p_desconto: Math.max(0, Number(desconto) || 0),
      p_canal: canal,
    })
    if (error) return { erro: mensagemErro(error) }
    const { data: venda } = await supabase.from('vendas').select('numero, total').eq('id', data).single()
    revalidatePath('/painel')
    revalidatePath('/caixa')
    revalidatePath('/vendas')
    return { ok: true as const, id: data as string, numero: venda?.numero as number, total: Number(venda?.total ?? 0) }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}
