import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'

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

  let totalColetados = 0
  let totalAlertas   = 0

  // ─── 1. Mercado Livre ─────────────────────────────────────────────────────
  const CATEGORIAS_ML = [
    { id: 'MLB1648', label: 'Adultos' },
    { id: 'MLB5726', label: 'Saúde e Beleza' },
  ]

  for (const cat of CATEGORIAS_ML) {
    try {
      const url = `https://api.mercadolibre.com/sites/MLB/search?category=${cat.id}&sort=sold_quantity_desc&limit=50`
      const res = await fetch(url, { next: { revalidate: 0 } })
      if (!res.ok) continue

      const dados = await res.json()
      const produtos = (dados.results ?? []) as Array<{ title: string; price: number; sold_quantity?: number; permalink?: string; thumbnail?: string }>

      for (const produto of produtos) {
        const nome   = produto.title
        const preco  = produto.price
        const vendas = produto.sold_quantity ?? 0

        const { data: existente } = await supabase
          .from('produtos_tendencia')
          .select('id, vendas_hoje, vendas_ontem')
          .ilike('produto_nome', nome)
          .maybeSingle()

        if (existente) {
          const crescimento = existente.vendas_ontem > 0
            ? ((vendas - existente.vendas_ontem) / existente.vendas_ontem) * 100
            : 0
          const alerta = crescimento > 30
          await supabase.from('produtos_tendencia').update({
            vendas_ontem: existente.vendas_hoje,
            vendas_hoje: vendas,
            preco_medio: preco,
            crescimento_pct: Math.round(crescimento * 10) / 10,
            alerta,
            url_produto: produto.permalink ?? null,
            imagem_url: produto.thumbnail ?? null,
            marketplace: 'Mercado Livre',
            updated_at: new Date().toISOString(),
          }).eq('id', existente.id)
          if (alerta) totalAlertas++
        } else {
          await supabase.from('produtos_tendencia').insert({
            produto_nome: nome,
            fonte: 'Mercado Livre',
            categoria: cat.label,
            vendas_hoje: vendas,
            vendas_ontem: vendas,
            preco_medio: preco,
            crescimento_pct: 0,
            alerta: false,
            url_produto: produto.permalink ?? null,
            imagem_url: produto.thumbnail ?? null,
            marketplace: 'Mercado Livre',
          })
        }
        totalColetados++
      }
    } catch (err) {
      console.error(`Erro ML ${cat.id}:`, err)
    }
  }

  // ─── 2. Google Trends RSS ─────────────────────────────────────────────────
  const TERMOS_SEXSHOP = [
    'vibrador', 'lingerie', 'calcinha', 'fantasia', 'lubrificante',
    'sex shop', 'brinquedo erotico', 'algema', 'camisinha', 'gel',
  ]

  const FEEDS_TRENDS = [
    'https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR',
  ]

  for (const feedUrl of FEEDS_TRENDS) {
    try {
      const res = await fetch(feedUrl, { next: { revalidate: 0 }, headers: { 'User-Agent': 'LuvyMetrics/1.0' } })
      if (!res.ok) continue
      const xml = await res.text()

      const parser = new XMLParser({ ignoreAttributes: false })
      const parsed = parser.parse(xml)
      const items  = parsed?.rss?.channel?.item ?? []
      const list   = Array.isArray(items) ? items : [items]

      for (const item of list) {
        const titulo: string = item?.title ?? ''
        const trafego: number = parseInt(String(item?.['ht:approx_traffic'] ?? '0').replace(/[^0-9]/g, ''), 10) || 0

        // Filtra apenas termos relacionados ao nicho
        const relevante = TERMOS_SEXSHOP.some((t) =>
          titulo.toLowerCase().includes(t)
        )
        if (!relevante) continue

        const { data: existente } = await supabase
          .from('produtos_tendencia')
          .select('id, vendas_hoje, vendas_ontem')
          .ilike('produto_nome', titulo)
          .maybeSingle()

        if (existente) {
          const crescimento = existente.vendas_ontem > 0
            ? ((trafego - existente.vendas_ontem) / existente.vendas_ontem) * 100
            : 0
          await supabase.from('produtos_tendencia').update({
            vendas_ontem: existente.vendas_hoje,
            vendas_hoje: trafego,
            crescimento_pct: Math.round(crescimento * 10) / 10,
            alerta: crescimento > 30,
            marketplace: 'Google Trends',
            updated_at: new Date().toISOString(),
          }).eq('id', existente.id)
        } else {
          await supabase.from('produtos_tendencia').insert({
            produto_nome: titulo,
            fonte: 'Google Trends',
            categoria: 'Tendência',
            vendas_hoje: trafego,
            vendas_ontem: trafego,
            preco_medio: 0,
            crescimento_pct: 0,
            alerta: false,
            marketplace: 'Google Trends',
          })
        }
        totalColetados++
      }
    } catch (err) {
      console.error('Erro Google Trends:', err)
    }
  }

  // ─── 3. Shopee (busca pública) ────────────────────────────────────────────
  const KEYWORDS_SHOPEE = ['vibrador', 'lingerie adulto', 'fantasia erotica']

  for (const keyword of KEYWORDS_SHOPEE) {
    try {
      const url = `https://shopee.com.br/api/v4/search/search_items?by=sales&keyword=${encodeURIComponent(keyword)}&limit=20&newest=0&order=desc&page_type=search`
      const res = await fetch(url, {
        next: { revalidate: 0 },
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://shopee.com.br/',
        },
      })
      if (!res.ok) continue
      const dados = await res.json()
      const items = (dados?.items ?? []) as Array<{ item_basic?: { name?: string; price?: number; historical_sold?: number; images?: string[] } }>

      for (const item of items) {
        const b = item?.item_basic
        if (!b?.name) continue
        const nome   = b.name
        const preco  = (b.price ?? 0) / 100_000
        const vendas = b.historical_sold ?? 0

        const { data: existente } = await supabase
          .from('produtos_tendencia')
          .select('id, vendas_hoje, vendas_ontem')
          .ilike('produto_nome', nome)
          .maybeSingle()

        if (existente) {
          const crescimento = existente.vendas_ontem > 0
            ? ((vendas - existente.vendas_ontem) / existente.vendas_ontem) * 100
            : 0
          await supabase.from('produtos_tendencia').update({
            vendas_ontem: existente.vendas_hoje,
            vendas_hoje: vendas,
            preco_medio: preco,
            crescimento_pct: Math.round(crescimento * 10) / 10,
            alerta: crescimento > 30,
            marketplace: 'Shopee',
            imagem_url: b.images?.[0] ? `https://cf.shopee.com.br/file/${b.images[0]}` : null,
            updated_at: new Date().toISOString(),
          }).eq('id', existente.id)
        } else {
          await supabase.from('produtos_tendencia').insert({
            produto_nome: nome,
            fonte: 'Shopee',
            categoria: 'Adultos',
            vendas_hoje: vendas,
            vendas_ontem: vendas,
            preco_medio: preco,
            crescimento_pct: 0,
            alerta: false,
            marketplace: 'Shopee',
            imagem_url: b.images?.[0] ? `https://cf.shopee.com.br/file/${b.images[0]}` : null,
          })
        }
        totalColetados++
      }
    } catch (err) {
      console.error(`Erro Shopee ${keyword}:`, err)
    }
  }

  return NextResponse.json({
    ok: true,
    coletados: totalColetados,
    alertas: totalAlertas,
    timestamp: new Date().toISOString(),
  })
}
