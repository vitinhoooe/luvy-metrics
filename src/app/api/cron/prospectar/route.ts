import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://luvymetrics.com.br'

    // 1. Busca lojas em 5 cidades por vez (economiza API)
    const cidades = ['São Paulo SP', 'Rio de Janeiro RJ', 'Belo Horizonte MG', 'Curitiba PR', 'Porto Alegre RS']
    const cidade = cidades[new Date().getDay() % cidades.length] // rotaciona por dia da semana

    console.log(`Prospecção diária: buscando em ${cidade}`)

    const buscarRes = await fetch(`${baseUrl}/api/prospectar/buscar?cidade=${encodeURIComponent(cidade)}`, {
      signal: AbortSignal.timeout(50000),
    })

    if (!buscarRes.ok) {
      console.error('Erro buscar:', await buscarRes.text())
      return NextResponse.json({ error: 'Erro ao buscar lojas' }, { status: 500 })
    }

    const buscarData = await buscarRes.json()
    const prospectos = buscarData.prospectos || []
    const comEmail = prospectos.filter((p: any) => p.email)

    console.log(`Encontrados: ${prospectos.length} lojas, ${comEmail.length} com email`)

    // 2. Envia emails para os que têm email (máx 100/dia Resend grátis)
    let enviados = 0, erros = 0
    for (const p of comEmail.slice(0, 100)) {
      try {
        const enviarRes = await fetch(`${baseUrl}/api/prospectar/enviar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: p.email, nome_loja: p.nome, cidade }),
        })
        if (enviarRes.ok) enviados++
        else erros++
        await new Promise(r => setTimeout(r, 300))
      } catch { erros++ }
    }

    console.log(`Prospecção: ${enviados} emails enviados, ${erros} erros`)

    return NextResponse.json({
      cidade,
      lojas_encontradas: prospectos.length,
      com_email: comEmail.length,
      emails_enviados: enviados,
      erros,
    })
  } catch (error: any) {
    console.error('Erro cron prospectar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
