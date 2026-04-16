import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luvymetrics.com.br'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Webhook Cakto recebido:', JSON.stringify(body, null, 2))

    // Aceita purchase.approved ou payment.approved
    const evento = body.event ?? body.type ?? ''
    if (!['purchase.approved', 'payment.approved', 'sale.approved'].includes(evento)) {
      console.log('Evento ignorado:', evento)
      return NextResponse.json({ ok: true, ignorado: true })
    }

    const customer = body.customer ?? body.buyer ?? {}
    const email    = customer.email as string | undefined
    const nome     = (customer.name ?? customer.full_name ?? '') as string
    const telefone = (customer.phone ?? customer.phone_number ?? '') as string

    if (!email) {
      console.error('Email não encontrado no payload:', body)
      return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 })
    }

    console.log('Processando compra para:', email)
    const supabase = createServiceClient()

    // 1 — Cria ou reutiliza usuário no Supabase Auth
    let userId: string | undefined

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4),
      user_metadata: { nome, whatsapp: telefone },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        // Busca usuário existente
        const { data: lista } = await supabase.auth.admin.listUsers()
        const existente = lista?.users?.find((u) => u.email === email)
        userId = existente?.id
        console.log('Usuário já existia, reutilizando:', userId)
      } else {
        console.error('Erro ao criar usuário:', authError)
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }
    } else {
      userId = authUser?.user?.id
      console.log('Usuário criado:', userId)
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não foi possível obter userId' }, { status: 500 })
    }

    // 2 — Cria ou atualiza perfil
    const { error: perfilError } = await supabase.from('perfis').upsert({
      id: userId,
      user_id: userId,
      nome,
      whatsapp: telefone,
      plano: 'ativo',
      trial_expira_em: null,
      onboarding_completo: false,
      ativo: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (perfilError) {
      console.error('Erro ao criar perfil:', perfilError)
    } else {
      console.log('Perfil criado/atualizado para:', email)
    }

    // 3 — Gera magic link e registra (não envia pelo Supabase — usamos Resend)
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })
      console.log('Magic link gerado:', linkData?.properties?.action_link ? 'ok' : 'sem link')
    } catch (linkErr) {
      console.error('Aviso — erro ao gerar magic link:', linkErr)
    }

    // 4 — Envia email de boas-vindas via Resend
    try {
      const emailRes = await fetch(`${SITE_URL}/api/email/boas-vindas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome }),
      })
      const emailJson = await emailRes.json()
      console.log('Email boas-vindas:', emailJson)
    } catch (emailErr) {
      console.error('Aviso — falha no email de boas-vindas:', emailErr)
    }

    // 5 — Log para disparo manual de WhatsApp
    const msgWpp = `Olá ${nome?.split(' ')[0] || ''}! 🎉 Seu acesso ao LuvyMetrics está ativo!\n\nAcesse: ${SITE_URL}/login\n\nFaça login com: ${email}\n\nAmanhã às 7h chega sua primeira planilha de tendências! 📊`
    console.log('=== ENVIAR WHATSAPP ===')
    console.log('Para:', telefone)
    console.log('Mensagem:', msgWpp)
    console.log('======================')

    return NextResponse.json({ success: true, userId })
  } catch (err) {
    console.error('Erro crítico no webhook Cakto:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
