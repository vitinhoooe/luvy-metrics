import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Você é o assistente do LuvyMetrics, especialista em tendências de sex shop.
Você tem acesso aos dados de estoque e tendências do usuário.
Responda sempre em português do Brasil, seja direto e prático.
Use emojis com moderação para tornar as respostas mais amigáveis.
Quando sugerir produtos, baseie-se nos dados reais fornecidos no contexto.
Nunca invente dados que não foram fornecidos.`

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Não autorizado', { status: 401 })

    const { mensagem, historico = [] } = await req.json()
    if (!mensagem?.trim()) return new Response('Mensagem inválida', { status: 400 })

    // Busca contexto do usuário
    const [resTendencias, resEstoque, resCalculos] = await Promise.all([
      supabase
        .from('produtos_tendencia')
        .select('produto_nome, crescimento_pct, vendas_hoje, preco_medio, categoria')
        .order('crescimento_pct', { ascending: false })
        .limit(10),
      supabase
        .from('estoque_usuario')
        .select('produto_nome, quantidade, quantidade_minima, preco_custo, preco_venda')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('quantidade'),
      supabase
        .from('calculos')
        .select('produto_nome, custo, preco_ideal, lucro_unidade, margem_pct')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const contexto = `
## CONTEXTO DO USUÁRIO

### Top 10 Produtos em Tendência agora:
${resTendencias.data?.map((p) =>
  `- ${p.produto_nome}: +${p.crescimento_pct?.toFixed(0)}% crescimento, ${p.vendas_hoje} vendas/dia, preço médio R$${p.preco_medio?.toFixed(2)}`
).join('\n') || 'Nenhum dado disponível'}

### Estoque atual do usuário:
${resEstoque.data?.length
  ? resEstoque.data.map((i) => {
      const status = i.quantidade === 0 ? '🔴 ZERADO' : i.quantidade <= i.quantidade_minima ? '🟡 BAIXO' : '🟢 OK'
      return `- ${i.produto_nome}: ${i.quantidade} unidades ${status} (mín: ${i.quantidade_minima}) | custo: R$${i.preco_custo?.toFixed(2)} | venda: R$${i.preco_venda?.toFixed(2)}`
    }).join('\n')
  : 'Estoque vazio'}

### Últimos cálculos de lucro:
${resCalculos.data?.map((c) =>
  `- ${c.produto_nome}: custo R$${c.custo?.toFixed(2)}, preço ideal R$${c.preco_ideal?.toFixed(2)}, lucro R$${c.lucro_unidade?.toFixed(2)} (${c.margem_pct}% margem)`
).join('\n') || 'Nenhum cálculo salvo'}
`

    // Monta histórico de mensagens para o modelo
    const mensagens: Anthropic.MessageParam[] = [
      ...(historico as Array<{ role: 'user' | 'assistant'; content: string }>).slice(-10),
      { role: 'user', content: `${contexto}\n\n---\n\n${mensagem}` },
    ]

    // Streaming
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: mensagens,
    })

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
            }
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
  } catch (e) {
    console.error('Erro bot:', e)
    return new Response('Erro interno', { status: 500 })
  }
}
