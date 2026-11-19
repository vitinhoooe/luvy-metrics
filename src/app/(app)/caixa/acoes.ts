'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import { paraNumero } from '@/lib/formato'
import type { Estado } from '@/components/Enviar'

export async function abrirCaixa(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const { supabase, loja } = await exigirEdicao('pdv')
    const troco = paraNumero(fd.get('troco')) ?? 0
    if (troco < 0) return { erro: 'Troco inválido.' }
    const { error } = await supabase.from('caixas').insert({ loja_id: loja.id, troco_inicial: troco })
    if (error) return { erro: error.message.includes('caixa_aberto_uq') ? 'Já existe um caixa aberto.' : mensagemErro(error) }
    revalidatePath('/caixa')
    revalidatePath('/painel')
    return { ok: 'Caixa aberto. Boas vendas!' }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

export async function fecharCaixa(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const { supabase, loja } = await exigirEdicao('pdv')
    const id = String(fd.get('id') ?? '')
    const contado = paraNumero(fd.get('contado'))
    if (contado === null || contado < 0) return { erro: 'Informe quanto tem de dinheiro na gaveta.' }
    const { error } = await supabase
      .from('caixas')
      .update({ status: 'fechado', valor_contado: contado, observacao: String(fd.get('observacao') ?? '').slice(0, 200) || null, fechado_em: new Date().toISOString() })
      .eq('id', id)
      .eq('loja_id', loja.id)
      .eq('status', 'aberto')
    if (error) return { erro: mensagemErro(error) }
    revalidatePath('/caixa')
    revalidatePath('/painel')
    return { ok: 'Caixa fechado.' }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}
