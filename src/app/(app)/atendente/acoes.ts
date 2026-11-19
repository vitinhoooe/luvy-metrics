'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import type { Estado } from '@/components/Enviar'

export async function salvarAtendente(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const { supabase, loja } = await exigirEdicao('atendenteIA')
    const nome = String(fd.get('atendente_nome') ?? '').trim().slice(0, 20) || 'Lia'
    const tom = String(fd.get('atendente_tom') ?? 'acolhedor')
    const { error } = await supabase.from('lojas').update({
      atendente_ativo: fd.get('atendente_ativo') === 'on',
      atendente_nome: nome,
      atendente_tom: ['acolhedor', 'divertido', 'elegante'].includes(tom) ? tom : 'acolhedor',
      atendente_info: String(fd.get('atendente_info') ?? '').trim().slice(0, 1500) || null,
    }).eq('id', loja.id)
    if (error) return { erro: mensagemErro(error) }
    revalidatePath('/atendente')
    revalidatePath(`/loja/${loja.slug}`)
    return { ok: fd.get('atendente_ativo') === 'on' ? `${nome} está atendendo na sua vitrine.` : 'Configurações salvas. O atendente está desligado.' }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}
