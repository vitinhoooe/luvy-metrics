import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luvymetrics.com.br'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Webhook Cakto recebido:', JSON.stringify(body, null, 2))

    const evento = body.event ?? body.type ?? ''
    const ADMIN_EMAIL = 'paulobernardobtt@gmail.com'

    // Cakto pode enviar campos na raiz OU dentro de body.data
    const payload = body.data ?? body

    // ─── CANCELAMENTO / REEMBOLSO ────────────────────────────────
    if (['subscription.canceled', 'purchase.refunded', 'subscription.expired'].includes(evento)) {
      const email = (payload.customer ?? payload.buyer ?? body.customer ?? body.buyer)?.email as string | undefined
      if (!email || email === ADMIN_EMAIL) return NextResponse.json({ ok: true })

      console.log('Cancelamento para:', email)
      const supabase = createServiceClient()
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === email)

      if (user) {
        await supabase.from('perfis').update({ plano: 'cancelado', ativo: false }).eq('user_id', user.id)
        console.log('Acesso cancelado para:', email)
      }

      return NextResponse.json({ success: true })
    }

    // ─── COMPRA APROVADA ─────────────────────────────────────────
    if (!['purchase.approved', 'payment.approved', 'sale.approved'].includes(evento)) {
      console.log('Evento ignorado:', evento)
      return NextResponse.json({ ok: true, ignorado: true })
    }

    const customer = payload.customer ?? payload.buyer ?? body.customer ?? body.buyer ?? {}
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

    const senhaTemp = Math.random().toString(36).slice(-4).toUpperCase() + Math.random().toString(36).slice(-4).toUpperCase()

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: senhaTemp,
      user_metadata: { nome, whatsapp: telefone },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        // Busca usuário existente e atualiza senha
        const { data: lista } = await supabase.auth.admin.listUsers()
        const existente = lista?.users?.find((u) => u.email === email)
        userId = existente?.id
        if (userId) {
          await supabase.auth.admin.updateUserById(userId, { password: senhaTemp })
          console.log('Senha atualizada para user existente:', userId)
        }
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
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (perfilError) {
      console.error('Erro ao criar perfil:', perfilError)
    } else {
      console.log('Perfil criado/atualizado para:', email)
    }

    // 3 — Gera link de "definir senha" (recovery) — usuário cria a própria senha
    let setupLink: string | undefined
    try {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${SITE_URL}/auth/callback?next=/nova-senha` },
      })
      if (linkErr) console.error('Aviso — erro ao gerar link de setup:', linkErr.message)
      setupLink = linkData?.properties?.action_link
      console.log('Link de setup gerado:', setupLink ? 'ok' : 'sem link')
    } catch (linkErr: any) {
      console.error('Aviso — erro ao gerar link de setup:', linkErr?.message)
    }

    // 4 — Envia email de boas-vindas com link "definir senha"
    try {
      const { Resend } = require('resend')
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) { console.error('RESEND_API_KEY não configurada!'); throw new Error('Missing RESEND_API_KEY') }
      const resend = new Resend(apiKey)
      const ctaLink = setupLink || `${SITE_URL}/recuperar-senha`
      const ctaLabel = setupLink ? 'Definir minha senha →' : 'Recuperar acesso →'
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM || 'LuvyMetrics <contato@luvymetrics.com.br>',
        to: email,
        subject: '🎉 Seu acesso ao LuvyMetrics está pronto!',
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#111827">
  <div style="margin-bottom:28px"><span style="font-size:24px;font-weight:800"><span style="color:#111827">Luvy</span><span style="color:#7c3aed">Metrics</span></span></div>
  <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 16px">Bem-vindo ao LuvyMetrics! 🎉</h1>
  <p style="color:#374151;line-height:1.7;margin:0 0 20px">Olá ${nome || 'lojista'}! Sua compra foi aprovada e seu acesso está ativo.</p>
  <p style="color:#374151;line-height:1.7;margin:0 0 20px">Para entrar, basta clicar no botão abaixo e criar sua senha:</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${ctaLink}" style="background:#7c3aed;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">${ctaLabel}</a>
    <p style="color:#9ca3af;font-size:13px;margin:12px 0 0">Email da conta: ${email}</p>
  </div>
  <div style="background:#f5f3ff;border-radius:12px;padding:24px;margin:0 0 24px">
    <p style="margin:0 0 16px;font-weight:700;color:#7c3aed;font-size:16px">3 passos para seu primeiro insight:</p>
    <p style="margin:0 0 10px;color:#374151">1️⃣ Acesse o dashboard e veja as tendências de hoje</p>
    <p style="margin:0 0 10px;color:#374151">2️⃣ Cadastre seus produtos no estoque</p>
    <p style="margin:0;color:#374151">3️⃣ Use a calculadora para precificar corretamente</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:0 0 24px">
    <p style="margin:0 0 12px;font-weight:700;color:#111827">Precisa de ajuda?</p>
    <p style="margin:0;color:#374151;font-size:14px">Responda este email ou fale no WhatsApp:<br><a href="https://wa.me/5521986826670" style="color:#7c3aed">(21) 98682-6670</a></p>
  </div>
  <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">O link de definição de senha expira em 1 hora. Se expirar, use "Esqueci minha senha" na tela de login.</p>
  <p style="color:#374151;font-size:15px;margin-top:24px">Bom lucro!<br><strong>Paulo</strong><br>Fundador · LuvyMetrics</p>
</body></html>`,
      })
      console.log('Email boas-vindas resultado:', emailResult.data?.id ? 'ENVIADO ID:' + emailResult.data.id : 'FALHOU:' + emailResult.error?.message)
    } catch (emailErr: any) {
      console.error('Aviso — falha no email:', emailErr?.message)
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
