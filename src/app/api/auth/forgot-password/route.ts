import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luvymetrics.com.br'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: true })
    }

    const supabase = createServiceClient()
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${SITE_URL}/nova-senha` },
    })

    if (linkErr || !linkData?.properties?.action_link) {
      console.log('forgot-password: usuário não encontrado ou erro ao gerar link', email, linkErr?.message)
      return NextResponse.json({ ok: true })
    }

    const actionLink = linkData.properties.action_link

    try {
      const { Resend } = require('resend')
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        console.error('RESEND_API_KEY não configurada!')
        return NextResponse.json({ ok: true })
      }
      const resend = new Resend(apiKey)
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM || 'LuvyMetrics <contato@luvymetrics.com.br>',
        to: email,
        subject: 'Redefinir sua senha · LuvyMetrics',
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#111827">
  <div style="margin-bottom:28px"><span style="font-size:24px;font-weight:800"><span style="color:#111827">Luvy</span><span style="color:#7c3aed">Metrics</span></span></div>
  <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 16px">Redefinir sua senha</h1>
  <p style="color:#374151;line-height:1.7;margin:0 0 20px">Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${actionLink}" style="background:#7c3aed;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Criar nova senha →</a>
  </div>
  <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 12px">Se você não pediu essa redefinição, pode ignorar este email — sua senha atual continua válida.</p>
  <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">O link expira em 1 hora por segurança.</p>
</body></html>`,
      })
      console.log('forgot-password: email', result.data?.id ? 'ENVIADO ID:' + result.data.id : 'FALHOU:' + result.error?.message)
    } catch (emailErr: any) {
      console.error('forgot-password: erro no Resend', emailErr?.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('forgot-password: erro crítico', err)
    return NextResponse.json({ ok: true })
  }
}
