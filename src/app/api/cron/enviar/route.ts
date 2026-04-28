import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const TOP = { nome: 'Vibrador Sugador Rose Recarregável', pct: 87, vendas: 920, preco: '129,90' }
const LISTA = [
  ['Gel Excitante Feminino Tesão de Vaca', 72, 1300, '24,90'],
  ['Lubrificante Íntimo K-Med 200g', 65, 1600, '29,90'],
  ['Calcinha Fio Dental Renda Preta', 58, 1600, '19,90'],
  ['Preservativo Retardante Jontex 12un', 54, 1800, '29,90'],
].map(([n, p, v, pr]) => `<li><strong>${n}</strong> — +${p}% (${v} vendas/dia · R$${pr})</li>`).join('')

const ASSUNTOS = [
  (l: string, c?: string) => `🔥 ${TOP.nome.split(' ').slice(0, 3).join(' ')} esgotando em ${c || 'sua região'} — +${TOP.pct}%`,
  (l: string) => `Dado importante para ${l || 'sua loja'} essa semana`,
  (l: string, c?: string) => `Seu concorrente em ${c || 'SP'} já sabe disso — você sabe?`,
]

function emailHtml(p: any) {
  return `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#111827">
  <div style="margin-bottom:24px"><span style="font-size:22px;font-weight:800"><span style="color:#111827">Luvy</span><span style="color:#7c3aed">Metrics</span></span></div>
  <p style="font-size:16px;margin:0 0 16px">Olá, <strong>${p.nome_loja || 'lojista'}</strong>!</p>
  <p style="color:#374151;line-height:1.7;margin:0 0 20px">Monitorando o mercado adulto essa semana, vi algo importante${p.cidade ? ' para sex shops em <strong>' + p.cidade + '</strong>' : ''}:</p>
  <div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:20px;border-radius:0 8px 8px 0;margin:0 0 20px">
    <p style="margin:0 0 8px;font-weight:700;color:#7c3aed;font-size:16px">🔥 ${TOP.nome} subiu +${TOP.pct}% essa semana</p>
    <p style="margin:0;color:#374151;font-size:14px">${TOP.vendas} vendas por dia · R$${TOP.preco} preço médio</p>
  </div>
  <p style="color:#374151;font-weight:600;margin:0 0 8px">Outros produtos em alta agora:</p>
  <ul style="color:#374151;line-height:2.2;margin:0 0 24px;padding-left:20px">${LISTA}</ul>
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
  <p style="color:#374151;line-height:1.7;border-top:1px solid #f3f4f6;padding-top:20px;font-size:14px"><strong>PS:</strong> Estamos com apenas <strong>23 vagas</strong> no preço de lançamento R$97/mês. Depois sobe para R$297. Responda este email se quiser garantir o seu.</p>
  <p style="color:#374151;margin-top:20px">Abraços,<br><strong>Paulo</strong><br>Fundador · LuvyMetrics<br><a href="https://wa.me/5521986826670" style="color:#7c3aed;font-size:14px">WhatsApp: (21) 98682-6670</a></p>
  <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0 16px"/>
  <p style="color:#9ca3af;font-size:11px;text-align:center">Você recebeu porque sua loja foi encontrada no Google Maps Brasil.</p>
  <img src="https://luvymetrics.com.br/api/track/open?id=${p.id}" width="1" height="1" style="display:none" alt=""/>
</div>`
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: novos } = await supabase.from('prospectos').select('*').eq('status', 'novo').not('email', 'is', null).limit(200)

  let enviados = 0, erros = 0
  for (const p of novos || []) {
    try {
      const assunto = ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)](p.nome_loja || 'sua loja', p.cidade)
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'LuvyMetrics <contato@luvymetrics.com.br>',
        to: p.email, subject: assunto, html: emailHtml(p),
      })
      await supabase.from('prospectos').update({ status: 'enviado', enviado_em: new Date().toISOString() }).eq('id', p.id)
      enviados++
    } catch { erros++ }
  }

  return NextResponse.json({ enviados, erros, fila_restante: (novos?.length || 0) - enviados })
}
