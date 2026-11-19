import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { conferirPedido } from '@/lib/mercadopago'
import { PedidoConfirmado } from '../../../PedidoConfirmado'
import type { PedidoPublico } from '../../../tipos'
import '../../../vitrine.css'

// link privado do pedido: não aparece no Google
export const metadata: Metadata = { title: 'Seu pedido', robots: { index: false, follow: false } }

export default async function Pedido({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { token } = await params
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound()
  const supabase = await createClient()
  let { data } = await supabase.rpc('pedido_publico', { p_token: token })
  if (!data) notFound()
  // plano B do aviso do Mercado Pago: ao voltar do pagamento, confere direto e já mostra "pago"
  const p = data as PedidoPublico
  if (p.pagamento === 'mercadopago' && p.status === 'novo') {
    try {
      if ((await conferirPedido(token)) === 'CONFIRMADO') ({ data } = await supabase.rpc('pedido_publico', { p_token: token }))
    } catch (e) { console.error('[mercadopago conferir]', e instanceof Error ? e.message : e) }
  }
  return <PedidoConfirmado pedido={data as PedidoPublico} token={token} />
}
