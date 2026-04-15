import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Chamado às 7h todo dia pelo Vercel Cron
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Busca usuários com alertas diários ativados e WhatsApp cadastrado
  const { data: perfis } = await supabase
    .from('perfis')
    .select('user_id, nome, nome_loja, whatsapp')
    .eq('alertas_diarios', true)
    .not('whatsapp', 'is', null)

  if (!perfis?.length) return NextResponse.json({ enviados: 0 })

  // Busca top 5 tendências do dia
  const hoje = new Date().toISOString().split('T')[0]
  const { data: tendencias } = await supabase
    .from('produtos_tendencia')
    .select('produto_nome, crescimento_pct, vendas_hoje')
    .gte('updated_at', hoje)
    .order('crescimento_pct', { ascending: false })
    .limit(5)

  const listaTendencias = tendencias?.map((p, i) =>
    `${i + 1}. ${p.produto_nome} +${p.crescimento_pct?.toFixed(0)}% 📈`
  ).join('\n') || 'Nenhuma tendência hoje'

  let enviados = 0

  for (const perfil of perfis) {
    if (!perfil.whatsapp) continue

    // Busca estoque com itens baixos
    const { data: estoqueBaixo } = await supabase
      .from('estoque_usuario')
      .select('produto_nome, quantidade')
      .eq('user_id', perfil.user_id)
      .eq('ativo', true)
      .lte('quantidade', 5)
      .gt('quantidade', 0)
      .limit(3)

    const avisoEstoque = estoqueBaixo?.length
      ? `\n⚠️ Estoque baixo: ${estoqueBaixo.map((e) => `${e.produto_nome} (${e.quantidade} un.)`).join(', ')}`
      : ''

    const mensagem = `🔥 *BOM DIA, ${(perfil.nome_loja || perfil.nome || 'Lojista').toUpperCase()}!*\n\n📊 *TOP 5 TENDÊNCIAS HOJE:*\n${listaTendencias}${avisoEstoque}\n\n💡 Ver detalhes: luvymetrics.com.br`

    // Registra no log (integração real com WhatsApp deve usar Evolution API ou similar)
    await supabase.from('alertas_log').insert({
      user_id: perfil.user_id,
      tipo: 'relatorio_diario',
      mensagem,
      whatsapp_enviado: false, // muda para true quando integração estiver ativa
    })

    enviados++
  }

  return NextResponse.json({ enviados })
}
