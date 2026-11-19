'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import { paraNumero } from '@/lib/formato'
import type { Estado } from '@/components/Enviar'

const texto = (fd: FormData, k: string, max = 160) => {
  const v = String(fd.get(k) ?? '').trim().slice(0, max)
  return v || null
}

export async function salvarProduto(_: Estado, fd: FormData): Promise<Estado> {
  let novoId: string | null = null
  try {
    const { supabase, loja } = await exigirEdicao('catalogo')
    const id = texto(fd, 'id', 40)
    const nome = texto(fd, 'nome')
    if (!nome) return { erro: 'Informe o nome do produto.' }

    const custo = paraNumero(fd.get('custo')) ?? 0
    const preco = paraNumero(fd.get('preco')) ?? 0
    const estoque_minimo = Math.max(0, Math.round(paraNumero(fd.get('estoque_minimo')) ?? 2))
    if (custo < 0 || preco < 0) return { erro: 'Custo e preço não podem ser negativos.' }

    const dados = {
      nome,
      categoria: texto(fd, 'categoria', 60),
      codigo_barras: texto(fd, 'codigo_barras', 40),
      sku: texto(fd, 'sku', 40),
      fornecedor: texto(fd, 'fornecedor', 80),
      custo,
      preco,
      estoque_minimo,
      na_vitrine: fd.get('na_vitrine') === 'on',
      destaque: fd.get('destaque') === 'on',
      descricao: String(fd.get('descricao') ?? '').trim().slice(0, 1000) || null,
      atualizado_em: new Date().toISOString(),
    }

    if (id) {
      let { error } = await supabase.from('produtos').update(dados).eq('id', id).eq('loja_id', loja.id)
      // preço novo menor que a promoção da vitrine: a promoção deixa de fazer sentido
      if (error?.message.includes('produtos_promo_chk')) {
        ;({ error } = await supabase.from('produtos').update({ ...dados, preco_promocional: null }).eq('id', id).eq('loja_id', loja.id))
      }
      if (error) return { erro: mensagemErro(error) }
    } else {
      const quantidade = Math.max(0, Math.round(paraNumero(fd.get('quantidade')) ?? 0))
      const { data, error } = await supabase.from('produtos').insert({ ...dados, loja_id: loja.id, quantidade: 0 }).select('id').single()
      if (error) return { erro: mensagemErro(error) }
      novoId = data.id
      if (quantidade > 0) {
        const { error: e2 } = await supabase.rpc('movimentar_estoque', { p_produto: data.id, p_qtd: quantidade, p_tipo: 'entrada', p_motivo: 'Estoque inicial' })
        if (e2) return { erro: mensagemErro(e2) }
      }
    }
    revalidatePath('/produtos')
    if (!novoId) return { ok: 'Produto salvo.' }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
  redirect(fd.get('outro') === '1' ? '/produtos/novo?salvo=1' : `/produtos/${novoId}?novo=1`)
}

export async function movimentar(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const { supabase } = await exigirEdicao('catalogo')
    const id = String(fd.get('id') ?? '')
    const tipo = String(fd.get('tipo') ?? '')
    const qtd = Math.round(paraNumero(fd.get('quantidade')) ?? NaN)
    const atual = Number(fd.get('atual') ?? 0)
    const motivo = texto(fd, 'motivo', 120)
    if (!Number.isFinite(qtd) || qtd < 0) return { erro: 'Informe uma quantidade válida.' }

    let delta = 0
    if (tipo === 'entrada') delta = qtd
    else if (tipo === 'saida') delta = -qtd
    else if (tipo === 'ajuste') delta = qtd - atual // contagem: informa o total real
    else return { erro: 'Escolha o tipo.' }
    if (delta === 0) return { erro: 'Nada para alterar.' }
    if (atual + delta < 0) return { erro: `Só há ${atual} em estoque.` }

    const { error } = await supabase.rpc('movimentar_estoque', { p_produto: id, p_qtd: delta, p_tipo: tipo, p_motivo: motivo })
    if (error) return { erro: mensagemErro(error) }
    revalidatePath(`/produtos/${id}`)
    revalidatePath('/produtos')
    return { ok: tipo === 'ajuste' ? `Estoque corrigido para ${qtd}.` : `${tipo === 'entrada' ? 'Entrada' : 'Saída'} de ${qtd} registrada.` }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

export async function arquivarProduto(fd: FormData) {
  const { supabase, loja } = await exigirEdicao('catalogo')
  const id = String(fd.get('id') ?? '')
  // não apaga: some do catálogo e do PDV, mas o histórico de vendas fica
  await supabase.from('produtos').update({ ativo: false, codigo_barras: null }).eq('id', id).eq('loja_id', loja.id)
  revalidatePath('/produtos')
  redirect('/produtos')
}
