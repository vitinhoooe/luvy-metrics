import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: Request) {
  console.log('=== BOT CHAMADO ===')

  try {
    const body = await req.json()
    const messages = body.messages || []
    console.log('Mensagens:', messages.length)
    console.log('API Key existe:', !!process.env.ANTHROPIC_API_KEY)
    console.log('API Key início:', process.env.ANTHROPIC_API_KEY?.substring(0, 15))

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        role: 'assistant',
        content: 'Erro: ANTHROPIC_API_KEY não configurada.'
      })
    }

    const mensagensValidas = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .filter((m: any) => m.content && m.content.trim() !== '')

    // Garante que começa com mensagem do usuário
    const primeiroUser = mensagensValidas.findIndex((m: any) => m.role === 'user')
    const mensagensFiltradas = primeiroUser >= 0
      ? mensagensValidas.slice(primeiroUser)
      : mensagensValidas

    if (mensagensFiltradas.length === 0) {
      return NextResponse.json({
        role: 'assistant',
        content: 'Por favor, faça uma pergunta.'
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
        messages: mensagensFiltradas.map((m: any) => ({
          role: m.role,
          content: String(m.content)
        }))
      })
    })

    console.log('Status Anthropic:', response.status)

    if (!response.ok) {
      const erro = await response.text()
      console.error('Erro Anthropic:', erro)
      return NextResponse.json({
        role: 'assistant',
        content: 'Erro na API: ' + response.status
      })
    }

    const data = await response.json()
    const texto = data.content?.[0]?.text || 'Sem resposta'
    console.log('Resposta OK:', texto.substring(0, 50))

    return NextResponse.json({
      role: 'assistant',
      content: texto
    })

  } catch (error: any) {
    console.error('ERRO GERAL:', error.message)
    return NextResponse.json({
      role: 'assistant',
      content: 'Erro interno: ' + error.message
    })
  }
}
