import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rota protegida — chamada pelo Vercel Cron ou manualmente
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const CATEGORIAS_ML = ['MLB5726', 'MLB1648']
  let totalColetados = 0
  let totalAlertas = 0

  for (const categoria of CATEGORIAS_ML) {
    try {
      const url = `https://api.mercadolibre.com/sites/MLB/search?category=${categoria}&sort=sold_quantity_desc&limit=50`
      const res = await fetch(url, { next: { revalidate: 0 } })
      if (!res.ok) continue

      const dados = await res.json()
      const produtos = dados.results ?? []

      for (const produto of produtos) {
        const nome = produto.title as string
        const preco = produto.price as number
        const vendas = (produto.sold_quantity ?? 0) as number

        // Busca registro existente
        const { data: existente } = await supabase
          .from('produtos_tendencia')
          .select('id, vendas_hoje, vendas_ontem, crescimento_pct')
          .ilike('produto_nome', nome)
          .single()

        if (existente) {
          const crescimento = existente.vendas_ontem > 0
            ? ((vendas - existente.vendas_ontem) / existente.vendas_ontem) * 100
            : 0

          const alerta = crescimento > 30

          await supabase
            .from('produtos_tendencia')
            .update({
              vendas_ontem: existente.vendas_hoje,
              vendas_hoje: vendas,
              preco_medio: preco,
              crescimento_pct: crescimento,
              alerta,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existente.id)

          if (alerta) totalAlertas++
        } else {
          await supabase.from('produtos_tendencia').insert({
            produto_nome: nome,
            fonte: 'Mercado Livre',
            categoria: categoria === 'MLB1648' ? 'Adultos' : 'Saúde e Beleza',
            vendas_hoje: vendas,
            vendas_ontem: vendas,
            preco_medio: preco,
            crescimento_pct: 0,
            alerta: false,
          })
        }

        totalColetados++
      }
    } catch (err) {
      console.error(`Erro ao coletar categoria ${categoria}:`, err)
    }
  }

  return NextResponse.json({ coletados: totalColetados, alertas: totalAlertas })
}
