import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const ASSUNTOS = [
  (loja: string, produto: string, pct: number) => `${loja || 'Sua loja'} — ${produto} subiu +${pct}% essa semana no ML`,
  (loja: string, _p: string, _c: number, cidade?: string) => `Dado exclusivo para sex shops em ${cidade || 'sua região'}: o que está bombando agora`,
  (loja: string) => `Vi uma oportunidade para ${loja || 'sua loja'} essa semana`,
]

// Top produtos para incluir no email
const TOP_PRODUTOS = [
  { nome: 'Vibrador Sugador Rose Recarregável', pct: 87, vendas: 920, preco: '129,90' },
  { nome: 'Gel Excitante Feminino Tesão de Vaca', pct: 72, vendas: 1300, preco: '24,90' },
  { nome: 'Lubrificante Íntimo K-Med 200g', pct: 65, vendas: 1600, preco: '29,90' },
  { nome: 'Calcinha Fio Dental Renda Preta', pct: 58, vendas: 1600, preco: '19,90' },
  { nome: 'Preservativo Retardante Jontex 12un', pct: 54, vendas: 1800, preco: '29,90' },
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, nome_loja, cidade, limite } = body

    // Modo batch: envia para múltiplos prospectos
    if (limite && Array.isArray(body.prospectos)) {
      let enviados = 0, erros = 0
      for (const p of body.prospectos.slice(0, Math.min(limite, 100))) {
        if (!p.email) continue
        try {
          await enviarEmailPara(p.email, p.nome, p.cidade)
          enviados++
          await new Promise(r => setTimeout(r, 200)) // rate limit
        } catch { erros++ }
      }
      return NextResponse.json({ enviados, erros })
    }

    // Modo individual
    if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

    // Salva prospecto primeiro para ter o ID
    let prospectoId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: inserted } = await supabase.from('prospectos').insert({
          user_id: user.id, email, nome_loja: nome_loja || null,
          cidade: cidade || null, status: 'enviado', enviado_em: new Date().toISOString(),
        }).select('id').single()
        prospectoId = inserted?.id || null
      }
    } catch {}

    await enviarEmailPara(email, nome_loja, cidade, prospectoId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro enviar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function enviarEmailPara(email: string, nomeLoja?: string, cidade?: string, prospectoId?: string | null) {
  const top = TOP_PRODUTOS[0]
  const idx = Math.floor(Math.random() * ASSUNTOS.length)
  const assunto = ASSUNTOS[idx](nomeLoja || '', top.nome, top.pct, cidade)

  const lista = TOP_PRODUTOS.slice(1).map(p =>
    `<li><strong>${p.nome}</strong> — +${p.pct}% (${p.vendas} vendas/dia · R$${p.preco})</li>`
  ).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#111827;background:#fff">
  <div style="margin-bottom:24px"><span style="font-size:22px;font-weight:800"><span style="color:#111827">Luvy</span><span style="color:#7c3aed">Metrics</span></span></div>
  <p style="font-size:16px;margin:0 0 16px">Olá${nomeLoja ? ', <strong>' + nomeLoja + '</strong>' : ''}!</p>
  <p style="color:#374151;line-height:1.7;margin:0 0 20px">Monitorando o mercado adulto essa semana, vi algo importante para sex shops${cidade ? ' em <strong>' + cidade + '</strong>' : ' no Brasil'}:</p>
  <div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:20px;border-radius:0 8px 8px 0;margin:0 0 20px">
    <p style="margin:0 0 8px;font-weight:700;color:#7c3aed;font-size:16px">🔥 ${top.nome} subiu +${top.pct}% essa semana</p>
    <p style="margin:0;color:#374151;font-size:14px">${top.vendas} vendas por dia · R$${top.preco} preço médio</p>
  </div>
  <p style="color:#374151;font-weight:600;margin:0 0 8px">Outros produtos em alta agora:</p>
  <ul style="color:#374151;line-height:2.2;margin:0 0 24px;padding-left:20px">${lista}</ul>
  <p style="color:#374151;line-height:1.7;margin:0 0 20px">Criamos uma plataforma que entrega esses dados <strong>todo dia</strong> para donos de sex shop — para você saber o que comprar <strong>antes de qualquer concorrente</strong>.</p>
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:0 0 24px">
    <p style="margin:0 0 12px;font-weight:700;color:#111827">O que você recebe:</p>
    <p style="margin:0 0 8px;color:#374151">✓ Radar de tendências atualizado todo dia</p>
    <p style="margin:0 0 8px;color:#374151">✓ Calculadora de lucro com taxas do ML e Shopee</p>
    <p style="margin:0 0 8px;color:#374151">✓ Gestão de estoque com alertas automáticos</p>
    <p style="margin:0;color:#374151">✓ Dados de demanda por região do Brasil</p>
  </div>
  <div style="text-align:center;margin:28px 0">
    <a href="https://pay.cakto.com.br/wanxtpo" style="background:#7c3aed;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Testar 7 dias grátis →</a>
    <p style="color:#9ca3af;font-size:13px;margin:10px 0 4px">Sem cartão · Cancele quando quiser</p>
    <p style="color:#7c3aed;font-size:15px;font-weight:700;margin:0">Apenas R$97/mês no lançamento</p>
  </div>
  <p style="color:#374151;line-height:1.7;border-top:1px solid #f3f4f6;padding-top:20px;font-size:14px"><strong>PS:</strong> Estamos em lançamento com preço especial de R$97/mês. As primeiras 50 lojas garantem esse preço para sempre — mesmo quando subir para R$297. Responda este email para ver os dados completos da sua região gratuitamente.</p>
  <p style="color:#374151;margin-top:20px">Abraços,<br><strong>Paulo</strong><br>Fundador · LuvyMetrics<br><a href="https://wa.me/5521986826670" style="color:#7c3aed;font-size:14px">WhatsApp: (21) 98682-6670</a></p>
  <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0 16px"/>
  <p style="color:#9ca3af;font-size:11px;text-align:center;line-height:1.6">Você recebeu este email porque sua loja foi encontrada no Google Maps Brasil.<br><a href="#" style="color:#9ca3af">Descadastrar</a></p>
  ${prospectoId ? `<img src="https://luvymetrics.com.br/api/track/open?id=${prospectoId}" width="1" height="1" style="display:none" alt=""/>` : ''}
</body></html>`

  const fromEmail = process.env.RESEND_FROM || 'Paulo do LuvyMetrics <no-reply@luvymetrics.com.br>'
  await resend.emails.send({ from: fromEmail, to: email, subject: assunto, html })
}
