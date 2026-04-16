import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { email, nome_loja, cidade } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome, nome_loja')
      .eq('id', user.id)
      .single()

    const remetente = perfil?.nome || 'Equipe LuvyMetrics'

    const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;font-weight:900;font-size:20px;width:40px;height:40px;line-height:40px;border-radius:10px">L</div>
        <h1 style="margin:8px 0 0;font-size:22px;color:#111827">Luvy<span style="color:#7c3aed">Metrics</span></h1>
      </div>

      <p style="font-size:16px;color:#111827;margin-bottom:16px">Olá${nome_loja ? `, <strong>${nome_loja}</strong>` : ''}!</p>

      <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:16px">
        Sou ${remetente} e encontrei sua loja${cidade ? ` em <strong>${cidade}</strong>` : ''} enquanto pesquisava o mercado de sex shops no Brasil.
      </p>

      <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:16px">
        Criei o <strong>LuvyMetrics</strong> — uma plataforma que ajuda donos de sex shop a:
      </p>

      <ul style="font-size:15px;color:#374151;line-height:2;margin-bottom:20px;padding-left:20px">
        <li>📈 Descobrir quais produtos estão vendendo mais agora</li>
        <li>💰 Calcular o preço ideal com taxas de marketplace</li>
        <li>📦 Controlar estoque e evitar perdas</li>
        <li>🗺️ Ver demanda por região do Brasil</li>
      </ul>

      <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:24px">
        Estamos oferecendo <strong>7 dias grátis</strong> para testar todas as funcionalidades.
      </p>

      <div style="text-align:center;margin-bottom:24px">
        <a href="https://pay.cakto.com.br/3aqtjn8" style="display:inline-block;background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
          Testar grátis por 7 dias →
        </a>
      </div>

      <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px">
        LuvyMetrics — O radar de tendências do seu sex shop<br/>
        Se não quiser mais receber, basta ignorar este email.
      </p>
    </div>`

    const fromEmail = process.env.RESEND_FROM || 'LuvyMetrics <no-reply@luvymetrics.com.br>'

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `${nome_loja || 'Sua loja'} — Dados de mercado sex shop grátis por 7 dias`,
      html,
    })

    if (error) {
      console.error('Erro Resend:', error)
      return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
    }

    // Salva prospecto no banco (ignora erro se tabela não existir)
    try {
      await supabase.from('prospectos').insert({
        user_id: user.id,
        email,
        nome_loja: nome_loja || null,
        cidade: cidade || null,
        status: 'enviado',
        enviado_em: new Date().toISOString(),
      })
    } catch {}

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error: any) {
    console.error('Erro enviar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
