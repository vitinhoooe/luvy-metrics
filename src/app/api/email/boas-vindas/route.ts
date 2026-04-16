import { Resend } from 'resend'
import { boasVindasTemplate } from '@/lib/email/templates'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, nome } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'LuvyMetrics <no-reply@luvymetrics.com.br>',
      to: email,
      subject: '🎉 Seu acesso ao LuvyMetrics está pronto!',
      html: boasVindasTemplate(nome ?? 'Lojista', email),
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 })
    }

    console.log('Email boas-vindas enviado:', email, data?.id)
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Erro ao enviar email de boas-vindas:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
