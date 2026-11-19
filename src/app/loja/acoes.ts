'use server'
import { createClient } from '@/lib/supabase/server'
import { origem } from '@/lib/origem'
import { linkDePagamento } from '@/lib/mercadopago'

export type DadosPedido = {
  nome: string
  whatsapp: string
  entrega: 'retirada' | 'local' | 'combinar' | 'brasil'
  endereco: string
  cep?: string
  pagamento: 'pix' | 'combinar' | 'mercadopago'
  observacao: string
  site?: string // armadilha para robôs: pessoas não preenchem
}

const ERROS: Record<string, string> = {
  LOJA_FECHADA: 'Esta loja não está recebendo pedidos agora.',
  CARRINHO_INVALIDO: 'Seu carrinho está vazio ou com itens demais.',
  ENTREGA_INVALIDA: 'Escolha uma forma de entrega disponível.',
  ENDERECO_OBRIGATORIO: 'Informe o endereço completo para a entrega.',
  PAGAMENTO_INVALIDO: 'Escolha uma forma de pagamento disponível.',
  MUITOS_PEDIDOS: 'Recebemos vários pedidos seus agora há pouco. Espere alguns minutos ou fale com a loja.',
  QUANTIDADE_INVALIDA: 'Quantidade inválida em algum item.',
  PRODUTO_INDISPONIVEL: 'Um dos produtos não está mais disponível. Atualize a página.',
  CEP_INVALIDO: 'Confira o CEP: ele precisa ter 8 números.',
  REGIAO_NAO_ATENDIDA: 'A loja ainda não envia para a sua região. Fale com ela no WhatsApp.',
}

export async function criarPedido(slug: string, itens: { produto_id: string; quantidade: number }[], d: DadosPedido) {
  if (d.site) return { erro: 'Não foi possível enviar.' }
  const nome = String(d.nome ?? '').trim().slice(0, 80)
  const zap = String(d.whatsapp ?? '').replace(/\D/g, '')
  if (nome.length < 2) return { erro: 'Informe seu nome.' }
  if (zap.length < 10 || zap.length > 13) return { erro: 'Informe um WhatsApp com DDD.' }
  const lista = (Array.isArray(itens) ? itens : []).slice(0, 30).map((i) => ({ produto_id: String(i.produto_id), quantidade: Math.round(Number(i.quantidade)) }))

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('criar_pedido', {
    p_slug: slug,
    p_itens: lista,
    p_nome: nome,
    p_whatsapp: zap,
    p_entrega: d.entrega,
    p_endereco: String(d.endereco ?? '').slice(0, 300),
    p_pagamento: d.pagamento,
    p_obs: String(d.observacao ?? '').slice(0, 300),
    p_cep: d.entrega === 'brasil' ? String(d.cep ?? '').replace(/\D/g, '').slice(0, 8) : null,
  })
  if (error) {
    const chave = Object.keys(ERROS).find((k) => error.message.includes(k))
    if (error.message.includes('ESTOQUE_INSUFICIENTE')) return { erro: `Só temos menos unidades de ${error.message.split('ESTOQUE_INSUFICIENTE:')[1] ?? 'um item'} do que você pediu.` }
    return { erro: chave ? ERROS[chave] : 'Não foi possível enviar o pedido. Tente de novo.' }
  }
  const token = (data as { token: string }).token
  if (d.pagamento === 'mercadopago') {
    // se o Mercado Pago falhar agora, o pedido existe: a página do pedido oferece tentar de novo
    try { return { token, pagar: await linkDePagamento(token, await origem()) } } catch (e) {
      console.error('[mercadopago preferencia]', e instanceof Error ? e.message : e)
    }
  }
  return { token }
}

/** Página do pedido: cria (ou reaproveita) o link de pagamento do Mercado Pago. */
export async function pagarPedido(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { erro: 'Pedido inválido.' }
  try {
    const link = await linkDePagamento(token, await origem())
    return link ? { link } : { erro: 'Este pedido não pode mais ser pago online. Fale com a loja.' }
  } catch {
    return { erro: 'O Mercado Pago não respondeu agora. Tente de novo em instantes.' }
  }
}
