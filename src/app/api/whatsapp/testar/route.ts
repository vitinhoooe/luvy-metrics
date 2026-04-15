import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Busca perfil
  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, nome_loja, whatsapp')
    .eq('user_id', user.id)
    .single()

  // Busca top 3 tendências
  const { data: tendencias } = await supabase
    .from('produtos_tendencia')
    .select('nome, crescimento_pct, preco_medio')
    .order('crescimento_pct', { ascending: false })
    .limit(3)

  // Busca itens com estoque baixo
  const { data: estoqueBaixo } = await supabase
    .from('estoque_usuario')
    .select('produto_nome, quantidade, quantidade_minima')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .filter('quantidade', 'lte', 'quantidade_minima')
    .limit(3)

  const nome = perfil?.nome?.split(' ')[0] ?? 'Lojista'
  const loja = perfil?.nome_loja ?? 'sua loja'
  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })

  const linhasTendencias = (tendencias ?? [])
    .map((p, i) => `${i + 1}. ${p.nome} — +${p.crescimento_pct}% 🔥`)
    .join('\n')

  const linhasEstoque = (estoqueBaixo ?? []).length > 0
    ? '\n\n⚠️ *Estoque baixo:*\n' + (estoqueBaixo ?? []).map((e) => `• ${e.produto_nome}: ${e.quantidade} un`).join('\n')
    : ''

  const preview = `🚀 *Relatório LuvyMetrics*
${agora}

Olá, ${nome}! Confira as tendências de hoje para ${loja}:

🔥 *Top tendências agora:*
${linhasTendencias || 'Nenhuma tendência encontrada hoje.'}${linhasEstoque}

📊 Acesse seu painel completo:
https://luvymetrics.com.br

_LuvyMetrics • Dados para vender mais_ 💜`

  return NextResponse.json({ preview })
}
