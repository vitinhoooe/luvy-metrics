import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const supabase = await createClient()

    const { data: tendencias } = await supabase
      .from('produtos_tendencia')
      .select('produto_nome, crescimento_pct, preco_medio, vendas_hoje, fonte')
      .order('crescimento_pct', { ascending: false })
      .limit(8)

    const { data: estoque } = await supabase
      .from('estoque_usuario')
      .select('produto_nome, quantidade, quantidade_minima, preco_custo, preco_venda')
      .eq('ativo', true)

    const contexto = `
TENDÊNCIAS DE HOJE:
${tendencias?.map(p => `- ${p.produto_nome}: +${p.crescimento_pct}% | ${p.vendas_hoje} vendas/dia | R$${p.preco_medio} | ${p.fonte}`).join('\n') || 'Nenhuma tendência'}

ESTOQUE:
${estoque?.map(e => {
  const s = e.quantidade <= 0 ? 'ZERADO' : e.quantidade <= e.quantidade_minima ? 'BAIXO' : 'OK'
  return `- ${e.produto_nome}: ${e.quantidade} un (${s}) | custo R$${e.preco_custo} | venda R$${e.preco_venda}`
}).join('\n') || 'Sem produtos no estoque'}`

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    const userMessages = messages.filter((m: any) => m.role !== 'system')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: `Você é o assistente do LuvyMetrics para donos de sex shop no Brasil.

${contexto}

Responda em português do Brasil.
Seja direto — máximo 100 palavras.
Use dados reais acima.
Nunca invente dados.`,
      messages: userMessages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    })

    const texto = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Não consegui processar sua pergunta.'

    return NextResponse.json({
      role: 'assistant',
      content: texto
    })
  } catch (error: any) {
    console.error('Erro bot:', error)
    return NextResponse.json({
      role: 'assistant',
      content: 'Desculpe, ocorreu um erro. Tente novamente.'
    }, { status: 200 })
  }
}
