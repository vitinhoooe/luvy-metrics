'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import { paraNumero } from '@/lib/formato'
import { normalizarChave, type TipoChave } from '@/lib/pix'
import type { Estado } from '@/components/Enviar'
import { REGIOES, type FreteRegioes } from '@/lib/frete'

const CORES = ['rosa', 'vinho', 'violeta', 'noite', 'nude', 'esmeralda', 'coral', 'oceano']
const TIPOS: TipoChave[] = ['cpf', 'cnpj', 'celular', 'email', 'aleatoria']
// horas entre o mínimo e 30 dias; vazio ou inválido usa o padrão
const horas = (v: FormDataEntryValue | null, padrao: number, min: number) => {
  const n = Math.round(Number(String(v ?? '').replace(',', '.')))
  return Number.isFinite(n) && String(v ?? '').trim() !== '' ? Math.min(Math.max(n, min), 720) : padrao
}

export async function salvarVitrine(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const { supabase, loja } = await exigirEdicao('vitrine')
    const cor = String(fd.get('cor') ?? 'rosa')
    const chaveBruta = String(fd.get('pix_chave') ?? '').trim()
    const tipo = String(fd.get('pix_tipo') ?? 'celular') as TipoChave
    let pix_chave: string | null = null
    if (chaveBruta) {
      if (!TIPOS.includes(tipo)) return { erro: 'Escolha o tipo da chave Pix.' }
      pix_chave = normalizarChave(chaveBruta, tipo)
      if (!pix_chave) return { erro: 'A chave Pix não parece válida para o tipo escolhido.' }
    }
    const retirada = fd.get('entrega_retirada') === 'on'
    const local = fd.get('entrega_local') === 'on'
    const combinar = fd.get('entrega_combinar') === 'on'
    const brasil = fd.get('entrega_brasil') === 'on'
    if (!retirada && !local && !combinar && !brasil) return { erro: 'Deixe pelo menos uma forma de entrega ligada.' }
    const regioes: FreteRegioes = {}
    for (const r of REGIOES) {
      const v = paraNumero(fd.get(`frete_${r.id}`))
      if (v != null && v >= 0) regioes[r.id] = { valor: Math.round(v * 100) / 100, prazo: String(fd.get(`prazo_${r.id}`) ?? '').trim().slice(0, 40) || undefined }
    }
    if (brasil && !Object.keys(regioes).length) return { erro: 'Para enviar para o Brasil, informe o frete de pelo menos uma região.' }
    const gratis = paraNumero(fd.get('frete_gratis_acima'))
    const taxa = Math.max(0, paraNumero(fd.get('entrega_local_taxa')) ?? 0)

    const { error } = await supabase.from('lojas').update({
      vitrine_ativa: fd.get('vitrine_ativa') === 'on',
      vitrine_cor: CORES.includes(cor) ? cor : 'rosa',
      vitrine_descricao: String(fd.get('vitrine_descricao') ?? '').trim().slice(0, 140) || null,
      vitrine_instagram: String(fd.get('vitrine_instagram') ?? '').trim().replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, '').slice(0, 30) || null,
      vitrine_horario: String(fd.get('vitrine_horario') ?? '').trim().slice(0, 80) || null,
      vitrine_sobre: String(fd.get('vitrine_sobre') ?? '').trim().slice(0, 400) || null,
      pix_chave,
      pix_nome: String(fd.get('pix_nome') ?? '').trim().slice(0, 25) || null,
      entrega_retirada: retirada,
      endereco_retirada: String(fd.get('endereco_retirada') ?? '').trim().slice(0, 160) || null,
      entrega_local: local,
      entrega_local_taxa: Math.round(taxa * 100) / 100,
      entrega_combinar: combinar,
      entrega_brasil: brasil,
      ...(brasil ? { frete_regioes: regioes } : {}),
      frete_gratis_acima: gratis && gratis > 0 ? Math.round(gratis * 100) / 100 : null,
      prazo_retirada: String(fd.get('prazo_retirada') ?? '').trim().slice(0, 60) || null,
      prazo_local: String(fd.get('prazo_local') ?? '').trim().slice(0, 60) || null,
      prazo_pagamento_h: horas(fd.get('prazo_pagamento_h'), 2, 1),
      prazo_separar_h: horas(fd.get('prazo_separar_h'), 24, 1),
      prazo_entrega_h: horas(fd.get('prazo_entrega_h'), 72, 1),
      cancelar_apos_h: horas(fd.get('cancelar_apos_h'), 24, 0),
    }).eq('id', loja.id)
    if (error) return { erro: mensagemErro(error) }
    revalidatePath('/vitrine')
    revalidatePath(`/loja/${loja.slug}`)
    return { ok: fd.get('vitrine_ativa') === 'on' ? 'Vitrine salva e no ar.' : 'Configurações salvas. A vitrine está desligada.' }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}
