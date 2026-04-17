import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Gera magic link via admin API (não depende de SMTP)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://luvymetrics.com.br'}/auth/callback`,
      },
    })

    if (error) {
      console.error('Erro gerar link:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const magicLink = data?.properties?.action_link
    if (!magicLink) {
      return NextResponse.json({ error: 'Link não gerado' }, { status: 500 })
    }

    // Envia via Resend (funciona!)
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'LuvyMetrics <onboarding@resend.dev>',
      to: email,
      subject: 'Seu link de acesso ao LuvyMetrics',
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;color:#111827">
  <div style="margin-bottom:24px">
    <span style="font-size:22px;font-weight:800"><span style="color:#111827">Luvy</span><span style="color:#7c3aed">Metrics</span></span>
  </div>
  <h2 style="margin:0 0 16px;font-size:20px">Clique para acessar sua conta</h2>
  <p style="color:#6b7280;line-height:1.6;margin:0 0 24px">Você solicitou um link de acesso. Clique no botão abaixo para entrar no LuvyMetrics:</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${magicLink}" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Entrar no LuvyMetrics →</a>
  </div>
  <p style="color:#9ca3af;font-size:12px;margin-top:24px">Se você não solicitou este link, ignore este email.<br>O link expira em 1 hora.</p>
</body></html>`,
    })

    if (emailError) {
      console.error('Erro Resend:', emailError)
      return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro magic link:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
