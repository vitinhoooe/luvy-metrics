import { NextResponse, type NextRequest } from 'next/server'
import { conferirPagamento } from '@/lib/mercadopago'

// Aviso do Mercado Pago ("um pagamento mudou"). Não confiamos no conteúdo do aviso:
// usamos só o id do pagamento e CONSULTAMOS o Mercado Pago com o token da loja.
// Assim, um aviso falso não confirma nada. Responde 200 rápido para o Mercado Pago não insistir.

export async function POST(req: NextRequest) {
  const url = req.nextUrl
  const loja = url.searchParams.get('loja') ?? ''
  let corpo: { type?: string; topic?: string; action?: string; data?: { id?: string | number } } = {}
  try { corpo = await req.json() } catch {}
  const tipo = corpo.type ?? corpo.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic')
  const id = String(corpo.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '')

  if (!/^[0-9a-f-]{36}$/i.test(loja) || tipo !== 'payment' || !id) return NextResponse.json({ ok: true })
  try {
    const r = await conferirPagamento(loja, id)
    return NextResponse.json({ ok: true, r })
  } catch (e) {
    console.error('[mercadopago webhook]', e instanceof Error ? e.message : e)
    // 500 faz o Mercado Pago tentar de novo mais tarde
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
