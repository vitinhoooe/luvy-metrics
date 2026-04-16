import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'

const TERMOS = [
  'vibrador', 'gel intimo', 'sex shop', 'plug anal',
  'calcinha sensual', 'pompoarismo', 'preservativo',
  'algemas', 'fantasia erotica', 'lingerie',
]

const TERMOS_TRENDS = [
  'vibrador', 'lingerie', 'calcinha', 'fantasia', 'lubrificante',
  'sex shop', 'brinquedo erotico', 'algema', 'camisinha', 'gel',
]

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
  let totalAlertas = 0

  // Helper: upsert produto
  async function upsertProduto(opts: {
    nome: string; preco: number; vendas: number; url?: string | null;
    imagem?: string | null; marketplace: string; fonte: string; categoria: string
  }) {
    const { data: existente } = await supabase
      .from('produtos_tendencia')
      .select('id, vendas_hoje, vendas_ontem')
      .ilike('produto_nome', opts.nome)
      .maybeSingle()

    if (existente) {
      const crescimento = existente.vendas_ontem > 0
        ? ((opts.vendas - existente.vendas_ontem) / existente.vendas_ontem) * 100 : 0
      const alerta = crescimento > 30
      await supabase.from('produtos_tendencia').update({
        vendas_ontem: existente.vendas_hoje,
        vendas_hoje: opts.vendas,
        preco_medio: opts.preco,
        crescimento_pct: Math.round(crescimento * 10) / 10,
        alerta,
        url_produto: opts.url ?? null,
        imagem_url: opts.imagem ?? null,
        marketplace: opts.marketplace,
        fonte: opts.fonte,
        updated_at: new Date().toISOString(),
      }).eq('id', existente.id)
      if (alerta) totalAlertas++
    } else {
      await supabase.from('produtos_tendencia').insert({
        produto_nome: opts.nome,
        fonte: opts.fonte,
        categoria: opts.categoria,
        vendas_hoje: opts.vendas,
        vendas_ontem: opts.vendas,
        preco_medio: opts.preco,
        crescimento_pct: 0,
        alerta: false,
        url_produto: opts.url ?? null,
        imagem_url: opts.imagem ?? null,
        marketplace: opts.marketplace,
      })
    }
    totalColetados++
  }

  // ─── FONTE 1: Mercado Livre (categoria + termos) ──────────────
  async function coletarML() {
    // Categoria adultos
    const urls = [
      'https://api.mercadolibre.com/sites/MLB/search?category=MLB1648&sort=sold_quantity_desc&limit=30',
      ...TERMOS.map(t => `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(t)}&sort=sold_quantity_desc&limit=20`)
    ]

    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) continue
        const dados = await res.json()
        const items = (dados.results ?? []) as any[]

        for (const item of items.slice(0, 20)) {
          const termo = url.includes('?q=') ? decodeURIComponent(url.split('?q=')[1].split('&')[0]) : 'Adultos'
          await upsertProduto({
            nome: item.title,
            preco: item.price,
            vendas: item.sold_quantity ?? 0,
            url: item.permalink ?? null,
            imagem: item.thumbnail ?? null,
            marketplace: 'Mercado Livre',
            fonte: 'Mercado Livre',
            categoria: termo.charAt(0).toUpperCase() + termo.slice(1),
          })
        }
      } catch (err) {
        console.error('Erro ML:', err)
      }
    }
  }

  // ─── FONTE 2: Shopee (tentativa) ──────────────────────────────
  async function coletarShopee() {
    for (const keyword of TERMOS.slice(0, 5)) {
      try {
        const url = `https://shopee.com.br/api/v4/search/search_items?by=sales&keyword=${encodeURIComponent(keyword)}&limit=20&newest=0&order=desc&page_type=search`
        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://shopee.com.br',
            'Accept': 'application/json',
          },
        })
        if (!res.ok) continue
        const dados = await res.json()
        const items = (dados?.items ?? []) as any[]

        for (const item of items) {
          const b = item?.item_basic
          if (!b?.name) continue
          await upsertProduto({
            nome: b.name,
            preco: (b.price ?? 0) / 100000,
            vendas: b.historical_sold ?? 0,
            url: null,
            imagem: b.images?.[0] ? `https://cf.shopee.com.br/file/${b.images[0]}` : null,
            marketplace: 'Shopee',
            fonte: 'Shopee',
            categoria: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          })
        }
      } catch {
        // Shopee pode bloquear — ignora silenciosamente
      }
    }
  }

  // ─── FONTE 3: Google Trends RSS ───────────────────────────────
  async function coletarGoogleTrends() {
    try {
      const res = await fetch('https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR', {
        cache: 'no-store',
        headers: { 'User-Agent': 'LuvyMetrics/1.0' },
      })
      if (!res.ok) return
      const xml = await res.text()
      const parser = new XMLParser({ ignoreAttributes: false })
      const parsed = parser.parse(xml)
      const items = parsed?.rss?.channel?.item ?? []
      const list = Array.isArray(items) ? items : [items]

      for (const item of list) {
        const titulo: string = item?.title ?? ''
        const trafego = parseInt(String(item?.['ht:approx_traffic'] ?? '0').replace(/[^0-9]/g, ''), 10) || 0
        const relevante = TERMOS_TRENDS.some(t => titulo.toLowerCase().includes(t))
        if (!relevante) continue

        await upsertProduto({
          nome: titulo,
          preco: 0,
          vendas: trafego,
          url: null,
          imagem: null,
          marketplace: 'Google Trends',
          fonte: 'Google Trends',
          categoria: 'Tendência',
        })
      }
    } catch (err) {
      console.error('Erro Google Trends:', err)
    }
  }

  // Execute all 3 in parallel with allSettled
  await Promise.allSettled([coletarML(), coletarShopee(), coletarGoogleTrends()])

  return NextResponse.json({
    ok: true,
    coletados: totalColetados,
    alertas: totalAlertas,
    timestamp: new Date().toISOString(),
  })
}
