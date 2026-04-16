import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Pega só a última mensagem do usuário
    const mensagens = body.messages || []
    const ultimaMensagem = mensagens
      .filter((m: any) => m.role === 'user')
      .pop()

    if (!ultimaMensagem) {
      return NextResponse.json({
        role: 'assistant',
        content: 'Não entendi. Pode repetir sua pergunta?'
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'Você é assistente especialista em sex shop no Brasil. Responda em português. Máximo 100 palavras. Seja direto e prático.',
        messages: [
          { role: 'user', content: ultimaMensagem.content }
        ]
      })
    })

    if (!response.ok) {
      const erro = await response.text()
      console.error('Erro Anthropic:', response.status, erro)
      return NextResponse.json({
        role: 'assistant',
        content: 'Erro temporário. Tente novamente em instantes.'
      })
    }

    const data = await response.json()
    const texto = data.content?.[0]?.text || 'Sem resposta.'

    return NextResponse.json({
      role: 'assistant',
      content: texto
    })

  } catch (error: any) {
    console.error('Erro geral:', error)
    return NextResponse.json({
      role: 'assistant',
      content: 'Erro interno. Tente novamente.'
    })
  }
}
