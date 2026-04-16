import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Não autorizado', { status: 401 })

    const { messages } = await req.json()

    const [resTendencias, resEstoque, resCalculos] = await Promise.all([
      supabase
        .from('produtos_tendencia')
        .select('produto_nome, crescimento_pct, preco_medio, vendas_hoje, fonte')
        .order('crescimento_pct', { ascending: false })
        .limit(10),
      supabase
        .from('estoque_usuario')
        .select('produto_nome, quantidade, quantidade_minima, preco_custo, preco_venda')
        .eq('user_id', user.id)
        .eq('ativo', true),
      supabase
        .from('calculos')
        .select('produto_nome, custo, preco_ideal, lucro_unidade, marketplace')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const contexto = `
TENDÊNCIAS DE HOJE (ordem decrescente de crescimento):
${resTendencias.data?.map((p) =>
  `- ${p.produto_nome}: +${p.crescimento_pct?.toFixed(0)}% | ${p.vendas_hoje} vendas/dia | R$${p.preco_medio?.toFixed(2)} | ${p.fonte}`
).join('\n') || 'Nenhuma tendência coletada ainda. Dados são coletados às 6h.'}

ESTOQUE ATUAL DO USUÁRIO:
${resEstoque.data?.length
  ? resEstoque.data.map((e) => {
      const status = e.quantidade <= 0 ? 'ZERADO' : e.quantidade <= e.quantidade_minima ? 'BAIXO' : 'OK'
      return `- ${e.produto_nome}: ${e.quantidade} un (${status}) | custo R$${e.preco_custo?.toFixed(2)} | venda R$${e.preco_venda?.toFixed(2)}`
    }).join('\n')
  : 'Estoque vazio. Sugira que o usuário adicione produtos na aba Estoque.'}

ÚLTIMOS CÁLCULOS DE LUCRO:
${resCalculos.data?.map((c) =>
  `- ${c.produto_nome}: custo R$${c.custo?.toFixed(2)} → venda R$${c.preco_ideal?.toFixed(2)} | lucro R$${c.lucro_unidade?.toFixed(2)} (${c.marketplace})`
).join('\n') || 'Nenhum cálculo salvo ainda.'}`

    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: `Você é o assistente especialista do LuvyMetrics para donos de sex shop.

${contexto}

REGRAS OBRIGATÓRIAS:
- Responda sempre em português do Brasil correto
- Seja direto e prático, sem enrolação
- Use os dados reais acima para embasar todas as respostas
- Ao sugerir o que comprar, cite produtos específicos com o percentual de crescimento real
- Ao falar de estoque, mostre os dados reais do usuário
- Máximo 2 emojis por resposta
- Nunca invente dados que não estejam no contexto acima
- Máximo 150 palavras por resposta`,
      messages,
    })

    // SSE manual — compatível com o leitor do cliente
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ textDelta: chunk })}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (e) {
    console.error('Erro bot:', e)
    return new Response('Erro interno', { status: 500 })
  }
}
