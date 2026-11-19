import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import { cifrar, decifrar } from '@/lib/cripto'

// Mercado Pago da PRÓPRIA lojista: o Luvy usa o token dela para criar a cobrança (Checkout Pro)
// e para consultar se o pagamento foi aprovado. O dinheiro vai direto para a conta dela.

const API = 'https://api.mercadopago.com'

async function mp<T>(token: string, caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(API + caminho, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  })
  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`MP_${r.status}:${(corpo as { message?: string }).message ?? 'erro'}`)
  return corpo as T
}

/** Confere o token colado pela lojista e devolve a conta (apelido) a que ele pertence. */
export async function validarToken(token: string) {
  const eu = await mp<{ id: number; nickname?: string; email?: string; site_id?: string }>(token, '/users/me')
  return { id: String(eu.id), conta: eu.nickname || eu.email || String(eu.id), pais: eu.site_id }
}

export async function salvarConexao(lojaId: string, token: string, usuario: string, conta: string) {
  const s = createServiceClient()
  const { error } = await s.from('loja_segredos').upsert({ loja_id: lojaId, mp_token: cifrar(token), mp_usuario: usuario, atualizado_em: new Date().toISOString() })
  if (error) throw error
  const { error: e2 } = await s.from('lojas').update({ mp_ativo: true, mp_conta: conta.slice(0, 60) }).eq('id', lojaId)
  if (e2) throw e2
}

export async function removerConexao(lojaId: string) {
  const s = createServiceClient()
  await s.from('lojas').update({ mp_ativo: false, mp_conta: null }).eq('id', lojaId)
  await s.from('loja_segredos').delete().eq('loja_id', lojaId)
}

async function tokenDaLoja(lojaId: string) {
  const { data } = await createServiceClient().from('loja_segredos').select('mp_token').eq('loja_id', lojaId).maybeSingle()
  return data?.mp_token ? decifrar(data.mp_token) : null
}

type PedidoMp = {
  id: string; token: string; numero: number; status: string; total: number; frete: number; pagamento: string; mp_link: string | null
  loja_id: string; lojas: { nome: string; slug: string; mp_descritor: string | null }
}

async function pedidoPorToken(token: string) {
  const { data } = await createServiceClient().from('pedidos')
    .select('id, token, numero, status, total, frete, pagamento, mp_link, loja_id, lojas!inner(nome, slug, mp_descritor)')
    .eq('token', token).maybeSingle()
  if (!data) return null
  const l = Array.isArray(data.lojas) ? data.lojas[0] : data.lojas
  return { ...data, lojas: l } as unknown as PedidoMp
}

/**
 * Cria (ou reaproveita) a página de pagamento do Mercado Pago para um pedido da vitrine.
 * Uma linha só ("Pedido #N"): não expõe o nome dos produtos na fatura nem no comprovante.
 */
export async function linkDePagamento(pedidoToken: string, site: string) {
  const pe = await pedidoPorToken(pedidoToken)
  if (!pe || pe.pagamento !== 'mercadopago' || pe.status !== 'novo') return null
  if (pe.mp_link) return pe.mp_link
  const token = await tokenDaLoja(pe.loja_id)
  if (!token) return null
  const voltar = `${site}/loja/${pe.lojas.slug}/pedido/${pe.token}`
  const https = site.startsWith('https://')
  const pref = await mp<{ id: string; init_point: string }>(token, '/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ id: String(pe.numero), title: `Pedido #${pe.numero} · ${pe.lojas.nome}`.slice(0, 120), quantity: 1, unit_price: Number(pe.total), currency_id: 'BRL' }],
      external_reference: pe.token,
      ...(https ? {
        notification_url: `${site}/api/mercadopago/webhook?loja=${pe.loja_id}`,
        back_urls: { success: voltar, pending: voltar, failure: voltar },
        auto_return: 'approved',
      } : {}),
      statement_descriptor: (pe.lojas.mp_descritor || 'LOJA ONLINE').slice(0, 13),
    }),
  })
  await createServiceClient().from('pedidos').update({ mp_link: pref.init_point }).eq('id', pe.id)
  return pref.init_point
}

type Pagamento = { id: number; status: string; external_reference: string | null; transaction_amount: number; payment_method_id?: string; payment_type_id?: string }

const formaDe = (p: Pagamento) =>
  p.payment_method_id === 'pix' ? 'pix'
    : p.payment_type_id === 'credit_card' ? 'credito'
      : p.payment_type_id === 'debit_card' ? 'debito' : 'outro'

/** Consulta um pagamento no Mercado Pago (com o token da loja) e confirma o pedido se estiver aprovado. */
export async function conferirPagamento(lojaId: string, pagamentoId: string) {
  const token = await tokenDaLoja(lojaId)
  if (!token || !/^\d{1,20}$/.test(pagamentoId)) return 'IGNORADO'
  const p = await mp<Pagamento>(token, `/v1/payments/${pagamentoId}`)
  if (p.status !== 'approved' || !p.external_reference) return `STATUS_${p.status}`
  // o pedido tem que ser desta loja (o aviso chega com o id da loja na URL)
  const pe = await pedidoPorToken(p.external_reference)
  if (!pe || pe.loja_id !== lojaId) return 'PEDIDO_DE_OUTRA_LOJA'
  const { data, error } = await createServiceClient().rpc('confirmar_pedido_mp', {
    p_token: p.external_reference, p_pagamento: String(p.id), p_valor: Number(p.transaction_amount), p_forma: formaDe(p),
  })
  if (error) throw error
  return String(data)
}

/** Plano B do aviso: procura pagamento aprovado do pedido (usado quando a cliente volta para a página do pedido). */
export async function conferirPedido(pedidoToken: string) {
  const pe = await pedidoPorToken(pedidoToken)
  if (!pe || pe.pagamento !== 'mercadopago' || pe.status !== 'novo') return null
  const token = await tokenDaLoja(pe.loja_id)
  if (!token) return null
  const r = await mp<{ results: Pagamento[] }>(token, `/v1/payments/search?external_reference=${encodeURIComponent(pe.token)}&sort=date_created&criteria=desc&limit=5`)
  const ok = r.results.find((p) => p.status === 'approved')
  return ok ? conferirPagamento(pe.loja_id, String(ok.id)) : null
}
