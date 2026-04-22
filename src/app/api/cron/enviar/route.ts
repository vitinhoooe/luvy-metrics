import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 55

const TOP = { nome: 'Vibrador Sugador Rose Recarregável', pct: 87, vendas: 920, preco: '129,90' }
const LISTA = [
  ['Gel Excitante Feminino Tesão de Vaca', 72, 1300, '24,90'],
  ['Lubrificante Íntimo K-Med 200g', 65, 1600, '29,90'],
  ['Calcinha Fio Dental Renda Preta', 58, 1600, '19,90'],
].map(([n, p, v, pr]) => `<li><strong>${n}</strong> — +${p}% (${v} vendas/dia · R$${pr})</li>`).join('')

const ASSUNTOS = [
  (loja: string) => `${loja} — produto subiu +87% essa semana no ML`,
  (loja: string) => `Vi uma oportunidade para ${loja} essa semana`,
  (loja: string) => `Dado exclusivo: o que está bombando para ${loja}`,
]

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Pega até 30 prospectos novos
  const { data: novos } = await supabase.from('prospectos').select('*').eq('status', 'novo').not('email', 'is', null).limit(30)

  let enviados = 0, erros = 0
  for (const p of novos || []) {
    try {
      const assunto = ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)](p.nome_loja || 'sua loja')
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'LuvyMetrics <onboarding@resend.dev>',
        to: p.email,
        subject: assunto,
        html: `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#111827"><div style="margin-bottom:24px"><span style="font-size:22px;font-weight:800"><span style="color:#111827">Luvy</span><span style="color:#7c3aed">Metrics</span></span></div><p style="font-size:16px;margin:0 0 16px">Olá, <strong>${p.nome_loja || 'lojista'}</strong>!</p><p style="color:#374151;line-height:1.7;margin:0 0 20px">Monitorando o mercado adulto essa semana, vi algo importante${p.cidade ? ' para sex shops em <strong>' + p.cidade + '</strong>' : ''}:</p><div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:20px;border-radius:0 8px 8px 0;margin:0 0 20px"><p style="margin:0 0 8px;font-weight:700;color:#7c3aed;font-size:16px">🔥 ${TOP.nome} subiu +${TOP.pct}% essa semana</p><p style="margin:0;color:#374151;font-size:14px">${TOP.vendas} vendas por dia · R$${TOP.preco} preço médio</p></div><p style="color:#374151;font-weight:600;margin:0 0 8px">Outros em alta:</p><ul style="color:#374151;line-height:2.2;margin:0 0 24px;padding-left:20px">${LISTA}</ul><div style="text-align:center;margin:28px 0"><a href="https://pay.cakto.com.br/wanxtpo" style="background:#7c3aed;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Testar 7 dias grátis →</a><p style="color:#7c3aed;font-size:15px;font-weight:700;margin:10px 0 0">R$97/mês</p></div><p style="color:#374151;margin-top:20px">Abraços,<br><strong>Paulo</strong><br>LuvyMetrics<br><a href="https://wa.me/5521986826670" style="color:#7c3aed">WhatsApp: (21) 98682-6670</a></p></div>`,
      })
      await supabase.from('prospectos').update({ status: 'enviado', enviado_em: new Date().toISOString() }).eq('id', p.id)
      enviados++
      await new Promise(r => setTimeout(r, 200))
    } catch { erros++ }
  }

  return NextResponse.json({ enviados, erros, fila_restante: (novos?.length || 0) - enviados })
}
