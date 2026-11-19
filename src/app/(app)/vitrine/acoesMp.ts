'use server'
import { revalidatePath } from 'next/cache'
import { exigirEdicao, mensagemErro } from '@/lib/sessao'
import { criptoConfigurada } from '@/lib/cripto'
import { removerConexao, salvarConexao, validarToken } from '@/lib/mercadopago'
import type { Estado } from '@/components/Enviar'

/** Conecta a conta do Mercado Pago da lojista (ela cola o Access Token de produção). */
export async function conectarMercadoPago(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const { supabase, loja } = await exigirEdicao('vitrine')
    const token = String(fd.get('token') ?? '').trim()
    const descritor = String(fd.get('descritor') ?? '').trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 13)
    if (descritor) await supabase.from('lojas').update({ mp_descritor: descritor }).eq('id', loja.id)
    if (!token) {
      revalidatePath('/vitrine')
      return descritor ? { ok: 'Nome na fatura salvo.' } : { erro: 'Cole o Access Token de produção da sua conta do Mercado Pago.' }
    }
    if (token.startsWith('TEST-')) return { erro: 'Esse é o token de teste. Use o Access Token de PRODUÇÃO (começa com APP_USR-).' }
    if (!/^APP_USR-[\w-]{20,}$/.test(token)) return { erro: 'Esse não parece um Access Token do Mercado Pago (começa com APP_USR-).' }
    if (!criptoConfigurada()) return { erro: 'O Luvy ainda não está pronto para guardar a conexão. Fale com o suporte.' }
    let conta
    try { conta = await validarToken(token) } catch { return { erro: 'O Mercado Pago não aceitou esse token. Confira se copiou inteiro.' } }
    if (conta.pais && conta.pais !== 'MLB') return { erro: 'Essa conta do Mercado Pago não é do Brasil.' }
    await salvarConexao(loja.id, token, conta.id, conta.conta)
    revalidatePath('/vitrine')
    revalidatePath('/integracoes')
    revalidatePath(`/loja/${loja.slug}`)
    return { ok: `Mercado Pago conectado: ${conta.conta}. Suas clientes já podem pagar com Pix ou cartão.` }
  } catch (e) {
    return { erro: mensagemErro(e) }
  }
}

export async function desconectarMercadoPago() {
  const { loja } = await exigirEdicao('vitrine')
  await removerConexao(loja.id)
  revalidatePath('/vitrine')
  revalidatePath('/integracoes')
  revalidatePath(`/loja/${loja.slug}`)
}
