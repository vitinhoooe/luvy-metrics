'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'

/** Coloca (ou tira) produtos em promoção na vitrine. pct = 0 tira a promoção. */
export async function promocao(ids: string[], pct: number): Promise<{ ok?: string; erro?: string }> {
  try {
    const { supabase, loja } = await exigirEdicao('catalogo')
    const lista = (Array.isArray(ids) ? ids : []).filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 500)
    if (!lista.length) return { erro: 'Selecione pelo menos um produto.' }
    const p = Number(pct)
    if (!(p === 0 || (p >= 5 && p <= 70))) return { erro: 'Desconto entre 5% e 70%.' }

    if (p === 0) {
      const { error } = await supabase.from('produtos').update({ preco_promocional: null }).in('id', lista).eq('loja_id', loja.id)
      if (error) return { erro: mensagemErro(error) }
      revalidatePath('/repor'); revalidatePath(`/loja/${loja.slug}`)
      return { ok: `Promoção retirada de ${lista.length} produtos.` }
    }

    const { data: prods } = await supabase.from('produtos').select('id, preco').in('id', lista).eq('loja_id', loja.id)
    let ok = 0
    for (const pr of prods ?? []) {
      const promo = Math.floor(Number(pr.preco) * (1 - p / 100) * 10) / 10 - 0.01 // termina em ,x9
      if (!(promo > 0 && promo < Number(pr.preco))) continue
      const { error } = await supabase.from('produtos').update({ preco_promocional: Math.round(promo * 100) / 100 }).eq('id', pr.id).eq('loja_id', loja.id)
      if (!error) ok++
    }
    revalidatePath('/repor'); revalidatePath(`/loja/${loja.slug}`)
    return { ok: `${ok} produtos em promoção na vitrine com ~${p}% de desconto. A vitrine já mostra "de/por".` }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}
