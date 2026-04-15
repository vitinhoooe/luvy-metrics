import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Chamado todo domingo às 8h pelo Vercel Cron
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: perfis } = await supabase
    .from('perfis')
    .select('user_id, nome, nome_loja, whatsapp')
    .eq('relatorio_dominical', true)
    .not('whatsapp', 'is', null)

  if (!perfis?.length) return NextResponse.json({ enviados: 0 })

  const seteDiasAtras = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const { data: top10 } = await supabase
    .from('produtos_tendencia')
    .select('produto_nome, crescimento_pct, vendas_hoje')
    .gte('updated_at', seteDiasAtras)
    .order('crescimento_pct', { ascending: false })
    .limit(10)

  const listaTop10 = top10?.map((p, i) =>
    `${i + 1}. ${p.produto_nome} +${p.crescimento_pct?.toFixed(0)}%`
  ).join('\n') || 'Sem dados da semana'

  let enviados = 0

  for (const perfil of perfis) {
    if (!perfil.whatsapp) continue

    const mensagem = `📋 *RELATÓRIO SEMANAL — ${(perfil.nome_loja || perfil.nome || 'Lojista').toUpperCase()}*\n\n🏆 *TOP 10 DA SEMANA:*\n${listaTop10}\n\n📊 Ver análise completa: luvymetrics.com.br`

    await supabase.from('alertas_log').insert({
      user_id: perfil.user_id,
      tipo: 'relatorio_semanal',
      mensagem,
      whatsapp_enviado: false,
    })

    enviados++
  }

  return NextResponse.json({ enviados })
}
