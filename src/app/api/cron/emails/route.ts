import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { trialExpirandoTemplate, trialExpiradoTemplate } from '@/lib/email/templates'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM ?? 'LuvyMetrics <no-reply@luvymetrics.com.br>'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const hoje     = new Date()
  let enviados   = 0
  const erros: string[] = []

  try {
    const { data: perfis, error: perfilErr } = await supabase
      .from('perfis')
      .select('id, nome, trial_expira_em, plano, ativo')
      .eq('plano', 'trial')
      .eq('ativo', true)

    if (perfilErr) {
      console.error('Erro ao buscar perfis:', perfilErr)
      return NextResponse.json({ error: 'Falha ao buscar perfis' }, { status: 500 })
    }

    console.log(`Cron emails: ${perfis?.length ?? 0} usuários em trial`)

    for (const perfil of perfis ?? []) {
      try {
        if (!perfil.trial_expira_em) continue

        const expira        = new Date(perfil.trial_expira_em)
        const diasRestantes = Math.ceil((expira.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

        const { data: authData } = await supabase.auth.admin.getUserById(perfil.id)
        const email = authData?.user?.email
        if (!email) { console.warn('Sem email para perfil:', perfil.id); continue }

        const nomeExibido = perfil.nome || 'Lojista'

        if (diasRestantes === 1) {
          const { error } = await resend.emails.send({
            from: FROM,
            to: email,
            subject: '⏰ Seu trial expira amanhã — assine agora',
            html: trialExpirandoTemplate(nomeExibido),
          })
          if (error) { erros.push(`${email}: ${error.message}`); continue }
          enviados++
          console.log('Email trial expirando →', email)
        }

        if (diasRestantes <= 0) {
          const { error } = await resend.emails.send({
            from: FROM,
            to: email,
            subject: 'Sentimos sua falta no LuvyMetrics 💜',
            html: trialExpiradoTemplate(nomeExibido),
          })
          if (error) { erros.push(`${email}: ${error.message}`); continue }
          enviados++
          console.log('Email trial expirado →', email)
        }
      } catch (err) {
        console.error('Erro ao processar perfil:', perfil.id, err)
        erros.push(String(perfil.id))
      }
    }

    console.log(`Cron emails finalizado: ${enviados} enviados, ${erros.length} erros`)
    return NextResponse.json({ success: true, enviados, erros })
  } catch (err) {
    console.error('Erro crítico no cron de emails:', err)
    return NextResponse.json({ error: 'Falha no cron' }, { status: 500 })
  }
}
