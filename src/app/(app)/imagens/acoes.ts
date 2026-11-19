'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import { apagarImagem, erroImagem, salvarImagem } from '@/lib/imagens'

type Resultado = { erro?: string; fotos?: string[]; url?: string | null }
const MAX_FOTOS = 4

async function fotosDo(supabase: Awaited<ReturnType<typeof exigirEdicao>>['supabase'], id: string) {
  const { data } = await supabase.from('produtos').select('id, fotos').eq('id', id).eq('ativo', true).maybeSingle()
  return data ? ((data.fotos ?? []) as string[]) : null
}
async function gravarFotos(supabase: Awaited<ReturnType<typeof exigirEdicao>>['supabase'], id: string, fotos: string[]) {
  const { error } = await supabase.from('produtos').update({ fotos, foto_url: fotos[0] ?? null, atualizado_em: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** Adiciona uma foto ao produto (até 4). A primeira é a capa do produto na vitrine. */
export async function enviarFotoProduto(fd: FormData): Promise<Resultado> {
  try {
    const { supabase, loja } = await exigirEdicao('catalogo')
    const id = String(fd.get('produto_id') ?? '')
    const arquivo = fd.get('arquivo')
    if (!(arquivo instanceof File) || !arquivo.size) return { erro: 'Escolha uma foto.' }
    const fotos = await fotosDo(supabase, id)
    if (!fotos) return { erro: 'Produto não encontrado.' }
    if (fotos.length >= MAX_FOTOS) return { erro: `Cada produto aceita até ${MAX_FOTOS} fotos. Apague uma para trocar.` }
    let url: string
    try { url = await salvarImagem(loja.id, 'produto', arquivo) } catch (e) { return { erro: erroImagem(e) } }
    const novas = [...fotos, url]
    await gravarFotos(supabase, id, novas)
    revalidatePath(`/produtos/${id}`)
    revalidatePath(`/loja/${loja.slug}`)
    return { fotos: novas }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

export async function apagarFotoProduto(id: string, url: string): Promise<Resultado> {
  try {
    const { supabase, loja } = await exigirEdicao('catalogo')
    const fotos = await fotosDo(supabase, id)
    if (!fotos) return { erro: 'Produto não encontrado.' }
    const novas = fotos.filter((f) => f !== url)
    await gravarFotos(supabase, id, novas)
    await apagarImagem(loja.id, url)
    revalidatePath(`/produtos/${id}`)
    revalidatePath(`/loja/${loja.slug}`)
    return { fotos: novas }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

/** Torna uma foto a principal (primeira) do produto. */
export async function fotoPrincipal(id: string, url: string): Promise<Resultado> {
  try {
    const { supabase, loja } = await exigirEdicao('catalogo')
    const fotos = await fotosDo(supabase, id)
    if (!fotos || !fotos.includes(url)) return { erro: 'Foto não encontrada.' }
    const novas = [url, ...fotos.filter((f) => f !== url)]
    await gravarFotos(supabase, id, novas)
    revalidatePath(`/loja/${loja.slug}`)
    return { fotos: novas }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

/** Logo ou foto de capa da vitrine (troca a anterior). */
export async function enviarMarca(fd: FormData): Promise<Resultado> {
  try {
    const { supabase, loja } = await exigirEdicao('vitrine')
    const tipo = fd.get('tipo') === 'capa' ? 'capa' : 'logo'
    const arquivo = fd.get('arquivo')
    if (!(arquivo instanceof File) || !arquivo.size) return { erro: 'Escolha uma imagem.' }
    const coluna = tipo === 'capa' ? 'vitrine_capa' : 'vitrine_logo'
    const { data: antes } = await supabase.from('lojas').select(coluna).eq('id', loja.id).single()
    let url: string
    try { url = await salvarImagem(loja.id, tipo, arquivo) } catch (e) { return { erro: erroImagem(e) } }
    const { error } = await supabase.from('lojas').update({ [coluna]: url }).eq('id', loja.id)
    if (error) return { erro: mensagemErro(error) }
    await apagarImagem(loja.id, (antes as Record<string, string | null> | null)?.[coluna])
    revalidatePath('/vitrine')
    revalidatePath(`/loja/${loja.slug}`)
    return { url }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

export async function removerMarca(tipo: 'logo' | 'capa'): Promise<Resultado> {
  try {
    const { supabase, loja } = await exigirEdicao('vitrine')
    const coluna = tipo === 'capa' ? 'vitrine_capa' : 'vitrine_logo'
    const { data: antes } = await supabase.from('lojas').select(coluna).eq('id', loja.id).single()
    await supabase.from('lojas').update({ [coluna]: null }).eq('id', loja.id)
    await apagarImagem(loja.id, (antes as Record<string, string | null> | null)?.[coluna])
    revalidatePath('/vitrine')
    revalidatePath(`/loja/${loja.slug}`)
    return { url: null }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}
