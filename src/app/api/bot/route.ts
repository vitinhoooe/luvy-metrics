import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [tendencias, estoque] = await Promise.all([
      supabase
        .from('produtos_tendencia')
        .select('produto_nome, crescimento_pct, preco_medio, vendas_hoje, fonte, url_produto')
        .order('crescimento_pct', { ascending: false })
        .limit(10),
      supabase
        .from('estoque_usuario')
        .select('produto_nome, quantidade, quantidade_minima, preco_custo, preco_venda, categoria')
        .eq('user_id', user?.id ?? '')
        .eq('ativo', true),
    ])

    const contexto = `
TENDÊNCIAS DE HOJE:
${tendencias.data?.map(p =>
  `- ${p.produto_nome}: +${p.crescimento_pct}% | ${p.vendas_hoje} vendas/dia | R$${p.preco_medio} | ${p.fonte}`
).join('\n') || 'Nenhuma tendência coletada ainda'}

ESTOQUE DO USUÁRIO:
${estoque.data?.length ? estoque.data.map(e => {
  const status = e.quantidade <= 0 ? 'ZERADO' :
    e.quantidade <= e.quantidade_minima ? 'BAIXO' : 'OK'
  return `- ${e.produto_nome}: ${e.quantidade} unidades (${status}) | custo R$${e.preco_custo} | venda R$${e.preco_venda}`
}).join('\n') : 'Nenhum produto cadastrado no estoque'}
`

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: `Você é o assistente especialista do LuvyMetrics para donos de sex shop no Brasil.

${contexto}

REGRAS:
- Responda SEMPRE em português do Brasil correto
- Seja direto e prático — máximo 120 palavras por resposta
- Use SEMPRE os dados reais acima para responder
- Quando perguntarem o que comprar, cite produtos específicos com % real
- Quando perguntarem sobre estoque, mostre os dados reais
- Use no máximo 2 emojis por resposta
- NUNCA invente dados que não estão acima`,
      messages,
      maxOutputTokens: 300,
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
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Erro no bot:', error)
    return new Response('Erro interno', { status: 500 })
  }
}
