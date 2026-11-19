'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import { paraNumero } from '@/lib/formato'
import { FORNECEDORES } from '@/lib/fornecedores'
import type { Estado } from '@/components/Enviar'

const texto = (fd: FormData, k: string, max = 120) => {
  const v = String(fd.get(k) ?? '').trim().slice(0, max)
  return v || null
}
const inteiro = (fd: FormData, k: string, min: number, max: number) => {
  const n = paraNumero(fd.get(k))
  return n == null ? null : Math.min(max, Math.max(min, Math.round(n)))
}

export async function salvarFornecedor(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const { supabase, loja } = await exigirEdicao('catalogo')
    const id = texto(fd, 'id', 40)
    const nome = texto(fd, 'nome', 80)
    if (!nome) return { erro: 'Informe o nome do fornecedor.' }
    let whatsapp = String(fd.get('whatsapp') ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
    if (whatsapp && !/^\d{10,11}$/.test(whatsapp)) return { erro: 'WhatsApp com DDD, por exemplo (81) 99999-9999.' }
    const email = texto(fd, 'email', 120)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: 'E-mail inválido.' }
    const minimo = paraNumero(fd.get('pedido_minimo'))
    const ultimo = texto(fd, 'ultimo_pedido', 10)

    const dados = {
      nome,
      contato: texto(fd, 'contato', 80),
      whatsapp: whatsapp || null,
      email,
      site: texto(fd, 'site', 200),
      cidade: texto(fd, 'cidade', 80),
      prazo_dias: inteiro(fd, 'prazo_dias', 0, 120),
      pedido_minimo: minimo == null ? null : Math.max(0, minimo),
      pagamento: texto(fd, 'pagamento', 120),
      nota: inteiro(fd, 'nota', 1, 5),
      obs: texto(fd, 'obs', 1000),
      ultimo_pedido: ultimo && /^\d{4}-\d{2}-\d{2}$/.test(ultimo) ? ultimo : null,
      atualizado_em: new Date().toISOString(),
    }
    const { error } = id
      ? await supabase.from('fornecedores').update(dados).eq('id', id).eq('loja_id', loja.id)
      : await supabase.from('fornecedores').insert({ ...dados, loja_id: loja.id })
    if (error) return { erro: error.message.includes('fornecedores_loja_nome_uq') ? 'Você já tem um fornecedor com esse nome.' : mensagemErro(error) }
    revalidatePath('/fornecedores')
    return { ok: id ? 'Fornecedor atualizado.' : 'Fornecedor salvo.' }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

export async function salvarDoDiretorio(fd: FormData) {
  const { supabase, loja } = await exigirEdicao('catalogo')
  const f = FORNECEDORES.find((x) => x.id === String(fd.get('diretorio_id') ?? ''))
  if (!f) return
  // se já existe com esse nome, não duplica (índice único por nome)
  await supabase.from('fornecedores').insert({
    loja_id: loja.id, nome: f.nome, whatsapp: f.whatsapp, email: f.email, site: f.site,
    cidade: f.cidade ? `${f.cidade}/${f.uf}` : null, diretorio_id: f.id,
  })
  revalidatePath('/fornecedores')
}

export async function excluirFornecedor(fd: FormData) {
  const { supabase, loja } = await exigirEdicao('catalogo')
  await supabase.from('fornecedores').delete().eq('id', String(fd.get('id') ?? '')).eq('loja_id', loja.id)
  revalidatePath('/fornecedores')
}
