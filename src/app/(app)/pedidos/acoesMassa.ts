'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'

export type ResultadoMassa = { ok: number; falhas: string[]; erro?: string }

/** Muda vários pedidos de uma vez. Cada pedido segue as mesmas regras do botão individual. */
export async function acaoEmMassa(ids: string[], acao: 'confirmar' | 'avancar' | 'cancelar'): Promise<ResultadoMassa> {
  try {
    const { supabase, loja } = await exigirEdicao('vitrine')
    const lista = (Array.isArray(ids) ? ids : []).filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 300)
    if (!lista.length) return { ok: 0, falhas: [], erro: 'Selecione pelo menos um pedido.' }
    const { data: pedidos } = await supabase.from('pedidos').select('id, numero, status, entrega').in('id', lista).eq('loja_id', loja.id)
    let ok = 0
    const falhas: string[] = []

    for (const p of pedidos ?? []) {
      let error: { message: string } | null = null
      if (acao === 'confirmar') {
        if (p.status !== 'novo') continue
        ;({ error } = await supabase.rpc('confirmar_pedido', { p_pedido: p.id }))
      } else if (acao === 'cancelar') {
        if (p.status === 'cancelado' || p.status === 'entregue') continue
        ;({ error } = await supabase.rpc('cancelar_pedido', { p_pedido: p.id }))
      } else {
        const prox = p.status === 'pago' ? 'separado'
          : p.status === 'separado' ? (p.entrega === 'retirada' ? 'entregue' : 'enviado')
          : p.status === 'enviado' ? 'entregue' : null
        if (!prox) continue
        ;({ error } = await supabase.from('pedidos').update({ status: prox, atualizado_em: new Date().toISOString() }).eq('id', p.id).eq('loja_id', loja.id))
      }
      if (error) falhas.push(`#${p.numero}: ${mensagemErro(error)}`)
      else ok++
    }
    revalidatePath('/pedidos')
    revalidatePath('/painel')
    return { ok, falhas }
  } catch (e) {
    return { ok: 0, falhas: [], erro: mensagemErro(e) }
  }
}

/**
 * Cola vários rastreios de uma vez, um por linha: "número do pedido  código".
 * Ex.: "42 AB123456789BR". Os pedidos separados com rastreio passam para "a caminho".
 */
export async function rastreiosEmMassa(texto: string): Promise<ResultadoMassa> {
  try {
    const { supabase, loja } = await exigirEdicao('vitrine')
    const pares = String(texto ?? '').split(/\r?\n/).map((l) => l.trim().match(/^#?(\d+)[\s;,:\t-]+([A-Za-z0-9]{6,40})$/)).filter(Boolean) as RegExpMatchArray[]
    if (!pares.length) return { ok: 0, falhas: [], erro: 'Use uma linha por pedido: número e código. Ex.: 42 AB123456789BR' }
    let ok = 0
    const falhas: string[] = []
    for (const [, numero, codigo] of pares.slice(0, 300)) {
      const { data: pe } = await supabase.from('pedidos').select('id, status').eq('loja_id', loja.id).eq('numero', Number(numero)).maybeSingle()
      if (!pe) { falhas.push(`#${numero}: pedido não encontrado`); continue }
      if (!['separado', 'enviado', 'pago'].includes(pe.status)) { falhas.push(`#${numero}: está "${pe.status}"`); continue }
      const { error } = await supabase.from('pedidos')
        .update({ codigo_rastreio: codigo.toUpperCase(), status: 'enviado', atualizado_em: new Date().toISOString() })
        .eq('id', pe.id).eq('loja_id', loja.id)
      if (error) falhas.push(`#${numero}: ${mensagemErro(error)}`)
      else ok++
    }
    revalidatePath('/pedidos')
    return { ok, falhas }
  } catch (e) {
    return { ok: 0, falhas: [], erro: mensagemErro(e) }
  }
}
